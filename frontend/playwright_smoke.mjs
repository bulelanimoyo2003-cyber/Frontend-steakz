import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto('http://127.0.0.1:5173/branches', { waitUntil: 'networkidle' });
    // Wait for the branches list to render
    await page.getByText('Steakz City Centre').first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('SMOKE: branches rendered');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('SMOKE ERROR', err.message);
    await browser.close();
    process.exit(2);
  }
})();
