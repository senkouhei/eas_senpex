// gmail_fetch_bot.js
// Fetches Gmail IDs, sender, timestamp, and resume link from Gmail and saves to Supabase
import { getGoogleServiceInstance } from '../utils/google.js';
import { insertCandidator, getUnknownGmailIds, getCountOfAllCandidators } from '../database/candidators.js';
import WebSocket from 'ws';

const totalCandidators = await getCountOfAllCandidators();

let ws = null;
function connectWebSocket() {
  ws = new WebSocket(process.env.WS_URL || 'ws://localhost:5000/ws');
  ws.on('open', () => {
    broadcast({ bot: 'gmail_fetch_bot.js', running: true, count: totalCandidators });
  });
  ws.on('close', () => {
    broadcast({ bot: 'gmail_fetch_bot.js', running: false, count: totalCandidators });
    setTimeout(connectWebSocket, 1000);
  });
}
connectWebSocket();

function broadcast(data) {
  if (!ws) return;
  const msg = JSON.stringify(data);
  ws.send(msg);
}

let gmail_fetch_bot_running = false;

async function run() {
  if (gmail_fetch_bot_running) return;
  gmail_fetch_bot_running = true;
  try {
    const googleService = getGoogleServiceInstance();
    if (googleService.init) await googleService.init();

    const emails = await googleService.fetchIndeedEmails();
    console.log('emails count', emails.length);
    if (emails.length > 0) {
      // Batch check for unknown Gmail IDs
      const allIds = emails.map(e => e.id);
      const unknownIds = await getUnknownGmailIds(allIds);
      

      let insertedCount = 0;
      for (const email of unknownIds) {
        try {
          const data = await googleService.getEmailHtmlAndSender(email);
          if (data.resumeLink) {
            await insertCandidator({
              gmail_id: email,
              gmail_name: data.sender,
              gmail_timestamp: data.datetime,
              url: data.resumeLink
            });
          } else {
            console.log("candidate's resume link not found", email);
          }
          insertedCount++;
          broadcast({bot: 'gmail_fetch_bot.js', running: true, count: totalCandidators + insertedCount});
          console.log('insertedCount', insertedCount);
        } catch (err) {
          console.error(err.message || err);
        }
      }
    }
  } catch (err) {
    console.error(err.message || err);
  } finally {
    gmail_fetch_bot_running = false;
  }
}

run();