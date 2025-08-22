import { OpenAI } from 'openai';
import { getSetting } from '../database/settings.js';

const OPENAI_API_KEY = await getSetting('OPENAI_API_KEY');
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function extractContactInfo(text) {
  try {

    const prompt = `Extract the following information from this resume text:
- Name
- Email
- Phone number
- City (if not found, return null)
- State (2 letter code, if not found, return null)

Resume text:
${text}

Respond in JSON format with keys: name, email, phone_number, city, state.`;
  
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0,
    });
  
    let output = response.choices[0].message.content.trim();
  
    // Remove code block markers if present
    if (output.startsWith("```")) {
      output = output.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
    }
  
    return JSON.parse(output);
  } catch (err) {
    console.error(`Failed to extract contact info:`, err.message);
  }
}

export async function replyToSMS(text) {
  try {

    const prompt = `I sent this SMS:
Earn an additional $100 bonus after every 5 completed deliveries when you deliver with Senpex!
Register now to learn more:
https://senpexwebinars.com/
Join our daily webinars hosted by CEO & Co-Founder, Sean Modd and the Head of Dispatching, Kali Norman.

Then some one replied with this:
${text}

Reply to the SMS with a message that is relevant to the SMS.`;
  
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that replies to SMS messages." },
        { role: "user", content: prompt }
      ],
      temperature: 0,
    });
  
    let output = response.choices[0].message.content.trim();
  
    // Remove code block markers if present
    if (output.startsWith("```")) {
      output = output.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
    }
  
    return output;
  } catch (err) {
    console.error(`Failed to extract contact info:`, err.message);
  }
}