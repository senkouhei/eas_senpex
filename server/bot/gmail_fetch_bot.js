// gmail_fetch_bot.js
// Fetches Gmail IDs, sender, timestamp, and resume link from Gmail and saves to Supabase
import { getGoogleServiceInstance } from '../utils/google.js';
import { insertCandidator, getUnknownGmailIds } from '../database/candidators.js';
import WebSocket from 'ws';
import { logEvent } from '../utils/log.js';
import { getSetting } from '../database/settings.js';
import { fileURLToPath } from 'url';

export async function run() {
  console.log('gmail_fetch_bot.js: run() started');
  if (await getSetting('gmail_fetch_bot.js') === 'ON') {
    await logEvent('gmail_fetch_bot.js', 'INFO', 'Started gmail_fetch_bot.js');
    let ws = null;
    function connectWebSocket() {
      ws = new WebSocket(process.env.VITE_WS_URL);
      ws.on('open', () => {
        broadcast({ bot: 'gmail_fetch_bot.js', running: true });
      });
      ws.on('close', () => {
        broadcast({ bot: 'gmail_fetch_bot.js', running: false });
        setTimeout(connectWebSocket, 1000);
      });
    }
    function broadcast(data) {
      if (!ws) return;
      const msg = JSON.stringify(data);
      ws.send(msg);
    }
    if (process.env.VITE_WS_URL) {
      connectWebSocket();
    }
    try {
      const googleService = getGoogleServiceInstance();
      if (googleService.init) await googleService.init();
      const emails = await googleService.fetchIndeedEmails();
      if (emails.length > 0) {
        const allIds = emails.map(e => e.id);
        const unknownIds = await getUnknownGmailIds(allIds) || [];
        await logEvent('gmail_fetch_bot.js', 'INFO', 'New emails count: ' + unknownIds.length.toString());
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
              insertedCount++;
              await googleService.markAsRead(email);
              if (ws) broadcast({bot: 'gmail_fetch_bot.js', running: true});
              await logEvent('gmail_fetch_bot.js', 'SUCCESS', 'Inserted resume: ' + data.sender, data.resumeLink);
            } else {
              await googleService.markAsRead(email);
              await logEvent('gmail_fetch_bot.js', 'FAILED', "Resume link not found:" + data.sender, "https://mail.google.com/mail/u/0/#inbox/" + email);
            }
          } catch (err) {
            await logEvent('gmail_fetch_bot.js', 'ERROR', err.message || err, "https://www.google.com/inbox/u/0/" + email);
          }
        }
        const knownIds = allIds.filter(id => !unknownIds.includes(id));
        for (const email of knownIds) {
          await googleService.markAsRead(email)
        }
      }
    } catch (err) {
      await logEvent('gmail_fetch_bot.js', 'ERROR', err.message || err);
    } finally {
      if (ws) broadcast({ bot: 'gmail_fetch_bot.js', running: false });
    }
    await logEvent('gmail_fetch_bot.js', 'INFO', 'Finished gmail_fetch_bot.js');
  }
  console.log('gmail_fetch_bot.js: run() finished');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(`file://${process.argv[1]}`)) {
  run();
}