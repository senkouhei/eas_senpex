import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] }); // Headed mode reduces bot detection

  const page = await browser.newPage();
  await page.goto('https://www.ziprecruiter.com/authn/employer/login');

  // Set a realistic user-agent to match the IP’s region and browser version
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  );

  // Randomize viewport slightly to avoid fingerprinting from consistent dimensions
  await page.setViewport({
    width: Math.floor(1024 + Math.random() * 100),
    height: Math.floor(768 + Math.random() * 100),
  });

  const isCaptcha = await page.$('iframe[src*="captcha"], iframe[src*="turnstile"]');

  if (isCaptcha) {
    console.log('CAPTCHA triggered');
    // You may want to skip, retry with a new proxy, or solve it with a 3rd-party service
  }

  const cookies = await page.cookies();

  const localStorageData = await page.evaluate(() => {
    // const data = {};
    // for (let i = 0; i < localStorage.length; i++) {
    //   const key = localStorage.key(i);
    //   data[key] = localStorage.getItem(key);
    // }
    // return data;
  });
})();