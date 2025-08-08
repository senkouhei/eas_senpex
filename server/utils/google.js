import fs from 'fs';
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();
import * as cheerio from 'cheerio';
import readline from 'readline';
import open from 'open';

const CREDENTIALS_FILE = process.env.CREDENTIALS_FILE || 'credentials.json';
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || 'token_google.json';
const SCOPES = [
  process.env.GMAIL_SCOPE || 'https://www.googleapis.com/auth/gmail.readonly',
  process.env.DRIVE_SCOPE || 'https://www.googleapis.com/auth/drive.file',
  process.env.SHEETS_SCOPE || 'https://www.googleapis.com/auth/spreadsheets',
];

const TOKEN_FILES = {
  gmail: TOKEN_PATH,
  drive: TOKEN_PATH,
  sheets: TOKEN_PATH,
};
const API_VERSIONS = {
  gmail: { api: 'gmail', version: 'v1' },
  drive: { api: 'drive', version: 'v3' },
  sheets: { api: 'sheets', version: 'v4' },
};

class GoogleService {
  constructor() {
    this.oAuth2Client = null;
    this.gmailClient = null;
    this.driveClient = null;
    this.sheetsClient = null;
    this.init();
  }

  async ensureToken(tokenPath, oAuth2Client) {
    try {
      if (fs.existsSync(tokenPath)) {
        return JSON.parse(fs.readFileSync(tokenPath));
      }
      // Token does not exist, start OAuth flow
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      console.log('Authorize this app by visiting this url:', authUrl);
      await open(authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const code = await new Promise(resolve => rl.question('Enter the code from that page here: ', answer => {
        rl.close();
        resolve(answer);
      }));
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      fs.writeFileSync(tokenPath, JSON.stringify(tokens));
      console.log('Token stored to', tokenPath);
      return tokens;
    } catch (err) {
      console.error(err.message || err);
      throw err;
    } 
  }

  async init() {
    this.gmailClient = await this.getServiceWithToken("gmail");
    this.driveClient = await this.getServiceWithToken("drive");
    this.sheetsClient = await this.getServiceWithToken("sheets");
  }

  getGmailService() {
    if (!this.gmailClient) {
      this.gmailClient = google.gmail({ version: 'v1', auth: this.oAuth2Client });
    }
    return this.gmailClient;
  }

  getDriveService() {
    if (!this.driveClient) {
      this.driveClient = google.drive({ version: 'v3', auth: this.oAuth2Client });
    }
    return this.driveClient;
  }

  getSheetsService() {
    if (!this.sheetsClient) {
      this.sheetsClient = google.sheets({ version: 'v4', auth: this.oAuth2Client });
    }
    return this.sheetsClient;
  }

  async appendRowToSheet(spreadsheetId, row) {
    const sheets = this.getSheetsService();
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetName = sheetMeta.data.sheets[0].properties.title;
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1:Z1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row],
      },
    });
    return res.data;
  }

  async getEmailHtmlAndSender(msgId) {
    const msg = await this.gmailClient.users.messages.get({ userId: 'me', id: msgId, format: 'full' });
    let sender = 'unknown';
    const headers = msg.data.payload.headers;
    for (const header of headers) {
      if (header.name.toLowerCase() === 'from') {
        sender = header.value;
        const match = sender.match(/"?([^"<]*)"?\s*<.*>/);
        if (match) {
          sender = match[1].trim().replace(/ /g, '_');
        } else {
          sender = sender.split('<')[0].trim().replace(/ /g, '_');
        }
        break;
      }
    }

    let datetime = Math.floor(msg.data.internalDate);;

    // Recursively search for text/html part
    function findHtmlPart(parts) {
      for (const part of parts) {
        if (part.mimeType === 'text/html' && part.body && part.body.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.parts && Array.isArray(part.parts)) {
          const html = findHtmlPart(part.parts);
          if (html) return html;
        }
      }
      return null;
    }

    let html = null;
    const payload = msg.data.payload;
    if (payload.parts && Array.isArray(payload.parts)) {
      html = findHtmlPart(payload.parts);
    }
    // Fallback: single-part message
    if (!html && payload.mimeType === 'text/html' && payload.body && payload.body.data) {
      html = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }
    // Ensure html is a string for cheerio.load
    const $ = cheerio.load(typeof html === 'string' ? html : '');
    let resumeLink = null;
    $('a[href]').each((_, a) => {
      const linkText = $(a).text().trim().toLowerCase();
      if (linkText.includes('view resume')) {
        resumeLink = $(a).attr('href');
        return false;
      }
    });
    return { html, sender, datetime, resumeLink };
  }

  async fetchIndeedEmails(beforeTs = null, afterTs = null) {
    let query = 'indeed view resume';
    if (afterTs) query += ` after:${afterTs}`;
    if (beforeTs) query += ` before:${beforeTs}`;
    let allMessages = [];
    let nextPageToken = null;
    do {
      const res = await this.gmailClient.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 10000,
        pageToken: nextPageToken,
      });
      const messages = res.data.messages || [];
      allMessages = allMessages.concat(messages);
      nextPageToken = res.data.nextPageToken;
    } while (nextPageToken);
    console.log(`Found ${allMessages.length} emails`);
    return allMessages;
  }

  extractViewResumeLink(html) {
    const $ = cheerio.load(html);
    let foundLink = null;
    $('a[href]').each((_, a) => {
      const linkText = $(a).text().trim().toLowerCase();
      if (linkText.includes('view resume')) {
        foundLink = $(a).attr('href');
        return false;
      }
    });
    return foundLink;
  }

  /**
   * Reads all data from the specified Indeed Google Sheet.
   * @param {string} spreadsheetId - The ID of the spreadsheet.
   * @param {string} [range='Sheet1'] - The range to read (default is 'Sheet1').
   * @returns {Promise<Array>} - The values from the sheet.
   */
  async getIndeedSheetData(spreadsheetId, range = 'Sheet1') {
    const sheets = this.getSheetsService();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return res.data.values || [];
  }

  async getServiceWithToken(serviceName) {
    if (!TOKEN_FILES[serviceName] || !API_VERSIONS[serviceName]) {
      throw new Error(`Unknown service name: ${serviceName}`);
    }
    const tokenPath = TOKEN_FILES[serviceName];
    const { api, version } = API_VERSIONS[serviceName];
    if (!fs.existsSync(CREDENTIALS_FILE)) {
      throw new Error(`Credentials file not found: ${CREDENTIALS_FILE}`);
    }
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    // Ensure token exists or generate it interactively
    const tokens = await this.ensureToken(tokenPath, this.oAuth2Client);
    this.oAuth2Client.setCredentials(tokens);
    let client;
    if (api === 'gmail') {
      if (!this.gmailClient) this.gmailClient = google.gmail({ version, auth: this.oAuth2Client });
      client = this.gmailClient;
    } else if (api === 'drive') {
      if (!this.driveClient) this.driveClient = google.drive({ version, auth: this.oAuth2Client });
      client = this.driveClient;
    } else if (api === 'sheets') {
      if (!this.sheetsClient) this.sheetsClient = google.sheets({ version, auth: this.oAuth2Client });
      client = this.sheetsClient;
    }
    return client;
  }
}

// Singleton instance
let instance = null;
export function getGoogleServiceInstance() {
  if (!instance) {
    instance = new GoogleService();
  }
  return instance;
}
