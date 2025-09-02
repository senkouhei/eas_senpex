// bot_manager.js
// Manages the four bot processes, restarts if any exit unexpectedly
import { Queue } from 'bullmq';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSetting } from '../database/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bots = [
  'gmail_fetch_bot.js',
  // 'resume_download_link_bot.js',
  // 'contact_info_extraction_bot.js',
  'twilio_sms_bot.js',
];

// BullMQ connection (default localhost Redis)
const connection = { host: '127.0.0.1', port: 6379 };
const botQueue = new Queue('botQueue', { connection });

async function scheduleBotJobs() {
  for (const bot of bots) {
    if (await getSetting(bot) === 'ON') {
      // Add a repeatable job for each bot (every 1 minute by default)
      await botQueue.add(
        bot,
        { bot },
        {
          repeat: { every: 60 * 1000 }, // every 1 minute
          removeOnComplete: true,
          removeOnFail: true,
        }
      );
    }
  }
}

scheduleBotJobs();