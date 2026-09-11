import fs from "fs";
import path from "path";
import { chromium, BrowserContext } from "playwright";

const DATA_DIR = path.resolve(process.cwd(), "data");
const SESSION_FILE = path.join(DATA_DIR, "naver-session.json");
const CONFIG_FILE = path.join(DATA_DIR, "naver-config.json");

export interface NaverConfig {
  blogId: string;
  defaultVisibility: "public" | "private"; // 전체공개 vs 비공개
}

export interface PublishOptions {
  title: string;
  content: string;
  tags: string[];
  imageUrls: string[];
  isPublic?: boolean;
  categoryName?: string;
}

export interface PublishResult {
  success: boolean;
  postUrl?: string;
  error?: string;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 네이버 블로그 기본 설정 조회
 */
export function getNaverConfig(): NaverConfig {
  const defaultBlogId = process.env.NAVER_EMAIL ? process.env.NAVER_EMAIL.split("@")[0] : "9551304";
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      return {
        blogId: data.blogId || defaultBlogId,
        defaultVisibility: data.defaultVisibility || "public"
      };
    } catch (e) {
      // ignore
    }
  }
  return {
    blogId: defaultBlogId,
    defaultVisibility: "public"
  };
}

/**
 * 네이버 블로그 설정 저장
 */
export function saveNaverConfig(config: Partial<NaverConfig>): NaverConfig {
  const current = getNaverConfig();
  const updated = { ...current, ...config };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}

/**
 * 네이버 로그인 세션 존재 및 유효성 확인
 */
export function checkNaverSessionStatus(): { exists: boolean; blogId: string; updatedAt?: string } {
  const config = getNaverConfig();
  if (!fs.existsSync(SESSION_FILE)) {
    return { exists: false, blogId: config.blogId };
  }
  try {
    const stats = fs.statSync(SESSION_FILE);
    const sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
    const hasCookies = Array.isArray(sessionData.cookies) && sessionData.cookies.length > 0;
    return {
      exists: hasCookies,
      blogId: config.blogId,
      updatedAt: stats.mtime.toISOString()
    };
  } catch (e) {
    return { exists: false, blogId: config.blogId };
  }
}

/**
 * 관리자가 직접 네이버에 로그인할 수 있도록 전용 브라우저 창 띄우기
 * (2단계 인증, 캡차 등을 브라우저에서 직접 완료한 후 세션을 파일에 자동 저장)
 */
export async function launchNaverLoginWindow(): Promise<{ success: boolean; message: string }> {
  console.log("[NaverPoster] 대화형 네이버 로그인 브라우저 실행 중...");
  
  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized", "--disable-blink-features=AutomationControlled"]
  });

  const context = await browser.newContext({
    viewport: null,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
  });

  const page = await context.newPage();

  // 기존 세션이 있다면 복원 시도
  if (fs.existsSync(SESSION_FILE)) {
    try {
      const sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
      if (sessionData.cookies) {
        await context.addCookies(sessionData.cookies);
      }
    } catch (e) {
      // ignore
    }
  }

  await page.goto("https://nid.naver.com/nidlogin.login");

  return new Promise((resolve) => {
    let resolved = false;

    const checkInterval = setInterval(async () => {
      try {
        if (!browser.isConnected()) {
          clearInterval(checkInterval);
          if (!resolved) {
            resolved = true;
            resolve({ success: false, message: "로그인 브라우저 창이 닫혔습니다." });
          }
          return;
        }

        const url = page.url();
        // 로그인 성공 시 naver.com 홈이나 서비스 화면으로 리다이렉트됨
        if (!url.includes("nidlogin.login") && (url.includes("naver.com") || url.includes("blog.naver.com"))) {
          console.log("[NaverPoster] 네이버 로그인 성공 감지! 세션 저장 중... URL:", url);
          await page.waitForTimeout(2000); // 쿠키 안정화 대기
          
          await context.storageState({ path: SESSION_FILE });
          console.log("[NaverPoster] 세션이 정상적으로 저장되었습니다:", SESSION_FILE);

          clearInterval(checkInterval);
          if (!resolved) {
            resolved = true;
            await browser.close();
            resolve({ success: true, message: "네이버 로그인 세션이 성공적으로 저장되었습니다." });
          }
        }
      } catch (err: any) {
        // 창이 닫히거나 에러 발생 시
        clearInterval(checkInterval);
        if (!resolved) {
          resolved = true;
          resolve({ success: false, message: err.message || "로그인 도중 문제가 발생했습니다." });
        }
      }
    }, 1500);

    // 5분 타임아웃
    setTimeout(async () => {
      clearInterval(checkInterval);
      if (!resolved) {
        resolved = true;
        try { await browser.close(); } catch (e) {}
        resolve({ success: false, message: "로그인 대기 시간이 초과되었습니다 (5분 제한)." });
      }
    }, 300000);
  });
}

