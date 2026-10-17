import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function generateBanners() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 800, height: 500 },
    deviceScaleFactor: 2 // 고해상도 레티나 2배수 렌더링 (1600x1000)
  });

  const bannerHomeHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; }
      body {
        width: 800px;
        height: 500px;
        overflow: hidden;
        background: linear-gradient(135deg, #0b1528 0%, #172a4e 50%, #1e3a8a 100%);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 44px 48px;
        position: relative;
        color: #ffffff;
      }
      /* 장식 배경 효과 */
      .bg-circle1 {
        position: absolute;
        width: 380px;
        height: 380px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0) 70%);
        top: -80px;
        right: -60px;
        filter: blur(20px);
      }
      .bg-circle2 {
        position: absolute;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0) 70%);
        bottom: -60px;
        left: -40px;
        filter: blur(30px);
      }
      .grid-pattern {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        background-size: 32px 32px;
      }
      .header {
        position: relative;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(245, 158, 11, 0.18);
        border: 1.5px solid #f59e0b;
        color: #fbbf24;
        padding: 7px 18px;
        border-radius: 9999px;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: -0.3px;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
      }
      .badge-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #fbbf24;
        box-shadow: 0 0 10px #fbbf24;
      }
      .brand-tag {
        font-size: 17px;
        font-weight: 600;
        color: #94a3b8;
        letter-spacing: -0.5px;
      }
      .content {
        position: relative;
        z-index: 10;
        margin-top: 10px;
      }
      .title-sub {
        font-size: 21px;
        font-weight: 600;
        color: #93c5fd;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
      }
      .title-main {
        font-size: 40px;
        font-weight: 800;
        line-height: 1.25;
        letter-spacing: -1.2px;
        color: #ffffff;
        text-shadow: 0 4px 16px rgba(0,0,0,0.4);
      }
      .title-highlight {
        color: #fde047;
      }
      .features {
        display: flex;
        gap: 16px;
        margin-top: 14px;
      }
      .feature-item {
        font-size: 15px;
        color: #cbd5e1;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .footer {
        position: relative;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 18px;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
      }
      .url-text {
        font-size: 17px;
        font-weight: 600;
        color: #60a5fa;
        letter-spacing: 0.2px;
      }
      .cta-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #ffffff;
        padding: 13px 28px;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -0.5px;
        box-shadow: 0 8px 20px rgba(217, 119, 6, 0.4), inset 0 1px 0 rgba(255,255,255,0.3);
      }
      .cta-btn svg {
        transition: transform 0.2s ease;
      }
    </style>
  </head>
  <body>
    <div class="bg-circle1"></div>
    <div class="bg-circle2"></div>
    <div class="grid-pattern"></div>
    
    <div class="header">
      <div class="badge">
        <span class="badge-dot"></span>
        <span>공식 홈페이지 바로가기</span>
      </div>
      <div class="brand-tag">이가이버 공인중개사</div>
    </div>

    <div class="content">
      <div class="title-sub">인천 · 강화도 전 지역 추천 매물</div>
      <div class="title-main">
        실매물 정보와 현장 영상을<br>
        <span class="title-highlight">홈페이지에서 바로 확인하세요</span>
      </div>
      <div class="features">
        <span class="feature-item">✔ 실시간 매물 검색</span>
        <span class="feature-item">✔ 지도/항공VR 뷰</span>
        <span class="feature-item">✔ 강화도 토지·주택 시세</span>
      </div>
    </div>

    <div class="footer">
      <div class="url-text">🌐 leegyver.com</div>
      <div class="cta-btn">
        <span>홈페이지 바로가기</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
      </div>
    </div>
  </body>
  </html>
  `;

  const bannerCareHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; }
      body {
        width: 800px;
        height: 500px;
        overflow: hidden;
        background: linear-gradient(135deg, #063c2c 0%, #064e3b 50%, #065f46 100%);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 44px 48px;
        position: relative;
        color: #ffffff;
      }
      .bg-circle1 {
        position: absolute;
        width: 380px;
        height: 380px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0) 70%);
        top: -80px;
        right: -60px;
        filter: blur(20px);
      }
      .bg-circle2 {
        position: absolute;
        width: 320px;
        height: 320px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, rgba(251, 146, 60, 0) 70%);
        bottom: -70px;
        left: -40px;
        filter: blur(30px);
      }
      .grid-pattern {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        background-size: 32px 32px;
      }
      .header {
        position: relative;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(52, 211, 153, 0.18);
        border: 1.5px solid #34d399;
        color: #6ee7b7;
        padding: 7px 18px;
        border-radius: 9999px;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: -0.3px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      }
      .badge-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #34d399;
        box-shadow: 0 0 10px #34d399;
      }
      .brand-tag {
        font-size: 17px;
        font-weight: 600;
        color: #a7f3d0;
        letter-spacing: -0.5px;
      }
      .content {
        position: relative;
        z-index: 10;
        margin-top: 10px;
      }
      .title-sub {
        font-size: 21px;
        font-weight: 600;
        color: #6ee7b7;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
      }
      .title-main {
        font-size: 40px;
        font-weight: 800;
        line-height: 1.25;
        letter-spacing: -1.2px;
        color: #ffffff;
        text-shadow: 0 4px 16px rgba(0,0,0,0.4);
      }
      .title-highlight {
        color: #fde047;
      }
      .features {
        display: flex;
        gap: 16px;
        margin-top: 14px;
      }
      .feature-item {
        font-size: 15px;
        color: #d1fae5;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .footer {
        position: relative;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 18px;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
      }
      .url-text {
        font-size: 17px;
        font-weight: 600;
        color: #6ee7b7;
        letter-spacing: 0.2px;
      }
      .cta-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff;
        padding: 13px 28px;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -0.5px;
        box-shadow: 0 8px 20px rgba(5, 150, 105, 0.4), inset 0 1px 0 rgba(255,255,255,0.3);
      }
    </style>
  </head>
  <body>
    <div class="bg-circle1"></div>
    <div class="bg-circle2"></div>
    <div class="grid-pattern"></div>
    
    <div class="header">
      <div class="badge">
        <span class="badge-dot"></span>
        <span>부동산 토탈케어 솔루션</span>
      </div>
      <div class="brand-tag">이가이버 토탈케어</div>
    </div>

    <div class="content">
      <div class="title-sub">전원주택 · 토지 · 별장 안심 위탁 관리</div>
      <div class="title-main">
        소중한 내 부동산 관리,<br>
        <span class="title-highlight">전문가에게 안심하고 맡기세요</span>
      </div>
      <div class="features">
        <span class="feature-item">✔ 예초·벌초·환경정비</span>
        <span class="feature-item">✔ 정기 현장점검 & 리포트</span>
        <span class="feature-item">✔ 건물 누수·동파 방지</span>
      </div>
    </div>

    <div class="footer">
      <div class="url-text">🛠️ leegyver.com/total-care</div>
      <div class="cta-btn">
        <span>부동산 관리신청</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
      </div>
    </div>
  </body>
  </html>
  `;

  const outDirs = [
    path.resolve(process.cwd(), "public/images"),
    path.resolve(process.cwd(), "client/public/images")
  ];

  for (const dir of outDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  // 1. 배너 Home 렌더링
  await page.setContent(bannerHomeHtml, { waitUntil: "networkidle" });
  for (const dir of outDirs) {
    const targetPath = path.join(dir, "banner_home.png");
    await page.screenshot({ path: targetPath, type: "png" });
    console.log("Created:", targetPath);
  }

  // 2. 배너 Care 렌더링
  await page.setContent(bannerCareHtml, { waitUntil: "networkidle" });
  for (const dir of outDirs) {
    const targetPath = path.join(dir, "banner_care.png");
    await page.screenshot({ path: targetPath, type: "png" });
    console.log("Created:", targetPath);
  }

  await browser.close();
  console.log("All banners generated successfully!");
}

generateBanners().catch(console.error);
