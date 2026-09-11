const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const sessionPath = '/root/land/data/naver-session.json';
  if (!fs.existsSync(sessionPath)) {
    console.error('Session file not found at', sessionPath);
    process.exit(1);
  }

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

  // Take initial screenshot
  await page.screenshot({ path: '/tmp/step1-loaded.png' });
  console.log('Loaded. Current URL:', page.url());

  // Inspect frames
  const frames = page.frames();
  console.log('Frame count:', frames.length);
  frames.forEach((f, idx) => console.log(`Frame ${idx}: name=${f.name()}, url=${f.url()}`));

  // Search all elements in main page with "발행" text
  const publishElements = await page.evaluate(() => {
    function getInfo(el) {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        id: el.id,
        className: el.className,
        text: (el.innerText || '').trim(),
        role: el.getAttribute('role'),
        dataClickArea: el.getAttribute('data-click-area'),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        outerHtml: el.outerHTML.substring(0, 300)
      };
    }

    const all = Array.from(document.querySelectorAll('*'));
    return all
      .filter(el => {
        const text = (el.innerText || '');
        return text.includes('발행') && el.children.length < 5;
      })
      .map(getInfo);
  });

  console.log('Publish elements in main page:', JSON.stringify(publishElements, null, 2));

  // Check frames as well if any
  for (let i = 0; i < frames.length; i++) {
    try {
      const f = frames[i];
      const frameElems = await f.evaluate(() => {
        const all = Array.from(document.querySelectorAll('*'));
        return all
          .filter(el => (el.innerText || '').includes('발행') && el.children.length < 5)
          .map(el => ({
            tag: el.tagName,
            className: el.className,
            text: (el.innerText || '').trim(),
            outerHtml: el.outerHTML.substring(0, 200)
          }));
      });
      if (frameElems.length > 0) {
        console.log(`Publish elements in frame ${i}:`, JSON.stringify(frameElems, null, 2));
      }
    } catch (e) {
      // frame might be cross-origin
    }
  }

  await browser.close();
  console.log('Diagnosis complete.');
})();