/**
 * 수동 쿠키(NID_AUT, NID_SES 등) 직접 저장
 */
export function saveNaverCookiesManually(input: any) {
  const cookieList: Array<{ name: string; value: string; domain?: string; path?: string }> = [];

  if (typeof input === "string") {
    input.split(";").forEach(pair => {
      const parts = pair.split("=");
      const name = parts[0]?.trim();
      const value = parts.slice(1).join("=").trim();
      if (name && value) {
        cookieList.push({ name, value });
      }
    });
  } else if (input && typeof input === "object" && !Array.isArray(input)) {
    if (input.nidAut) cookieList.push({ name: "NID_AUT", value: String(input.nidAut).trim() });
    if (input.nidSes) cookieList.push({ name: "NID_SES", value: String(input.nidSes).trim() });
  } else if (Array.isArray(input)) {
    cookieList.push(...input);
  }

  const formattedCookies = cookieList.map(c => ({
    name: c.name,
    value: c.value,
    domain: c.domain || ".naver.com",
    path: c.path || "/",
    expires: -1,
    httpOnly: false,
    secure: true,
    sameSite: "Lax" as const
  }));

  const storageState = {
    cookies: formattedCookies,
    origins: []
  };

  fs.writeFileSync(SESSION_FILE, JSON.stringify(storageState, null, 2), "utf-8");
  return { success: true, count: formattedCookies.length };
}

/**
 * 로컬 이미지 경로 또는 URL을 로컬 파일 경로로 변환/다운로드
 */
