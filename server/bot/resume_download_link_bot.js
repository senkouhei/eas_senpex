// resume_download_link_bot.js
// Scrapes the download link from the previously saved resume link and updates Supabase
import { getCandidatorsWithoutUrl, getCandidatorsCountWithUrl, updateCandidatorDownloadLink } from '../database/candidators.js';

import WebSocket from 'ws';

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
  if (!ws) return;
  const msg = JSON.stringify(data);
  ws.send(msg);
}

let resume_download_link_bot_running = false;

async function run() {
  if (resume_download_link_bot_running) return;
  resume_download_link_bot_running = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 150000))
  } catch (err) {
    console.error(err.message || err);
  } finally {
    resume_download_link_bot_running = false;
  }
}

run();