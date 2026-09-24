const { chromium } = require('playwright');

(async () => {
  const url = process.env.CRON_URL;
  if (!url) { console.error('CRON_URL secret is not set'); process.exit(1); }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });

  // If the host served its "prove you're not a bot" page, its own script solves
  // the puzzle and redirects here automatically -- just give it time to finish.
  try {
    await page.waitForFunction(
      () => document.body && document.body.innerText.includes('"ok"'),
      { timeout: 20000 }
    );
  } catch (e) { /* falls through to the check below, which fails loudly */ }

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Final URL:', page.url());
  console.log('Response:', text.slice(0, 1000));
  await browser.close();

  if (!text.includes('"ok"')) {
    console.error('Did not get the expected JSON back -- still blocked?');
    process.exit(1);
  }
})();
