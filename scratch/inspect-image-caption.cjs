const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const sessionPath = '/root/land/data/naver-session.json';
  const blogId = '9551304';

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
  await page.goto(`https://blog.naver.com/${blogId}/postwrite`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2500);

  // Clean popups
  await page.evaluate(() => {
    const cancelBtn = document.querySelector('.se-popup-button-cancel');
    if (cancelBtn) cancelBtn.click();
    document.querySelectorAll('.se-popup:not(.se-popup-image-type), .se-popup-dim, [data-group="popupLayer"]:not([data-name="se-popup-image-type"])').forEach(el => el.remove());
    const helpPanel = document.querySelector('.se-help-panel');
    if (helpPanel) helpPanel.remove();
  });
  await page.waitForTimeout(500);

  // Upload real image
  const photoBtn = page.locator('button:has-text("사진"), button[data-name="image"], [data-click-area*="image"]').first();
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }),
    photoBtn.click({ force: true })
  ]);
  await fileChooser.setFiles(['/tmp/real_sample.jpg']);
  await page.waitForTimeout(4000);

  // Inspect all caption elements in the canvas
  const captionElements = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('.se-canvas *'));
    return all
      .filter(el => {
        const text = (el.innerText || '');
        const placeholder = el.getAttribute('placeholder') || '';
        const cls = typeof el.className === 'string' ? el.className : '';
        return (
          placeholder.includes('설명') ||
          placeholder.includes('사진') ||
          cls.includes('caption') ||
          cls.includes('se-placeholder') ||
          text.includes('사진 설명을 입력하세요')
        );
      })
      .map(el => ({
        tag: el.tagName,
        class: typeof el.className === 'string' ? el.className : '',
        placeholder: el.getAttribute('placeholder'),
        text: (el.innerText || '').trim(),
        outerHtml: el.outerHTML.substring(0, 200)
      }));
  });

  console.log('Caption Elements:', JSON.stringify(captionElements, null, 2));

  await browser.close();
})();
