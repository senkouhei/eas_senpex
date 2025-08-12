// twilio_sms_bot.js
// Sends SMS using Twilio based on extracted contact info
import { getCandidatorsToNotify, setCandidatorSMSStatus, getCandidatorsCountWithTwilioSMS } from '../database/candidators.js';
import twilio from 'twilio';
import WebSocket from 'ws';
import settingsService from '../services/SettingsService.js';
const accountSid = settingsService.get('TWILIO_ACCOUNT_SID');
const authToken = settingsService.get('TWILIO_AUTH_TOKEN');
const fromNumber = settingsService.get('TWILIO_PHONE_NUMBER');
const client = twilio(accountSid, authToken);
const totalCandidators = await getCandidatorsCountWithTwilioSMS();
import { formatPhoneNumber } from '../utils/phone.js';

let ws = null;
function connectWebSocket() {
  ws = new WebSocket(process.env.VITE_WS_URL || 'ws://localhost:5000/ws');
  ws.on('open', () => {
    broadcast({ bot: 'twilio_sms_bot.js', running: true, count: totalCandidators });
  });
  ws.on('close', () => {
    broadcast({ bot: 'twilio_sms_bot.js', running: false, count: totalCandidators });
    setTimeout(connectWebSocket, 1000);
  });
}
connectWebSocket();

function broadcast(data) {
  if (!ws || !ws.readyState === WebSocket.OPEN) return;
  const msg = JSON.stringify(data);
  ws.send(msg);
}


async function run() {

  let count = 0;
  const candidators = await getCandidatorsToNotify();
  for (const c of candidators) {
    if (!c.phone_number) continue;
    try {
      await client.messages.create({
        body: "Earn an additional $100 bonus after every 5 completed deliveries when you deliver with Senpex!\nRegister now to learn more:\nhttps://senpexwebinars.com/\nJoin our daily webinars hosted by CEO & Co-Founder, Sean Modd and the Head of Dispatching, Kali Norman.\n",
        from: formatPhoneNumber(fromNumber),
        to: formatPhoneNumber(c.phone)
      });
      await setCandidatorSMSStatus(c.gmail_id, 1);
      count++;
      broadcast({ bot: 'twilio_sms_bot.js', running: true, count: totalCandidators + count });
      console.log(`SMS sent to ${c.phone_number}`);
    } catch (err) {
      await setCandidatorSMSStatus(c.gmail_id, 2);
      console.error(`Failed to send SMS to ${c.phone_number}:`, err.message);
    }
  }
}

run();