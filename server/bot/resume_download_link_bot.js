// resume_download_link_bot.js
// Scrapes the download link from the previously saved resume link and updates Supabase
import { getCandidatorsWithoutUrl, getCandidatorsCountWithUrl, updateCandidatorDownloadLink } from '../database/candidators.js';

import WebSocket from 'ws';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import settingsService from '../services/SettingsService.js';
import { URL } from 'url';

const totalCandidators = await getCandidatorsCountWithUrl();

let ws = null;
function connectWebSocket() {
  ws = new WebSocket(process.env.VITE_WS_URL || 'ws://localhost:5000/ws');
  ws.on('open', () => {
    broadcast({ bot: 'resume_download_link_bot.js', running: true, count: totalCandidators });
  });
  ws.on('close', () => {
    broadcast({ bot: 'resume_download_link_bot.js', running: false, count: totalCandidators });
    setTimeout(connectWebSocket, 1000);
  });
}
connectWebSocket();

function broadcast(data) {
  if (!ws || !ws.readyState === WebSocket.OPEN) return;
  const msg = JSON.stringify(data);
  ws.send(msg);
}

let resume_download_link_bot_running = false;

async function getResumeDownloadLink(url) {
  const apiKey = settingsService.get('SCRAPERAPI_KEY');
  const response = await fetch(`https://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render=true`);
  // Get the sa-final-url header
  const finalUrl = response.headers.get('sa-final-url');
  if (finalUrl) {
    try {
      const parsed = new URL(finalUrl);
      const id = parsed.searchParams.get('id');
      return id ? `https://employers.indeed.com/api/catws/public/resume/download?id=${encodeURIComponent(id)}&publicResumeTk=undefined` : null
    } catch (e) {
      console.error('Failed to parse sa-final-url:', e);
      return null;
    }
  }
  // fallback: parse HTML if needed
  const html = await response.text();
  const $ = cheerio.load(html);
  const href = $('a[data-testid="header-download-resume-button"]').attr('href');
  return href || null;
}

async function run() {
  if (resume_download_link_bot_running) return;
  resume_download_link_bot_running = true;
  let count = 0;
  try {
    const candidators = await getCandidatorsWithoutUrl();
    for (const candidator of candidators) {
      try {
        if (candidator.url) {
          const download_link = await getResumeDownloadLink(candidator.url);
          if (!download_link) {
            console.log(`No download link found for ${candidator.gmail_id}`);
            await updateCandidatorDownloadLink(candidator.gmail_id, null, false);
            continue;
          }
          await updateCandidatorDownloadLink(candidator.gmail_id, download_link, true);
          count++;
          broadcast({ bot: 'resume_download_link_bot.js', running: true, count: totalCandidators + count });
          console.log(`Updated download link for ${candidator.gmail_id}`);
        }
      } catch (err) {
        await updateCandidatorDownloadLink(candidator.gmail_id, null, false);
        console.error(`Error processing candidator ${candidator.gmail_id}:`, err.message || err);
      }
    }
  } catch (err) {
    console.error(err.message || err);
  } finally {
    resume_download_link_bot_running = false;
    broadcast({ bot: 'resume_download_link_bot.js', running: false, count: totalCandidators + count });
  }
}

run().catch(err => {
  console.error('Unhandled error in resume_download_link_bot:', err.message || err);
});