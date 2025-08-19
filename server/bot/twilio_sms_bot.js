// twilio_sms_bot.js
// Sends SMS using Twilio based on extracted contact info
import { getCandidatorsToNotify, setCandidatorSMSStatus } from '../database/candidators.js';
import twilio from 'twilio';
import WebSocket from 'ws';
import { getSetting } from '../database/settings.js';
const accountSid = await getSetting('TWILIO_ACCOUNT_SID');
const authToken = await getSetting('TWILIO_AUTH_TOKEN');
const fromNumber = await getSetting('TWILIO_PHONE_NUMBER');
const client = twilio(accountSid, authToken);
import { formatPhoneNumber } from '../utils/phone.js';
import { logEvent } from '../utils/log.js';
import { updateCandidatorSMSStatusBySid, getCandidatesPedingSMS } from '../database/candidators.js';
// import axios from 'axios';

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

  // async function fetchAllMessages(pageSize = 20) {
  //   let messages = [];
  //   let nextPageUrl = null;
  //   do {
  //     if (!nextPageUrl) {
  //       const page = await client.messages.page({
  //         from: formatPhoneNumber(fromNumber),
  //         pageSize,
  //       });
  //       nextPageUrl = page.nextPageUrl;
  //       messages = messages.concat(page.instances);
  //     } else {
  //       const response = await axios.get(nextPageUrl, {
  //         auth: {
  //           username: accountSid,
  //           password: authToken
  //         }
  //       });
  //       if (response.data.next_page_uri) {
  //         nextPageUrl = 'https://api.twilio.com' + response.data.next_page_uri;
  //       } else {
  //         nextPageUrl = null;
  //       }
  //       messages = messages.concat(response.data.messages);
  //     }
  //   } while (nextPageUrl);
  
  //   return messages;
  // }
  
  async function fetchMessage(sid) {
    const message = await client
      .messages(sid)
      .fetch();
  
    return message;
  }

  async function fetchCandidatesStatus() {
    const candidates = await getCandidatesPedingSMS();
    for (const c of candidates) {
      const { sms_sid } = c;
      try {
        const data = await fetchMessage(sms_sid);
        const { status, dateSent, body } = data;
        console.log(status, dateSent);
        await updateCandidatorSMSStatusBySid(sms_sid, status, dateSent || new Date().toISOString(), body);         
      } catch (error) {
        console.error(error);
      }
    }
  }

  async function run() {
    // const messages = await fetchAllMessages(1000)
    // messages.forEach(async (m) => {
    //   const { sid, status, to, dateSent, body } = m;
    //   try {
    //     await updateCandidatorSMSStatus({ phone_number: to, sid, datetime: dateSent || new Date().toISOString(), status, body });          
    //   } catch (error) {
    //     console.error(error);
    //   }
    // });
    try {
      await fetchCandidatesStatus();
    } catch (err) {
      await logEvent('twilio_sms_bot.js', 'ERROR', err.message || err);
    }

    try {
      let count = 0;
      const candidators = await getCandidatorsToNotify() || [];
      for (const c of candidators) {
        if (!c.phone_number) continue;
        try {
          const message = await client.messages.create({
            body: "Earn an additional $100 bonus after every 5 completed deliveries when you deliver with Senpex!\nRegister now to learn more:\nhttps://senpexwebinars.com/\nJoin our daily webinars hosted by CEO & Co-Founder, Sean Modd and the Head of Dispatching, Kali Norman.\n",
            from: formatPhoneNumber(fromNumber),
            to: formatPhoneNumber(c.phone_number)
          });
          await setCandidatorSMSStatus(c.gmail_id, 1, message.sid, message.dateSent, message.status, message.body);
          count++;
          broadcast({ bot: 'twilio_sms_bot.js', running: true });
          await logEvent('twilio_sms_bot.js', 'SUCCESS', 'SMS sent to ' + c.phone_number);
        } catch (err) {
          await setCandidatorSMSStatus(c.gmail_id, 2, null, null, null, null);
          await logEvent('twilio_sms_bot.js', 'ERROR', 'Failed to send SMS to ' + c.phone_number + ':' + err.message);
        }
      }
    } catch (err) {
      await logEvent('twilio_sms_bot.js', 'ERROR', err.message || err);
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