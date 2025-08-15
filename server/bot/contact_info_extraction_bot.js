// contact_info_extraction_bot.js
// Extracts contact info from downloaded resume files and updates Supabase
import { getCandidatorsWithoutContactInfo, updateCandidatorContactInfo, getCandidatorsCountWithContactInfo } from '../database/candidators.js';
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

const totalCandidators = await getCandidatorsCountWithContactInfo();

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

  // Convert PDF pages to images using pdf2pic
  const buff = await fsp.readFile(pdfPath);

  // Initialize the library, you can do this once for the whole application
  // and reuse the library instance.
  const library = await PDFiumLibrary.init();

  // Load the document from the buffer
  // You can also pass "password" as the second argument if the document is encrypted.
  const document = await library.loadDocument(buff);

  // Iterate over the pages, render them to PNG images and
  // save to the output folder
  let index = 0;
  for (const page of document.pages()) {
    console.log(`${page.number} - rendering...`);

    // Render PDF page to PNG image
    const image = await page.render({
      scale: 3, // 3x scale (72 DPI is the default)
      render: renderFunction,  // sharp function to convert raw bitmap data to PNG
    });

    // Save the PNG image to the output folder
    await fsp.writeFile(path.join(outputDir, `${index}.png`), Buffer.from(image.data));
    index++;
  }

  // Do not forget to destroy the document and the library
  // when you are done.
  document.destroy();
  library.destroy();
  // Get number of pages

  let fullText = '';
  for (let i = 0; i < index; i++) {
    const imgPath = path.join(outputDir, `${i}.png`);
    const { data: { text } } = await Tesseract.recognize(imgPath, 'eng');
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
      info.phone_number = formatPhoneNumber(info.phone_number);
      await updateCandidatorContactInfo(c.gmail_id, {...info, contact_extracted: 1});
      count++;
      broadcast({ bot: 'contact_info_extraction_bot.js', running: true, count: totalCandidators + count });
      // Remove the tmp_images directory and its contents
      fs.rmSync(outputDir, { recursive: true, force: true });
      console.log(`Updated contact info for ${c.gmail_id}`);
    } catch (err) {
      if (err.status === 404) {
        await updateCandidatorContactInfo(c.gmail_id, {contact_extracted: 2, is_available: false});
        console.error(`Failed to extract contact info for ${c.gmail_id} (${c.resume_url}):`, err.message);
      } else {
        await updateCandidatorContactInfo(c.gmail_id, {contact_extracted: 2});
        console.error(`Failed to extract contact info for ${c.gmail_id} (${c.resume_url}):`, err.message);
      }
    }
  }
}

run();