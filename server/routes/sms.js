import express from 'express';
import { insertReply } from '../database/sms_reply.js';
import twilio from 'twilio';
const { MessagingResponse } = twilio.twiml;
import { replyToSMS } from '../utils/openai.js';

const router = express.Router();

router.post('/reply', async (req, res) => {
  try {
    console.log('Received SMS reply:', req.body);
    const { from, body } = req.body;
    const replyObj = {
      from,
      message: body,
    }
    await insertReply(replyObj);
    const reply = await replyToSMS(body);
    const twiml = new MessagingResponse();

    twiml.message(reply || 'Sorry, there was an error processing your message.');

    res.type('text/xml').send(twiml.toString());
  } catch (err) {
    console.error('Error in /reply route:', err);
    const twiml = new MessagingResponse();
    twiml.message('Sorry, there was an error processing your message.');
    res.type('text/xml').status(500).send(twiml.toString());
  }
});

export default router;