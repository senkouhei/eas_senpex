import express from 'express';
import { insertReply } from '../database/sms_reply.js';
import twilio from 'twilio';
const { MessagingResponse } = twilio.twiml;
import { replyToSMS } from '../utils/openai.js';

const router = express.Router();

router.post('/reply', async (req, res) => {
  const { from, body } = req.body;
  const replyObj = {
    from,
    message: body,
  }
  await insertReply(replyObj);
  const reply = await replyToSMS(body);
  const twiml = new MessagingResponse();

  twiml.message(reply);

  res.type('text/xml').send(twiml.toString());
});

export default router;