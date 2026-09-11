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

  // Clean popups and help panel via evaluate
  await page.evaluate(() => {
    // 1. Click cancel on draft popup
    const cancelBtn = document.querySelector('.se-popup-button-cancel');
    if (cancelBtn) cancelBtn.click();
    // 2. Remove all popup layers & dims
    document.querySelectorAll('.se-popup, .se-popup-dim, [data-group="popupLayer"]').forEach(el => el.remove());
    // 3. Close or remove help panel
    const helpClose = document.querySelector('.se-help-panel button, [class*="help-panel-close"]');
    if (helpClose) helpClose.click();
    const helpPanel = document.querySelector('.se-help-panel');
    if (helpPanel) helpPanel.remove();
  });
  await page.waitForTimeout(1000);

  // Take clean screenshot
  await page.screenshot({ path: '/tmp/clean-canvas.png' });

  // Inspect title and body elements in the canvas
  const canvasElements = await page.evaluate(() => {
    const titleEl = document.querySelector('.se-documentTitle');
    const contentEl = document.querySelector('.se-main-container');

    function desc(el) {
      if (!el) return null;
      return {
        tag: el.tagName,
        id: el.id,
        className: el.className,
        text: (el.innerText || '').substring(0, 100),
        childrenCount: el.children.length,
        innerHTML: el.innerHTML.substring(0, 300)
      };
    }

    // Find all paragraph elements inside main container
    const paragraphs = Array.from(document.querySelectorAll('.se-main-container .se-text-paragraph, .se-component-content .se-text-paragraph, .se-section-text .se-text-paragraph, p.se-text-paragraph'))
      .map(p => ({
        tag: p.tagName,
        className: p.className,
        text: p.innerText,
        rect: p.getBoundingClientRect(),
        outerHtml: p.outerHTML.substring(0, 200)
      }));

    return {
      title: desc(titleEl),
      contentContainer: desc(contentEl),
      paragraphs
    };
  });

  console.log('Canvas Elements:', JSON.stringify(canvasElements, null, 2));

  await browser.close();
})();
