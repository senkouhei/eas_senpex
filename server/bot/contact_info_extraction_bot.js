// contact_info_extraction_bot.js
// Extracts contact info from downloaded resume files and updates Supabase
import { getCandidatorsWithoutContactInfo, updateCandidatorContactInfo } from '../database/candidators.js';
import WebSocket from 'ws';
import path from 'path';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import * as mammoth from 'mammoth';
import { PDFiumLibrary } from "@hyzyla/pdfium";
import fs from 'fs';
import { promises as fsp } from 'fs';
import sharp from 'sharp';
import { formatPhoneNumber } from '../utils/phone.js';
import { extractContactInfo } from '../utils/openai.js';
import { logEvent } from '../utils/log.js';
import { getSetting } from '../database/settings.js';
import usStates from "us-state-codes";
import { fileURLToPath } from 'url';

export async function run() {
  if (await getSetting('contact_info_extraction_bot.js') === 'ON') {
    await logEvent('contact_info_extraction_bot.js', 'INFO', 'Started contact_info_extraction_bot.js'); 
    let ws = null;
    function connectWebSocket() {
      ws = new WebSocket(process.env.VITE_WS_URL || 'ws://localhost:5000/ws');
      ws.on('open', () => {
        broadcast({ bot: 'contact_info_extraction_bot.js', running: true });
      });
      ws.on('close', () => {
        broadcast({ bot: 'contact_info_extraction_bot.js', running: false });
        setTimeout(connectWebSocket, 1000);
      });
    }
    connectWebSocket();
    function broadcast(data) {
      if (!ws || !ws.readyState === WebSocket.OPEN) return;
      const msg = JSON.stringify(data);
      ws.send(msg);
    }
    async function renderFunction(options) {
      return await sharp(options.data, {
        raw: {
          width: options.width,
          height: options.height,
          channels: 4,
        },
      })
        .png()
        .toBuffer();
    }
    async function extractTextFromPdf(pdfPath) {
      const outputDir = path.join(process.cwd(), 'tmp_files');
      fs.mkdirSync(outputDir, { recursive: true });
      const buff = await fsp.readFile(pdfPath);
      const library = await PDFiumLibrary.init();
      const document = await library.loadDocument(buff);
      let index = 0;
      for (const page of document.pages()) {
        const image = await page.render({
          scale: 3,
          render: renderFunction,
        });
        await fsp.writeFile(path.join(outputDir, `${index}.png`), Buffer.from(image.data));
        index++;
      }
      document.destroy();
      library.destroy();
      let fullText = '';
      for (let i = 0; i < index; i++) {
        const imgPath = path.join(outputDir, `${i}.png`);
        const { data: { text } } = await Tesseract.recognize(imgPath, 'eng');
        fullText += text + '\n';
      }
      return fullText.trim();
    }
    function extractTextFromTxt(buffer) {
      return buffer.toString('utf8');
    }
    async function extractTextFromDocx(buffer) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    async function downloadFile(url, destDir, filename) {
      fs.mkdirSync(destDir, { recursive: true });
      if (!filename) {
        filename = path.basename(new URL(url).pathname);
      }
      const filePath = path.join(destDir, filename);
      const writer = fs.createWriteStream(filePath);
      const response = await axios({
        method: 'get',
        url,
        responseType: 'stream'
      });
      response.data.pipe(writer);
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', (err) => {
          fs.unlinkSync(filePath);
          reject(err);
        });
      });
    }
    function getFilenameFromContentDisposition(contentDisposition) {
      if (!contentDisposition) return null;
      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i);
      return match ? decodeURIComponent(match[1]) : null;
    }
    async function getFilenameFromUrl(url) {
      const response = await axios.head(url);
      const contentDisposition = response.headers['content-disposition'];
      return getFilenameFromContentDisposition(contentDisposition);
    }
    try {
      const candidators = await getCandidatorsWithoutContactInfo() || [];
      for (const c of candidators) {
        try {
          const outputDir = path.join(process.cwd(), 'tmp_files');
          fs.mkdirSync(outputDir, { recursive: true });
          const filename = await getFilenameFromUrl(c.resume_url);
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
            text = extractTextFromTxt(fileBuffer);
          } else if (type === 'docx' || type === 'doc') {
            text = await extractTextFromDocx(fileBuffer);
          } else {
            await logEvent('contact_info_extraction_bot.js', 'FAILED', 'Unknown file type: ' + type);
          }
          const info = await extractContactInfo(text);
          info.phone_number = formatPhoneNumber(info.phone_number);
          let stateCode = usStates.getStateCodeByStateName(info.state);
          if (!stateCode) {
            stateCode = info.state || null;
          }
          logEvent('contact_info_extraction_bot.js', 'INFO', 'State code: ' + stateCode + ' for ' + info.state);
          await updateCandidatorContactInfo(c.gmail_id, {...info, contact_extracted: 1, state: stateCode});
          broadcast({ bot: 'contact_info_extraction_bot.js', running: true });
          fs.rmSync(outputDir, { recursive: true, force: true });
          await logEvent('contact_info_extraction_bot.js', 'SUCCESS', 'Updated contact info for ' + c.gmail_id);
        } catch (err) {
          if (err.status === 404) {
            await updateCandidatorContactInfo(c.gmail_id, {contact_extracted: 2, is_available: false});
            await logEvent('contact_info_extraction_bot.js', 'FAILED', 'Resume isn\'t longer available: ' + c.gmail_id, c.resume_url);
          } else {
            await updateCandidatorContactInfo(c.gmail_id, {contact_extracted: 2});
            await logEvent('contact_info_extraction_bot.js', 'ERROR', 'Failed to extract contact info for ' + c.gmail_id + ' (' + c.resume_url + '):' + err.message);
          }
        }
      }
    } catch (err) {
      await logEvent('contact_info_extraction_bot.js', 'ERROR', err.message || err);
    }
    await logEvent('contact_info_extraction_bot.js', 'INFO', 'Finished contact_info_extraction_bot.js');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(`file://${process.argv[1]}`)) {
  run();
}