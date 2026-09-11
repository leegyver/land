const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const sessionPath = '/root/land/data/naver-session.json';
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext({ storageState: sessionPath, viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  await page.goto('https://blog.naver.com/9551304/postwrite', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2500);

  await page.evaluate(() => {
    document.querySelectorAll('.se-popup, .se-popup-dim, [data-group="popupLayer"], .se-help-panel').forEach(el => el.remove());
  });

  const photoBtn = page.locator('button:has-text("사진")').first();
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }),
    photoBtn.click({ force: true })
  ]);
  await fileChooser.setFiles(['/tmp/real_sample.jpg']);
  await page.waitForTimeout(4000);

  // Inspect component around img
  const compInfo = await page.evaluate(() => {
    const img = document.querySelector('.se-canvas img');
    if (!img) return { error: 'No image found' };
    
    // Find parent component
    let parent = img.parentElement;
    while (parent && !parent.className.includes('se-component') && parent.tagName !== 'BODY') {
      parent = parent.parentElement;
    }

    return {
      imgOuter: img.outerHTML,
      componentTag: parent?.tagName,
      componentClass: parent?.className,
      componentHtml: parent?.innerHTML.substring(0, 1000)
    };
  });

  console.log('Image Component Info:', JSON.stringify(compInfo, null, 2));
  await browser.close();
})();
