const { chromium } = require('playwright');

(async () => {
  const sessionPath = '/root/land/data/naver-session.json';
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext({ storageState: sessionPath, viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  await page.goto('https://blog.naver.com/9551304/postwrite', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2500);

  await page.evaluate(() => {
    document.querySelectorAll('.se-popup:not(.se-popup-image-type), .se-popup-dim, .se-help-panel').forEach(el => el.remove());
  });

  const titleLocator = page.locator('.se-documentTitle .se-text-paragraph').first();
  await titleLocator.click({ force: true });
  await page.keyboard.type('이미지 컴포넌트 전체 검사', { delay: 10 });
  await page.waitForTimeout(300);

  const photoBtn = page.locator('button:has-text("사진")').first();
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }),
    photoBtn.click({ force: true })
  ]);
  await fileChooser.setFiles(['/root/land/public/uploads/1789029867421-643697760.jpg']);
  await page.waitForTimeout(2000);

  try {
    const indBtn = page.locator('label[for="image-type-list"], button#image-type-list, .se-image-type-option-list, [data-log="limgatt.ind"]').first();
    if (await indBtn.isVisible({ timeout: 4000 })) await indBtn.click({ force: true });
  } catch(e) {}
  await page.waitForTimeout(6000);

  // Click on the image to see if caption appears
  const imgLocator = page.locator('.se-canvas img, .se-image-resource').first();
  if (await imgLocator.isVisible({ timeout: 3000 })) {
    console.log('Image is visible! Clicking image...');
    await imgLocator.click({ force: true });
    await page.waitForTimeout(1000);
  }

  // Get full DOM of the image's parent component
  const compInfo = await page.evaluate(() => {
    const img = document.querySelector('.se-canvas img');
    if (!img) return 'NO IMG FOUND';
    
    // Find ancestor with class starting with se-component
    let el = img;
    while (el && (!el.className || typeof el.className !== 'string' || !el.className.includes('se-component'))) {
      el = el.parentElement;
    }
    return el ? el.outerHTML : img.parentElement.outerHTML;
  });

  console.log('Image Component Full HTML:');
  console.log(compInfo);

  await browser.close();
})();