async function resolveImageFiles(imageUrls: string[]): Promise<string[]> {
  const resolvedPaths: string[] = [];

  for (const img of imageUrls) {
    if (!img) continue;

    // 1. 이미 로컬 절대 경로인 경우
    if (path.isAbsolute(img) && fs.existsSync(img)) {
      resolvedPaths.push(img);
      continue;
    }

    // 2. uploads/ 경로 또는 /uploads/ 상대 경로인 경우
    const cleanPath = img.startsWith("/") ? img.slice(1) : img;
    const searchRoots = [
      process.cwd(),
      path.resolve(process.cwd(), "public"),
      path.resolve(process.cwd(), "client", "public"),
      path.resolve(process.cwd(), "dist", "public")
    ];

    let found = false;
    for (const root of searchRoots) {
      const p = path.resolve(root, cleanPath);
      if (fs.existsSync(p)) {
        resolvedPaths.push(p);
        found = true;
        break;
      }
    }
    if (found) continue;

    // 4. HTTP(S) URL인 경우 임시 디렉토리에 다운로드
    if (img.startsWith("http://") || img.startsWith("https://")) {
      try {
        const res = await fetch(img);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const ext = path.extname(new URL(img).pathname) || ".jpg";
          const tempFileName = `temp_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
          const tempFilePath = path.join(DATA_DIR, tempFileName);
          fs.writeFileSync(tempFilePath, Buffer.from(buffer));
          resolvedPaths.push(tempFilePath);
        }
      } catch (err) {
        console.warn(`[NaverPoster] 이미지 다운로드 실패 (${img}):`, err);
      }
    }
  }

  return resolvedPaths;
}

/**
 * 네이버 스마트에디터 가독성을 위해 불렛포인트, 번호 목록, 소제목 줄바꿈을 정규화
 */
function cleanAndFormatContent(text: string): string {
  if (!text) return "";
  // ** 마크다운 볼드 기호 완전 제거
  let cleaned = text.replace(/\*\*/g, "");
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 불렛포인트(•, ·, ▪, ■, ▶)가 줄 중간에 붙어있으면 줄바꿈 분리 (단, 앞에 이모지나 불렛이 있으면 분리하지 않음)
  cleaned = cleaned.replace(/([^\n\s\uD800-\uDFFF📸📍🏡✨💡■💬📞☎🌿👉•·▪▶✔])\s*([•·▪■▶✔]\s*)/g, "$1\n$2");

  // 섹션 제목 ([입지 및 환경], [공간 및 구조], [전문가 제언], [현장 사진 안내] 등) 앞뒤 여백 확보 (단, 앞에 이모지나 불렛이 있으면 분리하지 않음)
  cleaned = cleaned.replace(/([^\n\s\uD800-\uDFFF📸📍🏡✨💡■💬📞☎🌿👉•·▪▶✔])\s*(\[[^\]]+\])/g, "$1\n\n$2\n");
  cleaned = cleaned.replace(/(\[[^\]]+\])\s*([^\n])/g, "$1\n$2");

  // 이모지와 바로 이어지는 텍스트/대괄호 제목이 줄바꿈으로 분리되어 있으면 즉시 한 줄로 병합!
  cleaned = cleaned.replace(/([\uD800-\uDFFF📸📍🏡✨💡■💬📞☎🌿👉]+)\s*\n+\s*([가-힣A-Za-z0-9\[【])/g, "$1 $2");

  // 문장 종결 어미(습니다. 합니다. 입니다. 됩니다. 세요. 니다. 등) 뒤에 바로 한글이 붙어있는 경우 줄바꿈 2회 추가
  cleaned = cleaned.replace(/([다요죠음됨임함]\.|\!|\?)(?=[가-힣A-Za-z0-9\[【<])/g, "$1\n\n");

  // 단독 마크다운 구분선(--, --- 등) 및 (GEO & SEO) 제거
  cleaned = cleaned.replace(/\s*\(GEO\s*&\s*SEO\)/gi, "");
  cleaned = cleaned.replace(/^\s*[-_=*]{2,}\s*$/gm, "");

  // 중복되는 ━━━ 라인 정리 (연속된 구분선 제거)
  cleaned = cleaned.replace(/(━{4,}\s*\n*)+/g, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");

  // 연속 3개 이상의 개행은 2개(단락 1개 간격)로 축소
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

/**
 * 네이버 스마트에디터 ONE을 통해 블로그 글 자동 발행
 */
export async function publishToNaverBlog(options: PublishOptions): Promise<PublishResult> {
  if (!fs.existsSync(SESSION_FILE)) {
    return {
      success: false,
      error: "네이버 로그인 세션이 없습니다. 먼저 관리자 화면에서 네이버 로그인을 완료해주세요."
    };
  }

  const config = getNaverConfig();
  const blogId = config.blogId;
  const isPublic = options.isPublic ?? (config.defaultVisibility === "public");

  console.log(`[NaverPoster] 블로그 포스팅 시작: blogId=${blogId}, title=${options.title}, isPublic=${isPublic}`);

  const isLinux = process.platform === "linux";
  const browser = await chromium.launch({
    headless: isLinux ? true : false,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  });

  let context: BrowserContext | null = null;
  let page: any = null;

  try {
    context = await browser.newContext({
      storageState: SESSION_FILE,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 900 }
    });

    page = await context.newPage();

    // 스마트에디터 글쓰기 URL
    const writeUrl = `https://blog.naver.com/${blogId}/postwrite`;
    console.log("[NaverPoster] 글쓰기 페이지 접속:", writeUrl);
    await page.goto(writeUrl, { waitUntil: "domcontentloaded", timeout: 35000 });

    // 로그인 만료 체크 (로그인 페이지로 튕겼는지 확인)
    if (page.url().includes("nidlogin.login")) {
      await browser.close();
      return {
        success: false,
        error: "네이버 로그인 세션이 만료되었습니다. 다시 로그인해주세요."
      };
    }

    // 스마트에디터 기본 제목 엘리먼트 렌더링 대기
    const titleLocator = page.locator('.se-documentTitle .se-text-paragraph, .se-documentTitle p, .se-title-text').first();
    await titleLocator.waitFor({ state: "visible", timeout: 25000 });

    // 팝업 및 도움말 닫기 헬퍼 함수
    const dismissPopups = async () => {
      try {
        await page.evaluate(() => {
          // 1. 임시저장 복구 팝업 "취소" 클릭
          const cancelBtn = document.querySelector('.se-popup-button-cancel') as HTMLElement;
          if (cancelBtn) cancelBtn.click();
          // 2. 팝업 레이어 및 dim 제거
          document.querySelectorAll('.se-popup, .se-popup-dim, [data-group="popupLayer"]').forEach(el => el.remove());
          // 3. 도움말 패널 닫기 및 제거
          const helpClose = document.querySelector('.se-help-panel button, [class*="help-panel-close"]') as HTMLElement;
          if (helpClose) helpClose.click();
          const helpPanel = document.querySelector('.se-help-panel') as HTMLElement;
          if (helpPanel) helpPanel.remove();
        });
      } catch (e) {}
    };

    await dismissPopups();

    // 1. 제목 입력
    console.log("[NaverPoster] 제목 입력 중...");
    const cleanTitle = (options.title || "").replace(/\*\*/g, "").replace(/\s*\(GEO\s*&\s*SEO\)/gi, "").trim();
    await titleLocator.click({ force: true });
    await page.keyboard.type(cleanTitle, { delay: 0 });
    await page.waitForTimeout(100);

    // 2. 본문 먼저 입력
    console.log("[NaverPoster] 본문 영역 진입 및 초고속 정밀 입력 중...");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(150);

    const formattedContent = cleanAndFormatContent(options.content);
    const rawLines = formattedContent.split("\n");
    const normalizedLines: string[] = [];
    let lastWasEmpty = false;

    for (const line of rawLines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        if (!lastWasEmpty && normalizedLines.length > 0) {
          normalizedLines.push("");
          lastWasEmpty = true;
        }
      } else {
        normalizedLines.push(trimmed);
        lastWasEmpty = false;
      }
    }

    console.log(`[NaverPoster] 총 ${normalizedLines.length}개 라인 본문 입력 시작`);

    for (const line of normalizedLines) {
      if (line.length > 0) {
        await page.keyboard.type(line, { delay: 0 });
      } else {
        await page.keyboard.type(" ");
      }
      await page.keyboard.press("Enter");
      await page.waitForTimeout(15);
    }
    await page.waitForTimeout(400);
    console.log("[NaverPoster] 본문 단락 입력 완료!");

    // 3. 매물 사진 업로드 (본문 아래 배치, 배너 이미지는 제외)
    const BANNER_NAMES = ["banner_kakao", "banner_call"];
    const allImages = options.imageUrls || [];
    const propertyImageUrls = allImages.filter(img => !BANNER_NAMES.some(b => img.includes(b)));

    if (propertyImageUrls.length > 0) {
      console.log(`[NaverPoster] 매물 사진 ${propertyImageUrls.length}개 업로드 준비 중...`);
      const localPropertyImages = await resolveImageFiles(propertyImageUrls);
      
      if (localPropertyImages.length > 0) {
        try {
          // 상단 툴바가 보이도록 스크롤 초기화
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(400);

          const photoBtn = page.locator('button[data-name="image"], button:has-text("사진")').first();
          if (await photoBtn.isVisible({ timeout: 4000 })) {
            const [fileChooser] = await Promise.all([
              page.waitForEvent("filechooser", { timeout: 10000 }),
              photoBtn.click({ force: true })
            ]);
            await fileChooser.setFiles(localPropertyImages);
            console.log("[NaverPoster] 매물 사진 주입 완료. 레이아웃 팝업 대기...");
            await page.waitForTimeout(1200);

            // "사진 첨부 방식" 팝업이 뜨는 경우 [개별사진] 자동 선택
            try {
              const individualPhotoBtn = page.locator(
                'label[for="image-type-list"], button#image-type-list, .se-image-type-option-list, [data-log="limgatt.ind"]'
              ).first();
              if (await individualPhotoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await individualPhotoBtn.click({ force: true });
                await page.waitForTimeout(500);
              }
            } catch (popErr) {}

            // 매물 사진 SEO 태그 주입
            try {
              await page.evaluate((info: { title: string; tags: string[] }) => {
                const imgs = document.querySelectorAll('.se-component.se-image img:not([src*="banner_"])');
                imgs.forEach((img, idx) => {
                  const tagList = info.tags.slice(0, 4).join(', ');
                  const seoText = `인천 강화도 부동산 이가이버 - ${info.title} 실매물 사진 ${idx + 1} (${tagList})`;
                  img.setAttribute('alt', seoText);
                  img.setAttribute('title', seoText);
                });
              }, { title: options.title, tags: options.tags || [] });
            } catch (seoErr) {}

            await page.waitForTimeout(500);
          }
        } catch (imgErr) {
          console.warn("[NaverPoster] 매물 사진 업로드 중 오류 발생:", imgErr);
        }
      }
    }

    // 4. 포스팅 최하단에 실시간 상담 배너 2개 업로드 및 하이퍼링크 공식 연결
    console.log("[NaverPoster] 포스팅 최하단 배너 업로드 및 하이퍼링크 연결 시작...");
    try {
      const bannerFiles = await resolveImageFiles(["/images/banner_kakao.png", "/images/banner_call.png"]);
      if (bannerFiles.length > 0) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(200);

        const photoBtn = page.locator('button[data-name="image"], button:has-text("사진")').first();
        if (await photoBtn.isVisible({ timeout: 3000 })) {
          const [fileChooser] = await Promise.all([
            page.waitForEvent("filechooser", { timeout: 10000 }),
            photoBtn.click({ force: true })
          ]);
          await fileChooser.setFiles(bannerFiles);
          console.log("[NaverPoster] 배너 이미지 파일 주입 완료. 레이아웃 팝업 대기...");
          await page.waitForTimeout(1200);

          try {
            const indBtn = page.locator('label[for="image-type-list"], button#image-type-list').first();
            if (await indBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await indBtn.click({ force: true });
              await page.waitForTimeout(500);
            }
          } catch (e) {}

          // 배너 이미지에 공식 하이퍼링크 연결
          const allImgsLocator = page.locator('.se-component.se-image img');
          const totalImgs = await allImgsLocator.count();
          console.log(`[NaverPoster] 현재 본문 내 총 이미지 개수: ${totalImgs}개`);

          if (totalImgs >= 2) {
            // (1) 카카오톡 배너 이미지에 공식 하이퍼링크 연결 (뒤에서 두 번째)
            try {
              const kakaoImg = allImgsLocator.nth(totalImgs - 2);
              await kakaoImg.scrollIntoViewIfNeeded().catch(() => {});
              await kakaoImg.click({ force: true });
              await page.waitForTimeout(300);

              const linkBtn = page.locator('.se-link-toolbar-button, button[data-name="text-link"]').first();
              if (await linkBtn.isVisible({ timeout: 2000 })) {
                await linkBtn.click({ force: true });
                await page.waitForTimeout(300);

                const urlInput = page.locator('input.se-custom-layer-link-input').first();
                if (await urlInput.isVisible({ timeout: 2000 })) {
                  await urlInput.fill('https://pf.kakao.com/_xaxbxlxfs/chat');
                  await page.waitForTimeout(100);
                  await page.keyboard.press('Enter');
                  await page.waitForTimeout(400);
                  console.log("[NaverPoster] ✅ 카카오톡 1:1 상담 배너 하이퍼링크 연결 성공!");
                }
              }
            } catch (kErr) {
              console.warn("[NaverPoster] 카카오 배너 링크 연결 오류:", kErr);
            }

            // (2) 전화 바로연결 배너 이미지에 문의처 하이퍼링크 연결 (맨 마지막)
            try {
              const callImg = allImgsLocator.last();
              await callImg.scrollIntoViewIfNeeded().catch(() => {});
              await callImg.click({ force: true });
              await page.waitForTimeout(300);

              const linkBtn = page.locator('.se-link-toolbar-button, button[data-name="text-link"]').first();
              if (await linkBtn.isVisible({ timeout: 2000 })) {
                await linkBtn.click({ force: true });
                await page.waitForTimeout(300);

                const urlInput = page.locator('input.se-custom-layer-link-input').first();
                if (await urlInput.isVisible({ timeout: 2000 })) {
                  await urlInput.fill('https://leegyver.co.kr/tel');
                  await page.waitForTimeout(100);
                  await page.keyboard.press('Enter');
                  await page.waitForTimeout(400);
                  console.log("[NaverPoster] ✅ 전화 상담 배너 하이퍼링크 연결 성공!");
                }
              }
            } catch (cErr) {
              console.warn("[NaverPoster] 전화 배너 링크 연결 오류:", cErr);
            }
          }
        }
      }
    } catch (bannerErr) {
      console.warn("[NaverPoster] 배너 이미지 삽입 및 링크 처리 건너뜀:", bannerErr);
    }

    // 4. [발행] 버튼 클릭 (우측 상단 1단계 발행 설정 패널 열기)
    console.log("[NaverPoster] 상단 발행 설정 패널 열기...");
    await dismissPopups();
    const openPublishBtn = page.locator(
      'button[data-click-area="tpb.publish"], [class*="publish_btn"]:has-text("발행"), button:has-text("발행"):visible'
    ).first();
    await openPublishBtn.waitFor({ state: "visible", timeout: 10000 });
    await openPublishBtn.click({ force: true });
    await page.waitForTimeout(800);

    // 5-1. 카테고리 선택 (부동산 매물: 매물 정보, 커뮤니티 글: 일상다반사)
    const targetCategory = options.categoryName || "매물 정보";
    console.log(`[NaverPoster] 카테고리 설정 시도: ${targetCategory}`);
    try {
      const catBtn = page.locator('button[data-click-area="tpb*i.category"], button[class*="selectbox_button"]').first();
      if (await catBtn.isVisible({ timeout: 2000 })) {
        await catBtn.click({ force: true });
        await page.waitForTimeout(300);

        const itemLocator = page.locator('li, span, button').filter({ hasText: targetCategory }).first();
        if (await itemLocator.isVisible({ timeout: 2000 })) {
          await itemLocator.click({ force: true });
          console.log(`[NaverPoster] 카테고리 [${targetCategory}] 선택 완료`);
        } else {
          console.warn(`[NaverPoster] 카테고리 [${targetCategory}] 항목을 찾지 못했습니다.`);
        }
        await page.waitForTimeout(200);
      }
    } catch (catErr) {
      console.warn("[NaverPoster] 카테고리 선택 처리 건너뜀:", catErr);
    }

    // 5-2. 공개 설정 (전체공개 vs 비공개)
    try {
      if (isPublic) {
        const publicRadio = page.locator('input#open_public, label[for="open_public"], input[data-click-area*="public"]').first();
        if (await publicRadio.isVisible({ timeout: 1500 })) {
          await publicRadio.click({ force: true });
        }
      } else {
        const privateRadio = page.locator('input#open_private, label[for="open_private"], input[data-click-area*="secret"]').first();
        if (await privateRadio.isVisible({ timeout: 1500 })) {
          await privateRadio.click({ force: true });
        }
      }
      await page.waitForTimeout(150);
    } catch (e) {
      console.warn("[NaverPoster] 공개 설정 선택 건너뜀:", e);
    }

    // 6. 태그 입력 (필수 4대 태그 보장)
    const MANDATORY_TAGS = ["강화도부동산", "강화군부동산", "이가이버", "부동산전문"];
    const tagsToPublish = Array.from(
      new Set([
        ...MANDATORY_TAGS,
        ...(options.tags || []).map(t => t.replace(/^#/, "").trim())
      ])
    ).filter(Boolean).slice(0, 10);

    console.log("[NaverPoster] 태그 입력 중:", tagsToPublish.join(", "));
    try {
      const tagInput = page.locator('input#tag-input, input.tag_input__zdSy_, input[placeholder*="태그"]').first();
      if (await tagInput.isVisible({ timeout: 2000 })) {
        for (const tag of tagsToPublish) {
          const cleanTag = tag.replace(/^#/, "").trim();
          if (cleanTag) {
            await tagInput.fill(cleanTag);
            await page.keyboard.press("Enter");
            await page.waitForTimeout(50);
          }
        }
      }
    } catch (tagErr) {
      console.warn("[NaverPoster] 태그 입력 중 건너뜀:", tagErr);
    }

    // 7. 최종 [발행] 확인 버튼 클릭 (하단 확인 버튼)
    console.log("[NaverPoster] 최종 발행 확인 클릭...");
    const confirmPublishBtn = page.locator(
      'button[data-testid="seOnePublishBtn"], button.confirm_btn__byZZW, button[data-click-area="tpb*i.publish"]'
    ).first();
    await confirmPublishBtn.waitFor({ state: "visible", timeout: 10000 });

    await Promise.all([
      page.waitForURL((url: any) => !url.toString().includes("postwrite"), { timeout: 35000 }).catch(() => {}),
      confirmPublishBtn.click({ force: true })
    ]);
    await page.waitForTimeout(1500);

    const finalUrl = page.url();
    console.log("[NaverPoster] 발행 완료 URL:", finalUrl);

    if (finalUrl.includes("postwrite")) {
      throw new Error("네이버 블로그 발행 후 페이지가 이동되지 않았습니다. 본문 내용이나 설정을 확인해주세요.");
    }

    // 세션 갱신 저장
    await context.storageState({ path: SESSION_FILE });

    await browser.close();

    return {
      success: true,
      postUrl: finalUrl.includes("postwrite") ? `https://blog.naver.com/${blogId}` : finalUrl
    };

  } catch (err: any) {
    console.error("[NaverPoster] 블로그 발행 실패:", err);
    if (page) {
      try {
        const errorShotPath = path.join(DATA_DIR, "publish-error.png");
        await page.screenshot({ path: errorShotPath });
        console.log("[NaverPoster] 에러 스크린샷 저장 완료:", errorShotPath);
      } catch (shotErr) {}
    }
    if (context) {
      try { await browser.close(); } catch (e) {}
    }
    return {
      success: false,
      error: err.message || "네이버 블로그 포스팅 중 오류가 발생했습니다."
    };
  }
}
