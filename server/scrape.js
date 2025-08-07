import * as  FirecrawlApp from '@mendable/firecrawl-js';

const app = new FirecrawlApp({ apiKey: 'YOUR_API_KEY' });

// Function to scrape with retry logic
async function scrapeWithRetry(url) {
  try {
    // First try with default proxy
    const content = await app.scrapeUrl(url);
    
    // Check if we got an error status code
    const statusCode = content?.metadata?.statusCode;
    if ([401, 403, 500].includes(statusCode)) {
      console.log(`Got status code ${statusCode}, retrying with stealth proxy`);
      // Retry with stealth proxy
      return await app.scrapeUrl(url, {
        proxy: 'stealth'
      });
    }
    
    return content;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Retry with stealth proxy on exception
    try {
      return await app.scrapeUrl(url, {
        proxy: 'stealth'
      });
    } catch (retryError) {
      console.error(`Stealth proxy also failed: ${retryError.message}`);
      throw retryError;
    }
  }
}

// Usage
const content = await scrapeWithRetry('https://example.com');
console.log(content.markdown);

let encoded_url = encodeURIComponent('https://cts.indeed.com/v1/H4sIAAAAAAAA_02Q3W6CQBCFX8WQ2KtaAa2ojWkEqy0o_lRFe7eyi2xdYFkWlRrfvaPcOBc7M-c7k2zORcmVrhJKybNuvU4izpKCiOyFxpgQ_OInUd1HMaYYSZLVBcnyiLwLEqwo7mm_WisNJG8dJA7aauMJRfwN9P6t5tuTkf0V1iwxraMbWE4nddi4r5tITUd2VR9qrn20V7amp1Xd9GZmk7d0rs_ZBFbAU2hyaWjF1htFue1hjY1B2n0B20zU6QcM5l6Dx_dU6n8bi9aGrHfN-bAh4wHqCDMUCw8vgoB0Zs6noy7gcPUT2Ntze-waLjP2Mm9WG4P7r3157pEIUVZDnDPqI0mT-E4CkUS9B7FW2iAfeqQ4R0x5ViKle1F8cByWoUjyfQiRSpETQKVacALSmpJTpYywwmh8AMyRILFcHoDetiST1sPBynXcqecCkTdHmXf-GqadbN9WVeV6_QdfeQsXvwEAAA/f0FOt_hMI0Kd8Iah_ZCnRzuAycg0sCq69DK0QhYfYG4')
console.log(encoded_url);

fetch(
  'https://api.scraperapi.com/?api_key=d7864bc273a2c66b3f9dedc5553c87d4&url=' + encoded_url + '&render=true&premium=true'
)
  .then((response) => response.text())
  .then(async (html) => {
    await writeFile('output.html', html);
    console.log('HTML saved to output.html');
  })
  .catch((error) => {
    console.log(error);
  });