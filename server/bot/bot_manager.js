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
  'resume_download_link_bot.js',
  'contact_info_extraction_bot.js',
  'twilio_sms_bot.js',
];

const processes = {};

export async function startBot(bot) {
  try {
    if (await getSetting(bot) === 'ON') {
      const botPath = path.join(__dirname, bot);
      const proc = spawn('node', [botPath], { stdio: 'inherit' });
      processes[bot] = proc;
      broadcastBotStatus(bot, true);
      await logEvent('bot_manager.js', 'INFO', 'Started ' + bot + ' (PID: ' + proc.pid + ')');
      proc.on('exit', async (code, signal) => {
        broadcastBotStatus(bot, false);
        await logEvent('bot_manager.js', 'INFO', bot + ' exited with code ' + code + ' (signal: ' + signal + '). Restarting...');
        setTimeout(() => startBot(bot), 2000); // Restart after 2 seconds
      });
    } else {
      setTimeout(() => startBot(bot), 1000);
    }
  } catch (err) {
    await logEvent('bot_manager.js', 'ERROR', err.message || err);
  }
}

export async function startAllBots() {
  await Promise.all(bots.map(startBot));
}


export async function toggleBot(bot, enabled) {
  if (enabled) {
    await startBot(bot);
  } else {
    if (processes[bot]) {
      processes[bot].kill();
    }
  }
}