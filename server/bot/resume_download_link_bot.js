// resume_download_link_bot.js
// Scrapes the download link from the previously saved resume link and updates Supabase
import { getCandidatorsWithoutUrl, getCandidatorsCountWithUrl, updateCandidatorDownloadLink } from '../database/candidators.js';

import WebSocket from 'ws';
import axios from 'axios';

const totalCandidators = await getCandidatorsCountWithUrl();

let ws = null;
function connectWebSocket() {
  ws = new WebSocket('ws://localhost:5000/ws');
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

async function getDownloadLink(url) {
  try {
    const response = await axios.get('http://localhost:6000/get_resume_url', {
      params: { url }
    });
    // Expecting the result in response.data.download_link or similar
    return response.data.path || null;
  } catch (err) {
    console.error('Failed to get download link:', err.message);
    return null;
  }
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
          const download_link = await getDownloadLink(candidator.url);
          if (!download_link) {
            console.log(`No download link found for ${candidator.gmail_id}`);
            continue;
          }
          await updateCandidatorDownloadLink(candidator.gmail_id, download_link);
          count++;
          broadcast({ bot: 'resume_download_link_bot.js', running: true, count: totalCandidators + count });
        }
      } catch (err) {
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