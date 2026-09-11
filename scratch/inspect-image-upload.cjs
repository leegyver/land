const { chromium } = require('playwright');

(async () => {
  const sessionPath = '/root/land/data/naver-session.json';
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    storageState: sessionPath,
    viewport: { width: 1400, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  await page.goto('https://blog.naver.com/9551304/postwrite', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  // Clean popups
  await page.evaluate(() => {
    const cancelBtn = document.querySelector('.se-popup-button-cancel');
    if (cancelBtn) cancelBtn.click();
    document.querySelectorAll('.se-popup, .se-popup-dim, [data-group="popupLayer"]').forEach(el => el.remove());
    const helpPanel = document.querySelector('.se-help-panel');
    if (helpPanel) helpPanel.remove();
  });

  // Check all file inputs before and after clicking '사진' button
  const fileInputsBefore = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input[type="file"]')).map(el => el.outerHTML);
  });
  console.log('File inputs before clicking Photo button:', fileInputsBefore);

  // Look for photo button
  const photoBtn = page.locator('button:has-text("사진"), button[data-name="image"], .se-toolbar button:first-child, [data-click-area*="image"]').first();
  console.log('Photo button visible:', await photoBtn.isVisible());

  // Check file chooser event
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
    photoBtn.click({ force: true })
  ]);

  console.log('File chooser intercepted?', !!fileChooser);

  const fileInputsAfter = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input[type="file"]')).map(el => ({
      name: el.name,
      id: el.id,
      outerHtml: el.outerHTML.substring(0, 200)
    }));
  });
  console.log('File inputs after clicking Photo button:', fileInputsAfter);

  await browser.close();
})();
