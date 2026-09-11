const { chromium } = require('playwright');

(async () => {
  const sessionPath = '/root/land/data/naver-session.json';
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext({ storageState: sessionPath, viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  await page.goto('https://blog.naver.com/9551304/postwrite', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2500);

  // Dismiss popups
  await page.evaluate(() => {
    document.querySelectorAll('.se-popup:not(.se-popup-image-type), .se-popup-dim, .se-help-panel').forEach(el => el.remove());
  });

  const photoBtn = page.locator('button:has-text("사진")').first();
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }),
    photoBtn.click({ force: true })
  ]);
  await fileChooser.setFiles(['/tmp/real_sample.jpg']);
  await page.waitForTimeout(2000);

  // Click 개별사진
  const indBtn = page.locator('label[for="image-type-list"], button#image-type-list, .se-image-type-option-list, [data-log="limgatt.ind"]').first();
  if (await indBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    console.log('Clicked [개별사진]');
    await indBtn.click({ force: true });
  }

  console.log('Waiting 6s for render...');
  await page.waitForTimeout(6000);

  // Inspect all elements inside the image component
  const imageInfo = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('.se-canvas img'));
    return images.map(img => {
      // Find parent section or component
      let p = img.parentElement;
      while (p && !p.className.includes('se-component') && p.tagName !== 'SECTION' && p.tagName !== 'BODY') {
        p = p.parentElement;
      }
      return {
        src: img.src.substring(0, 100),
        parentHtml: p ? p.outerHTML.substring(0, 1000) : 'none'
      };
    });
  });

  console.log('Images found:', JSON.stringify(imageInfo, null, 2));
  await browser.close();
})();
