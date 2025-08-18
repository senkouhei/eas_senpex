// twilio_sms_bot.js
// Sends SMS using Twilio based on extracted contact info
import { getCandidatorsToNotify, setCandidatorSMSStatus, getCandidatorsCountWithTwilioSMS } from '../database/candidators.js';
import twilio from 'twilio';
import WebSocket from 'ws';
import { getSetting } from '../database/settings.js';
const accountSid = await getSetting('TWILIO_ACCOUNT_SID');
const authToken = await getSetting('TWILIO_AUTH_TOKEN');
const fromNumber = await getSetting('TWILIO_PHONE_NUMBER');
const client = twilio(accountSid, authToken);
import { formatPhoneNumber } from '../utils/phone.js';
import { logEvent } from '../utils/log.js';

if (await getSetting('twilio_sms_bot.js') === 'ON') {
  await logEvent('twilio_sms_bot.js', 'INFO', 'Started twilio_sms_bot.js');

  let ws = null;
  function connectWebSocket() {
    ws = new WebSocket(process.env.VITE_WS_URL || 'ws://localhost:5000/ws');
    ws.on('open', () => {
      broadcast({ bot: 'twilio_sms_bot.js', running: true });
    });
    ws.on('close', () => {
      broadcast({ bot: 'twilio_sms_bot.js', running: false });
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
    try {
      let count = 0;
      const candidators = await getCandidatorsToNotify() || [];
      for (const c of candidators) {
        if (!c.phone_number) continue;
        try {
          await client.messages.create({
            body: "Earn an additional $100 bonus after every 5 completed deliveries when you deliver with Senpex!\nRegister now to learn more:\nhttps://senpexwebinars.com/\nJoin our daily webinars hosted by CEO & Co-Founder, Sean Modd and the Head of Dispatching, Kali Norman.\n",
            from: formatPhoneNumber(fromNumber),
            to: formatPhoneNumber(c.phone_number)
          });
          await setCandidatorSMSStatus(c.gmail_id, 1);
          count++;
          broadcast({ bot: 'twilio_sms_bot.js', running: true });
          await logEvent('twilio_sms_bot.js', 'SUCCESS', 'SMS sent to ' + c.phone_number);
        } catch (err) {
          await setCandidatorSMSStatus(c.gmail_id, 2);
          await logEvent('twilio_sms_bot.js', 'ERROR', 'Failed to send SMS to ' + c.phone_number + ':' + err.message);
        }
      }
    } catch (err) {
      await logEvent('twilio_sms_bot.js', 'ERROR', err.message || err);
    } finally {
      broadcast({ bot: 'twilio_sms_bot.js', running: false});
    }
  }

  run().then(async () => {
    await logEvent('twilio_sms_bot.js', 'INFO', 'Finished twilio_sms_bot.js');
    process.exit(0);
  }).catch(err => {
    logEvent('twilio_sms_bot.js', 'ERROR', err.message || err).catch(console.error);
    process.exit(1);
  });
}