// resume_download_link_bot.js
// Scrapes the download link from the previously saved resume link and updates Supabase
import { getCandidatorsWithoutUrl, getCandidatorsCountWithUrl, updateCandidatorDownloadLink } from '../database/candidators.js';
import { logEvent } from '../utils/log.js';
import WebSocket from 'ws';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { getSetting } from '../database/settings.js';
// import puppeteer from 'puppeteer';

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
    // Get the sa-final-url header
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
    // fallback: parse HTML if needed
    const html = await response.text();
    const $ = cheerio.load(html);
    const href = $('a[data-testid="header-download-resume-button"]').attr('href');
    return href || null;
  }

  async function run() {
    let count = 0;
    try {
      const candidators = await getCandidatorsWithoutUrl();
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
    } finally {
      broadcast({ bot: 'resume_download_link_bot.js', running: false, count: totalCandidators + count });
    }
  }

  run().then(async () => {
    await logEvent('resume_download_link_bot.js', 'INFO', 'Finished resume_download_link_bot.js');
    process.exit(0);
  }).catch(err => {
    logEvent('resume_download_link_bot.js', 'ERROR', err.message || err).catch(console.error);
    process.exit(1);
  });

  // async function run() {
    // const url = 'https://www.ziprecruiter.com/k/t/AALYOikFEY08lXnd5NbY_BGlTDikqnyOyDN6dOT5dPQ0x9uYt80O60aDIIXGfFPLhtl5DIoE7juJRSpqSMk1u4RyveLjneaIEttO7patknlRi7TXOcIG7goEAKbB5_tQM8NlVnB-2Ps7ajjJYKPPa39kuy3-bmYOZ9GJAOuIPjA85HWNxJQWUFITp8OGzhK69h_rxIUIkflimLnl8hLBzcxwRdUKzqqg7YgK8LKNk40Yd_huMP3Ehi8SUhMw7SmsQFiINUU2Ar5ysUqjgdBLupUrylcwnLtSGBH1ajwHfwd3_fHwOFU2AT2aZbl9LO--xq1aeqoxI3U0I_LD';
    // const url = 'https://www.ziprecruiter.com/contact/response/2ec6791f/f2c011e1?response_id=dda1cb84&tsid=110000001&utm_medium=candidate_name#tabOriginalResume';
    // const apiKey = settingsService.get('SCRAPERAPI_KEY');
    // const response = await fetch(`https://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render=true`);
    // // Get the sa-final-url header
    // const finalUrl = response.headers.get('sa-final-url');
    // if (finalUrl) {
    //   try {
    //     const parsed = new URL(finalUrl);
    //     const id = parsed.searchParams.get('id');
    //     return id ? `https://employers.indeed.com/api/catws/public/resume/download?id=${encodeURIComponent(id)}&publicResumeTk=undefined` : null
    //   } catch (e) {
    //     console.error('Failed to parse sa-final-url:', e);
    //     return null;
    //   }
    // }
    // // fallback: parse HTML if needed
    // const html = await response.text();
    // const $ = cheerio.load(html);
    // const href = $('a[data-testid="header-download-resume-button"]').attr('href');
    // return href || null;
    
  //   const browser = await puppeteer.launch({ headless: false });
  //   const page = await browser.newPage();

  //   await page.goto('https://www.ziprecruiter.com/authn/employer/login');
  //   await page.type('#«r2»', 'sean@pckup.com');
  //   // await page.type('#password', 'YOUR_PASSWORD');
  //   await page.click('#«r3»');
  //   await page.waitForNavigation();

  //   await page.goto('https://www.ziprecruiter.com/candidates');

  //   let candidates = [];
  //   let hasNext = true;

  //   while (hasNext) {
  //     const pageCandidates = await page.$$eval('.candidate-card', els =>
  //       els.map(el => ({
  //         name: el.querySelector('.name')?.textContent.trim(),
  //         location: el.querySelector('.location')?.textContent.trim(),
  //         resumeSnippet: el.querySelector('.resume-snippet')?.textContent.trim()
  //       }))
  //     );
  //     candidates.push(...pageCandidates);

  //     hasNext = await page.$('.next-page-button') !== null;
  //     if (hasNext) {
  //       await page.click('.next-page-button');
  //       await page.waitForTimeout(2000);
  //     }
  //   }

  //   console.log(candidates);
  //   await browser.close();
  // }

  // run().catch(err => {
  //   console.error('Unhandled error in resume_download_link_bot:', err.message || err);
  // });
}