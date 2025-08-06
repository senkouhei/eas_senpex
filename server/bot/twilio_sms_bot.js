// twilio_sms_bot.js
// Sends SMS using Twilio based on extracted contact info
import { getCandidatorsToNotify, markCandidatorNotified } from '../database/candidators.js';
import twilio from 'twilio';
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;
const client = twilio(accountSid, authToken);

async function run() {
  const candidators = await getCandidatorsToNotify();
  for (const c of candidators) {
    if (!c.phone) continue;
    try {
      await client.messages.create({
        body: `Hi ${c.name}, thank you for your application!`,
        from: fromNumber,
        to: c.phone
      });
      await markCandidatorNotified(c.gmail_id);
      console.log(`SMS sent to ${c.phone}`);
    } catch (err) {
      console.error(`Failed to send SMS to ${c.phone}:`, err.message);
    }
  }
}

run();