import { WebSocketServer } from 'ws';
import { getCountOfAllCandidators, getCandidatorsCountWithContactInfo, getCandidatorsCountWithTwilioSMS, getCandidatorsCountWithUrl } from '../database/candidators.js';

let wss = null;
let botStatuses = {
  'whole': {running: true},
  'gmail_fetch_bot.js': {running: false, count: 0},
  'resume_download_link_bot.js': {running: false, count: 0},
  'contact_info_extraction_bot.js': {running: false, count: 0},
  'twilio_sms_bot.js': {running: false, count: 0},
};

export async function initWebSocketServer(server) {
  await initData();
  wss = new WebSocketServer({ server, path: '/ws' });
  console.log("WebSocket server initialized");
  wss.on('connection', (ws) => {
    console.log('Client connected');
    // Removed ws.on('open') as it's for clients only
    broadcast(botStatuses);
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        broadcastBotStatus(data.bot, data.running, data.count);
      } catch (e) {
        console.error('Invalid message:', message);
      }
    });
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
}

export async function initData() {
  const totalCandidators = await getCountOfAllCandidators();
  const fetchedResumes = await getCandidatorsCountWithUrl();
  const extractedContacts = await getCandidatorsCountWithContactInfo();
  const transferredSMS = await getCandidatorsCountWithTwilioSMS();
  botStatuses = {
    'whole': {running: true},
    'gmail_fetch_bot.js': {running: false, count: totalCandidators},
    'resume_download_link_bot.js': {running: false, count: fetchedResumes},
    'contact_info_extraction_bot.js': {running: false, count: extractedContacts},
    'twilio_sms_bot.js': {running: false, count: transferredSMS},
  }
}

export function broadcast(data) {
  if (!wss) return;
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

export function broadcastBotStatus(bot, running, count = 0) {
  if (!bot) return;

  if (!botStatuses[bot]) botStatuses[bot] = {};
  botStatuses[bot].running = running;
  if (count !== 0) {
    botStatuses[bot].count = count;
  }

  // Ensure 'whole' exists before setting running
  if (!botStatuses["whole"]) botStatuses["whole"] = {};
  botStatuses["whole"].running = true;
  broadcast(botStatuses);
}