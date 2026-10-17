import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function generateBanners() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 800, height: 480 },
    deviceScaleFactor: 2 // 초고해상도 레티나 2배수 렌더링 (1600x960)
  });

  // 배너 1: 홈페이지 바로가기
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
        height: 480px;
        overflow: hidden;
        background: linear-gradient(145deg, #070d1e 0%, #0f1d3a 45%, #193264 100%);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 38px 42px;
        position: relative;
        color: #ffffff;
      }
      .glow-blob1 {
        position: absolute;
        width: 420px;
        height: 420px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0) 70%);
        top: -120px;
        right: -80px;
        filter: blur(25px);
      }
      .glow-blob2 {
        position: absolute;
        width: 320px;
        height: 320px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0) 70%);
        bottom: -90px;
        left: -60px;
        filter: blur(35px);
      }
      .grid-lines {
        position: absolute;
        inset: 0;
        background-image: 
          linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
        background-size: 36px 36px;
      }
      .top-row {
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
        background: rgba(245, 158, 11, 0.22);
        border: 2px solid #f59e0b;
        color: #fde047;
        padding: 8px 20px;
        border-radius: 9999px;
        font-size: 17px;
        font-weight: 800;
        letter-spacing: -0.3px;
        box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
      }
      .badge-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #fde047;
        box-shadow: 0 0 12px #fde047;
      }
      .brand-name {
        font-size: 18px;
        font-weight: 700;
        color: #93c5fd;
        letter-spacing: -0.5px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .center-content {
        position: relative;
        z-index: 10;
        margin-top: 4px;
      }
      .sub-title {
        font-size: 22px;
        font-weight: 700;
        color: #93c5fd;
        margin-bottom: 6px;
        letter-spacing: -0.5px;
      }
      .main-title {
        font-size: 46px;
        font-weight: 900;
        line-height: 1.18;
        letter-spacing: -1.8px;
        color: #ffffff;
        text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      }
      .highlight-text {
        color: #fde047;
        text-shadow: 0 0 30px rgba(253, 224, 71, 0.4);
      }
      .tags-row {
        display: flex;
        gap: 12px;
        margin-top: 12px;
      }
      .tag-chip {
        font-size: 15px;
        color: #cbd5e1;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.08);
        padding: 4px 12px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.12);
      }
      .bottom-row {
        position: relative;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .cta-button {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
        color: #ffffff;
        padding: 16px 28px;
        border-radius: 14px;
        font-size: 22px;
        font-weight: 900;
        letter-spacing: -0.5px;
        box-shadow: 0 10px 25px rgba(234, 88, 12, 0.45), inset 0 2px 0 rgba(255,255,255,0.35);
        border: 1px solid rgba(255, 255, 255, 0.25);
      }
      .cta-button svg {
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      }
      .url-label {
        font-size: 16px;
        font-weight: 700;
        color: #60a5fa;
        white-space: nowrap;
        background: rgba(15, 23, 42, 0.6);
        padding: 16px 20px;
        border-radius: 14px;
        border: 1px solid rgba(96, 165, 250, 0.3);
      }
    </style>
  </head>
  <body>
    <div class="glow-blob1"></div>
    <div class="glow-blob2"></div>
    <div class="grid-lines"></div>

    <div class="top-row">
      <div class="badge">
        <span class="badge-dot"></span>
        <span>공식 홈페이지</span>
      </div>
      <div class="brand-name">이가이버 공인중개사 🌐</div>
    </div>

    <div class="center-content">
      <div class="sub-title">인천 · 강화도 전지역 추천 매물</div>
      <div class="main-title">
        강화도 실매물 검색<br>
        <span class="highlight-text">홈페이지 바로가기</span>
      </div>
      <div class="tags-row">
        <span class="tag-chip">✔ 실시간 매물</span>
        <span class="tag-chip">✔ 항공VR 현장뷰</span>
        <span class="tag-chip">✔ 토지·주택 시세</span>
      </div>
    </div>

    <div class="bottom-row">
      <div class="cta-button">
        <span>홈페이지 바로가기 (터치/클릭)</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
      </div>
      <div class="url-label">leegyver.com ↗</div>
    </div>
  </body>
  </html>
  `;

  // 배너 2: 부동산 관리신청
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
        height: 480px;
        overflow: hidden;
        background: linear-gradient(145deg, #032b1f 0%, #064e3b 45%, #0d6e53 100%);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 38px 42px;
        position: relative;
        color: #ffffff;
      }
      .glow-blob1 {
        position: absolute;
        width: 420px;
        height: 420px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0) 70%);
        top: -120px;
        right: -80px;
        filter: blur(25px);
      }
      .glow-blob2 {
        position: absolute;
        width: 320px;
        height: 320px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(251, 146, 60, 0.3) 0%, rgba(251, 146, 60, 0) 70%);
        bottom: -90px;
        left: -60px;
        filter: blur(35px);
      }
      .grid-lines {
        position: absolute;
        inset: 0;
        background-image: 
          linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
        background-size: 36px 36px;
      }
      .top-row {
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
        background: rgba(52, 211, 153, 0.22);
        border: 2px solid #34d399;
        color: #a7f3d0;
        padding: 8px 20px;
        border-radius: 9999px;
        font-size: 17px;
        font-weight: 800;
        letter-spacing: -0.3px;
        box-shadow: 0 4px 16px rgba(52, 211, 153, 0.3);
      }
      .badge-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #34d399;
        box-shadow: 0 0 12px #34d399;
      }
      .brand-name {
        font-size: 18px;
        font-weight: 700;
        color: #a7f3d0;
        letter-spacing: -0.5px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .center-content {
        position: relative;
        z-index: 10;
        margin-top: 4px;
      }
      .sub-title {
        font-size: 22px;
        font-weight: 700;
        color: #a7f3d0;
        margin-bottom: 6px;
        letter-spacing: -0.5px;
      }
      .main-title {
        font-size: 46px;
        font-weight: 900;
        line-height: 1.18;
        letter-spacing: -1.8px;
        color: #ffffff;
        text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      }
      .highlight-text {
        color: #fde047;
        text-shadow: 0 0 30px rgba(253, 224, 71, 0.4);
      }
      .tags-row {
        display: flex;
        gap: 12px;
        margin-top: 12px;
      }
      .tag-chip {
        font-size: 15px;
        color: #d1fae5;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.08);
        padding: 4px 12px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.12);
      }
      .bottom-row {
        position: relative;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .cta-button {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: linear-gradient(135deg, #10b981 0%, #047857 100%);
        color: #ffffff;
        padding: 16px 28px;
        border-radius: 14px;
        font-size: 22px;
        font-weight: 900;
        letter-spacing: -0.5px;
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.45), inset 0 2px 0 rgba(255,255,255,0.35);
        border: 1px solid rgba(255, 255, 255, 0.25);
      }
      .cta-button svg {
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      }
      .url-label {
        font-size: 16px;
        font-weight: 700;
        color: #a7f3d0;
        white-space: nowrap;
        background: rgba(3, 43, 31, 0.6);
        padding: 16px 20px;
        border-radius: 14px;
        border: 1px solid rgba(167, 243, 208, 0.3);
      }
    </style>
  </head>
  <body>
    <div class="glow-blob1"></div>
    <div class="glow-blob2"></div>
    <div class="grid-lines"></div>

    <div class="top-row">
      <div class="badge">
        <span class="badge-dot"></span>
        <span>부동산 토탈케어</span>
      </div>
      <div class="brand-name">이가이버 안심관리 🛠️</div>
    </div>

    <div class="center-content">
      <div class="sub-title">전원주택 · 토지 · 별장 안심 위탁관리</div>
      <div class="main-title">
        내 부동산 안심 케어<br>
        <span class="highlight-text">온라인 관리신청</span>
      </div>
      <div class="tags-row">
        <span class="tag-chip">✔ 예초·벌초·환경정비</span>
        <span class="tag-chip">✔ 정기 현장점검 리포트</span>
        <span class="tag-chip">✔ 건물 동파·누수 점검</span>
      </div>
    </div>

    <div class="bottom-row">
      <div class="cta-button">
        <span>부동산 관리신청 (터치/클릭)</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
      </div>
      <div class="url-label">leegyver.com/total-care ↗</div>
    </div>
  </body>
  </html>
  `;

  const outDirs = [
    path.resolve(process.cwd(), "public/images"),
    path.resolve(process.cwd(), "client/public/images"),
    path.resolve(process.cwd(), "dist/public/images")
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
  console.log("Ultra-high quality banners generated successfully!");
}

generateBanners().catch(console.error);
