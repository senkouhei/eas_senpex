import express from 'express';
import { insertReply } from '../database/sms_reply.js';
import twilio from 'twilio';
const { MessagingResponse } = twilio.twiml;
import { replyToSMS } from '../utils/openai.js';
import { logEvent } from '../utils/log.js';
import { formatPhoneNumber } from '../utils/phone.js';

import { getSetting } from '../database/settings.js';
const accountSid = await getSetting('TWILIO_ACCOUNT_SID');
const authToken = await getSetting('TWILIO_AUTH_TOKEN');
const fromNumber = await getSetting('TWILIO_PHONE_NUMBER');
const client = twilio(accountSid, authToken);

const router = express.Router();

router.post('/reply', async (req, res) => {
  try {
    const { From, Body } = req.body;
    const reply = await replyToSMS(Body);
    
    const replyObj = {
      from: From,
      message: Body,
      response: reply,
    }
    await insertReply(replyObj);
    const twiml = new MessagingResponse();

    twiml.message(reply || 'Sorry, there was an error processing your message.');

    res.type('text/xml').send(twiml.toString());
  } catch (err) {
    console.error('Error in /reply route:', err);
    const twiml = new MessagingResponse();
    twiml.message('Sorry, there was an error processing your message.' + err.message);
    res.type('text/xml').status(500).send(twiml.toString());
  }
});

router.post('/send', async (req, res) => {
  const { phone_number, message } = req.body;
  try {
    const response = await client.messages.create({
      body: message,
      from: formatPhoneNumber(fromNumber),
      to: formatPhoneNumber(phone_number)
    });
    const replyObj = {
      from: formatPhoneNumber(phone_number),
      message: null,
      response: message,
    }
    await insertReply(replyObj);
    res.status(200).json({ message: 'SMS sent successfully' });
  } catch (err) {
    console.error('Error in /send route:', err);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

export default router;