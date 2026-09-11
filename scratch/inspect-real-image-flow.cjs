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
  
  // Track all network requests related to image/upload
  page.on('request', req => {
    const url = req.url();
    if (url.includes('upload') || url.includes('photo') || url.includes('image') || url.includes('attach')) {
      console.log('[Network REQ]', req.method(), url.substring(0, 100));
    }
  });
  page.on('response', res => {
    const url = res.url();
    if (url.includes('upload') || url.includes('photo') || url.includes('image') || url.includes('attach')) {
      console.log('[Network RES]', res.status(), url.substring(0, 100));
    }
  });

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

  // 1. Enter title
  console.log('1. Entering title...');
  const titleLocator = page.locator('.se-documentTitle .se-text-paragraph').first();
  await titleLocator.click({ force: true });
  await page.keyboard.type('[실제 이미지 검증] 실물 이미지 업로드 테스트', { delay: 10 });
  await page.waitForTimeout(500);

  // 2. Click content area first!
  console.log('2. Focusing content area before photo upload...');
  const contentLocator = page.locator('.se-content p.se-text-paragraph').nth(1);
  if (await contentLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
    await contentLocator.click({ force: true });
  } else {
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(500);

  // 3. Upload real image
  console.log('3. Triggering photo upload for /tmp/real_sample.jpg...');
  const photoBtn = page.locator('button:has-text("사진"), button[data-name="image"], [data-click-area*="image"]').first();
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }),
    photoBtn.click({ force: true })
  ]);

  await fileChooser.setFiles(['/tmp/real_sample.jpg']);
  console.log('File set. Waiting 3 seconds...');
  await page.waitForTimeout(3000);

  // Check if "사진 첨부 방식" popup appeared
  const isTypePopupVisible = await page.locator('.se-popup-image-type').isVisible({ timeout: 2000 }).catch(() => false);
  console.log('Is se-popup-image-type visible?', isTypePopupVisible);
  if (isTypePopupVisible) {
    const indBtn = page.locator('label[for="image-type-list"], button#image-type-list, .se-image-type-option-list').first();
    await indBtn.click({ force: true });
    await page.waitForTimeout(2000);
  }

  // Wait for image rendering in canvas
  console.log('Waiting for image element in canvas...');
  await page.waitForTimeout(5000);

  await page.screenshot({ path: '/tmp/real-image-uploaded.png' });
  console.log('Saved /tmp/real-image-uploaded.png');

  // Check if img elements exist in the editor canvas
  const canvasImages = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('.se-canvas img, .se-main-container img, .se-image-resource'));
    return imgs.map(img => ({
      tag: img.tagName,
      class: img.className,
      src: img.getAttribute('src') || img.getAttribute('data-src'),
      width: img.clientWidth,
      height: img.clientHeight,
      outerHtml: img.outerHTML.substring(0, 200)
    }));
  });
  console.log('Canvas images detected:', JSON.stringify(canvasImages, null, 2));

  // Enter body text under the image
  console.log('4. Entering body text...');
  await page.keyboard.press('Enter');
  await page.keyboard.type('이 글은 실제 사진 첨부 테스트 글입니다.', { delay: 10 });
  await page.waitForTimeout(1000);

  // Publish
  console.log('5. Publishing...');
  const openPublishBtn = page.locator('button[data-click-area="tpb.publish"]').first();
  await openPublishBtn.click({ force: true });
  await page.waitForTimeout(2000);

  // Select private
  const privateRadio = page.locator('input#open_private, label[for="open_private"]').first();
  if (await privateRadio.isVisible({ timeout: 2000 })) {
    await privateRadio.click({ force: true });
  }
  await page.waitForTimeout(500);

  // Confirm
  const confirmPublishBtn = page.locator('button[data-testid="seOnePublishBtn"], button.confirm_btn__byZZW').first();
  await Promise.all([
    page.waitForURL((url) => !url.toString().includes('postwrite'), { timeout: 35000 }),
    confirmPublishBtn.click({ force: true })
  ]);
  await page.waitForTimeout(3000);

  const finalUrl = page.url();
  console.log('🎉 최종 발행 URL:', finalUrl);

  await page.screenshot({ path: '/tmp/real-image-published-view.png' });
  console.log('Saved /tmp/real-image-published-view.png');

  await browser.close();
})();
