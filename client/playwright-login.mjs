import { chromium } from 'playwright';

const url = process.env.URL || 'http://localhost:5173/login';
console.log('Opening', url);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('response', async (response) => {
  const req = response.request();
  if (req.url().includes('/api/auth/login') || req.url().includes('/api/auth/me') || req.url().includes('/api/admin/freelancers')) {
    console.log('URL', req.method(), req.url());
    console.log('STATUS', response.status());
    try {
      console.log('BODY', await response.text());
    } catch (e) {
      console.log('BODY_ERR', e.message);
    }
  }
});

page.on('console', (msg) => console.log('CONSOLE', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('PAGEERROR', err.message));

await page.goto(url, { waitUntil: 'networkidle' });
console.log('TITLE', await page.title());
await page.fill('input[type="email"]', 'testlogin@example.com');
await page.fill('input[type="password"]', '123456');
await page.click('button[type="submit"]');
await page.waitForTimeout(5000);
console.log('FINAL_URL', page.url());
console.log('BODY_TEXT', await page.locator('body').innerText());
await browser.close();
