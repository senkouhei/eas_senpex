// bot_manager.js
// Manages the four bot processes, restarts if any exit unexpectedly
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { broadcastBotStatus } from '../utils/websocket.js';
import { logEvent } from '../utils/log.js';
import { getSetting } from '../database/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bots = [
  'gmail_fetch_bot.js',
  // 'resume_download_link_bot.js',
  // 'contact_info_extraction_bot.js',
  'twilio_sms_bot.js',
];

const processes = {};

async function startBot(bot) {
  try {
    const botPath = path.join(__dirname, bot);
    const proc = spawn('node', [botPath], { stdio: 'inherit' });
    processes[bot] = proc;
    if (await getSetting(bot) === 'ON') {
      await broadcastBotStatus(bot, true);
    }
    proc.on('exit', async (code, signal) => {
      try {
        await broadcastBotStatus(bot, false);
        if (code !== 0) {
          await logEvent('bot_manager.js', 'ERROR', bot + ' exited with code ' + code + ' (signal: ' + signal + '). Restarting...');
        }
        setTimeout(() => startBot(bot), 20000); // Restart after 2 seconds
      } catch (err) {
        await logEvent('bot_manager.js', 'ERROR', err.message || err);
      }
    });
  } catch (err) {
    await logEvent('bot_manager.js', 'ERROR', err.message || err);
  }
}

async function startAllBots() {
  await Promise.all(bots.map(startBot));
}


async function toggleBot(bot, enabled) {
  if (enabled) {
    await startBot(bot);
  } else {
    if (processes[bot]) {
      processes[bot].kill();
    }
  }
}

startAllBots();