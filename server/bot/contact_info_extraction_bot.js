// contact_info_extraction_bot.js
// Extracts contact info from downloaded resume files and updates Supabase
import { getCandidatorsWithoutContactInfo, updateCandidatorContactInfo, getCandidatorsCountWithContactInfo } from '../database/candidators.js';
import WebSocket from 'ws';
import path from 'path';
import axios from 'axios';
import { OpenAI } from 'openai';
import Tesseract from 'tesseract.js';
import * as mammoth from 'mammoth';
import { convert } from 'pdf-poppler';
import fs from 'fs';
import settingsService from '../services/SettingsService.js';

const totalCandidators = await getCandidatorsCountWithContactInfo();
const OPENAI_API_KEY = settingsService.get('OPENAI_API_KEY');
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

let ws = null;
function connectWebSocket() {
  ws = new WebSocket(process.env.VITE_WS_URL || 'ws://localhost:5000/ws');
  ws.on('open', () => {
    broadcast({ bot: 'contact_info_extraction_bot.js', running: true, count: totalCandidators });
  });
  ws.on('close', () => {
    broadcast({ bot: 'contact_info_extraction_bot.js', running: false, count: totalCandidators });
    setTimeout(connectWebSocket, 1000);
  });
}
connectWebSocket();

function broadcast(data) {
  if (!ws || !ws.readyState === WebSocket.OPEN) return;
  const msg = JSON.stringify(data);
  ws.send(msg);
}

let contact_info_extraction_bot_running = false;

async function extractTextFromPdf(pdfPath) {
  const outputDir = path.join(process.cwd(), 'tmp_files');
  fs.mkdirSync(outputDir, { recursive: true });

  await convert(pdfPath, {
    format: 'png',
    out_dir: outputDir,
    out_prefix: 'page',
    page: null
  });

  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));
  let fullText = '';

  for (const file of files) {
    const { data: { text } } = await Tesseract.recognize(path.join(outputDir, file), 'eng');
    fullText += text + '\n';
  }

  return fullText.trim();
}

function extractTextFromTxt(buffer) {
  // Assumes UTF-8 encoding
  return buffer.toString('utf8');
}

async function extractTextFromDocx(buffer) {
  // Uses mammoth to extract text from docx buffer
  const result = await mammoth.extractRawText({ buffer });
  return result.value; // The extracted text
}

/**
 * Downloads a file from a URL to a specific directory.
 * @param {string} url - The file URL.
 * @param {string} destDir - The directory to save the file.
 * @param {string} [filename] - Optional filename. If not provided, uses the last part of the URL.
 * @returns {Promise<string>} - The full path to the saved file.
 */
async function downloadFile(url, destDir, filename) {
  // Ensure directory exists
  fs.mkdirSync(destDir, { recursive: true });

  // Determine filename
  if (!filename) {
    filename = path.basename(new URL(url).pathname);
  }
  const filePath = path.join(destDir, filename);

  // Download and stream to file
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    method: 'get',
    url,
    responseType: 'stream'
  });

  response.data.pipe(writer);

  // Return a promise that resolves when done
  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filePath));
    writer.on('error', (err) => {
      fs.unlinkSync(filePath); // Remove incomplete file
      reject(err);
    });
  });
}

/**
 * Gets the filename from the Content-Disposition header, if present.
 * @param {string} contentDisposition
 * @returns {string|null}
 */
function getFilenameFromContentDisposition(contentDisposition) {
  if (!contentDisposition) return null;
  const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i);
  return match ? decodeURIComponent(match[1]) : null;
}

async function getFilenameFromUrl(url) {
  // Use HEAD request to get headers only (no body)
  const response = await axios.head(url);
  const contentDisposition = response.headers['content-disposition'];
  return getFilenameFromContentDisposition(contentDisposition);
}

async function extractContactInfo(text) {
  const prompt = `Extract the following information from this resume text:
- Name
- Email
- Phone number
- City
- State

Resume text:
${text}

Respond in JSON format with keys: name, email, phone_number, city, state.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt }
    ],
    temperature: 0,
  });

  let output = response.choices[0].message.content.trim();

  // Remove code block markers if present
  if (output.startsWith("```")) {
    output = output.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
  }

  return JSON.parse(output);
}

async function run() {
  let count = 0;
  const candidators = await getCandidatorsWithoutContactInfo();
  for (const c of candidators) {
    try {
      const outputDir = path.join(process.cwd(), 'tmp_files');
      fs.mkdirSync(outputDir, { recursive: true });

      const filename = await getFilenameFromUrl(c.resume_url);

      console.log('downloading file', filename);
      const savedPath = await downloadFile(
        c.resume_url,
        outputDir,
        filename
      );

      const type = savedPath.split('.').pop();
      const fileBuffer = fs.readFileSync(savedPath);
      let text = '';
      if (type === 'pdf') {
        text = await extractTextFromPdf(savedPath);
      } else if (type === 'txt') {
        text = await extractTextFromTxt(fileBuffer);
      } else if (type === 'docx' || type === 'doc') {
        text = await extractTextFromDocx(fileBuffer);
      } else {
        console.log('Unknown file type, possibly .txt');
      }
      
      const info = await extractContactInfo(text);
      await updateCandidatorContactInfo(c.gmail_id, {...info, contact_extracted: 1});
      count++;
      broadcast({ bot: 'contact_info_extraction_bot.js', running: true, count: totalCandidators + count });
      // Remove the tmp_images directory and its contents
      fs.rmSync(outputDir, { recursive: true, force: true });
      console.log(`Updated contact info for ${c.gmail_id}`);
    } catch (err) {
      await updateCandidatorContactInfo(c.gmail_id, {contact_extracted: 2});
      console.error(`Failed to extract contact info for ${c.gmail_id} (${c.resume_url}):`, err.message);
      broadcast({ bot: 'contact_info_extraction_bot.js', running: false, count: totalCandidators + count });
    }
  }
}

run();