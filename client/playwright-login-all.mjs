import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('request', (req) => {
  const url = req.url();
  if (url.includes('/api/')) {
    console.log('REQUEST', req.method(), url);
  }
});

page.on('response', async (response) => {
  const req = response.request();
  const url = req.url();
  if (url.includes('/api/')) {
    console.log('RESPONSE', response.status(), req.method(), url);
    if (response.status() >= 400) {
      try {
        console.log('BODY', await response.text());
      } catch (e) {
        console.log('BODY_ERR', e.message);
      }
    }
  }
});

page.on('console', (msg) => console.log('CONSOLE', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('PAGEERROR', err.message));

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'testlogin@example.com');
await page.fill('input[type="password"]', '123456');
await page.click('button[type="submit"]');
await page.waitForTimeout(6000);
console.log('FINAL_URL', page.url());
await browser.close();
