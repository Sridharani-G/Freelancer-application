import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err));
    page.on('response', resp => {
        if (resp.url().includes('api')) {
            console.log('RESPONSE:', resp.url(), resp.status());
        }
    });

    try {
        console.log('Going to login...');
        await page.goto('http://localhost:5173/login');
        await page.fill('input[type="email"]', 'testlogin@example.com');
        await page.fill('input[type="password"]', '123456'); // assuming this works, if not I will just use any user
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);

        console.log('Going to profile edit...');
        await page.goto('http://localhost:5173/profile/edit');
        await page.waitForTimeout(2000);

        console.log('Switching to Professional section...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const profBtn = btns.find(b => b.textContent.includes('Professional'));
            if (profBtn) profBtn.click();
        });
        await page.waitForTimeout(1000);

        console.log('Clicking Save Changes...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const saveBtn = btns.find(b => b.textContent.includes('Save Changes'));
            if (saveBtn) saveBtn.click();
        });

        await page.waitForTimeout(3000);
        const buttonText = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const saveBtn = btns.find(b => b.textContent.includes('Saving...') || b.textContent.includes('Save Changes'));
            return saveBtn ? saveBtn.textContent : null;
        });
        console.log('FINAL BUTTON TEXT:', buttonText);
    } catch (e) {
        console.error('SCRIPT ERROR:', e);
    } finally {
        await browser.close();
    }
})();
