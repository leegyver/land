const { chromium } = require('playwright');
const fs = require('fs');

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
  console.log('Navigating to postwrite...');
  await page.goto('https://blog.naver.com/9551304/postwrite', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  // Dismiss draft popup if any
  try {
    const cancelBtn = page.locator('.se-popup-button-cancel, [data-name*="se-popup-alert"] button:has-text("취소"), button:has-text("취소")');
    if (await cancelBtn.first().isVisible({ timeout: 2000 })) {
      console.log('Clicking cancel on draft alert...');
      await cancelBtn.first().click({ force: true });
      await page.waitForTimeout(1000);
    }
  } catch (e) {}

  // Dismiss help panel if open
  try {
    const helpClose = page.locator('button.se-help-panel-close-button, button[aria-label="닫기"], .help_panel button');
    if (await helpClose.first().isVisible({ timeout: 1500 })) {
      console.log('Closing help panel...');
      await helpClose.first().click({ force: true });
      await page.waitForTimeout(500);
    }
  } catch (e) {}

  // Remove dim
  await page.evaluate(() => {
    document.querySelectorAll('.se-popup-dim').forEach(el => el.remove());
  });

  // Enter dummy title
  const title = page.locator('.se-documentTitle .se-text-paragraph, .se-title-text').first();
  await title.click({ force: true });
  await page.keyboard.type('[테스트] 자동 포스팅 테스트 제목', { delay: 10 });
  await page.waitForTimeout(500);

  // Enter dummy content
  const content = page.locator('.se-main-container .se-text-paragraph').first();
  await content.click({ force: true });
  await page.keyboard.type('이것은 Playwright 자동화 테스트 본문입니다.', { delay: 10 });
  await page.waitForTimeout(500);

  console.log('Clicking openPublishBtn...');
  const openPublishBtn = page.locator('button[data-click-area="tpb.publish"], [class*="publish_btn"]:has-text("발행")').first();
  await openPublishBtn.waitFor({ state: 'visible', timeout: 10000 });
  await openPublishBtn.click({ force: true });
  await page.waitForTimeout(2000);

  // Take screenshot of publish popup
  await page.screenshot({ path: '/tmp/publish-popup-open.png' });
  console.log('Screenshot of publish popup saved to /tmp/publish-popup-open.png');

  // Inspect elements inside the publish layer
  const layerElements = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const text = (el.innerText || '');
        const role = el.getAttribute('role');
        const dca = el.getAttribute('data-click-area') || '';
        const tag = el.tagName;
        return (
          dca.includes('publish') ||
          dca.includes('tps') ||
          (text === '발행' && (tag === 'BUTTON' || role === 'button' || el.className.includes('btn'))) ||
          el.className.includes('confirm_btn') ||
          el.className.includes('publish_btn')
        );
      })
      .map(el => ({
        tag: el.tagName,
        className: el.className,
        text: (el.innerText || '').trim(),
        dataClickArea: el.getAttribute('data-click-area'),
        outerHtml: el.outerHTML.substring(0, 200)
      }));
  });

  console.log('Layer elements:', JSON.stringify(layerElements, null, 2));

  await browser.close();
})();
