// resume_download_link_bot.js
// Scrapes the download link from the previously saved resume link and updates Supabase
import { getCandidatorsWithoutUrl, updateCandidatorDownloadLink } from '../database/candidators.js';
import { logEvent } from '../utils/log.js';
import WebSocket from 'ws';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { getSetting } from '../database/settings.js';
import { fileURLToPath } from 'url';
// import puppeteer from 'puppeteer';

export async function run() {
  if (await getSetting('resume_download_link_bot.js') === 'ON') {
    await logEvent('resume_download_link_bot.js', 'INFO', 'Started resume_download_link_bot.js');
    let ws = null;
    function connectWebSocket() {
      ws = new WebSocket(process.env.VITE_WS_URL || 'ws://localhost:5000/ws');
      ws.on('open', () => {
        broadcast({ bot: 'resume_download_link_bot.js', running: true });
      });
      ws.on('close', () => {
        broadcast({ bot: 'resume_download_link_bot.js', running: false });
        setTimeout(connectWebSocket, 1000);
      });
    }
    connectWebSocket();
    function broadcast(data) {
      if (!ws || !ws.readyState === WebSocket.OPEN) return;
      const msg = JSON.stringify(data);
      ws.send(msg);
    }
    async function getResumeDownloadLink(url) {
      const apiKey = await getSetting('SCRAPERAPI_KEY');
      const response = await fetch(`https://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render=true`);
      const finalUrl = response.headers.get('sa-final-url');
      if (finalUrl) {
        try {
          const parsed = new URL(finalUrl);
          const id = parsed.searchParams.get('id');
          return id ? `https://employers.indeed.com/api/catws/public/resume/download?id=${encodeURIComponent(id)}&publicResumeTk=undefined` : null
        } catch (e) {
          console.error('Failed to parse sa-final-url:', e);
          return null;
        }
      }
      const html = await response.text();
      const $ = cheerio.load(html);
      const href = $('a[data-testid="header-download-resume-button"]').attr('href');
      return href || null;
    }
    try {
      let count = 0;
      const candidators = await getCandidatorsWithoutUrl() || [];
      for (const candidator of candidators) {
        try {
          if (candidator.url) {
            const download_link = await getResumeDownloadLink(candidator.url);
            if (!download_link) {
              await logEvent('resume_download_link_bot.js', 'FAILED', 'No download link found for ' + candidator.gmail_id);
              await updateCandidatorDownloadLink(candidator.gmail_id, null, false);
              continue;
            }
            await updateCandidatorDownloadLink(candidator.gmail_id, download_link, true);
            count++;
            broadcast({ bot: 'resume_download_link_bot.js', running: true });
            await logEvent('resume_download_link_bot.js', 'SUCCESS', 'Updated download link for ' + candidator.gmail_id, download_link);
          }
        } catch (err) {
          await updateCandidatorDownloadLink(candidator.gmail_id, null, false);
          await logEvent('resume_download_link_bot.js', 'ERROR', 'Error processing candidator ' + candidator.gmail_id + ':' + err.message || err);
        }
      }
    } catch (err) {
      await logEvent('resume_download_link_bot.js', 'ERROR', err.message || err);
    }
    await logEvent('resume_download_link_bot.js', 'INFO', 'Finished resume_download_link_bot.js');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(`file://${process.argv[1]}`)) {
  run();
}