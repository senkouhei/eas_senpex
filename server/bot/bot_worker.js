import { Worker } from 'bullmq';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connection = { url: process.env.REDIS_URL };

const botWorker = new Worker(
  'botQueue',
  async job => {
    const { bot } = job.data;
    try {
      const botPath = path.join(__dirname, bot);
      const botUrl = pathToFileURL(botPath).href;
      // Dynamically import the bot file and run its main logic
      const botModule = await import(botUrl);
      if (typeof botModule.default === 'function') {
        await botModule.default();
      } else if (typeof botModule.run === 'function') {
        await botModule.run();
      } else {
        // Fallback: run the file as a script (if it self-executes)
        // Do nothing, just importing will run the script
      }
    } catch (err) {
      console.error(`Error running bot ${bot}:`, err);
      throw err;
    }
  },
  { connection, lockDuration: 600000 } // 10 minutes
);

botWorker.on('completed', job => {
  console.log(`Bot job ${job.name} completed`);
});
botWorker.on('failed', (job, err) => {
  console.error(`Bot job ${job?.name} failed:`, err);
});
