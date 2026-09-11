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
  await page.goto('https://blog.naver.com/9551304/postwrite', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  const modalAndHelp = await page.evaluate(() => {
    const results = [];
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      const text = (el.innerText || '').trim();
      const rect = el.getBoundingClientRect();
      if (text === '취소' || text === '확인' || (el.className && typeof el.className === 'string' && el.className.includes('popup')) || (el.getAttribute('aria-label') || '').includes('닫기')) {
        results.push({
          tag: el.tagName,
          class: typeof el.className === 'string' ? el.className : '',
          text: text,
          ariaLabel: el.getAttribute('aria-label'),
          rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
          outerHtml: el.outerHTML.substring(0, 200)
        });
      }
    }
    return results;
  });

  console.log('Modal and Help Elements:', JSON.stringify(modalAndHelp, null, 2));
  await browser.close();
})();
