// contact_info_extraction_bot.js
// Extracts contact info from downloaded resume files and updates Supabase
import { getCandidatorsWithoutContactInfo, updateCandidatorContactInfo } from '../database/candidators.js';
import fs from 'fs';
import pdfParse from 'pdf-parse';

function extractContactInfo(text) {
  // Simple regex-based extraction (customize as needed)
  const nameMatch = text.match(/Name[:\s]+([A-Za-z ]+)/i);
  const phoneMatch = text.match(/(\+?\d[\d\s\-]{7,}\d)/);
  const cityMatch = text.match(/City[:\s]+([A-Za-z ]+)/i);
  const stateMatch = text.match(/State[:\s]+([A-Za-z ]+)/i);
  return {
    name: nameMatch ? nameMatch[1].trim() : null,
    phone: phoneMatch ? phoneMatch[1].trim() : null,
    city: cityMatch ? cityMatch[1].trim() : null,
    state: stateMatch ? stateMatch[1].trim() : null,
  };
}

async function run() {
  const candidators = await getCandidatorsWithoutContactInfo();
  for (const c of candidators) {
    try {
      const dataBuffer = fs.readFileSync(c.download_link);
      const pdfData = await pdfParse(dataBuffer);
      const info = extractContactInfo(pdfData.text);
      await updateCandidatorContactInfo(c.gmail_id, info);
      console.log(`Updated contact info for ${c.gmail_id}`);
    } catch (err) {
      console.error(`Failed to extract contact info for ${c.gmail_id}:`, err.message);
    }
  }
}

run();