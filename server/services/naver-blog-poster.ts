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
    const localUploadPath = path.resolve(process.cwd(), cleanPath);
    if (fs.existsSync(localUploadPath)) {
      resolvedPaths.push(localUploadPath);
      continue;
    }

    // 3. public/ 상대 경로인 경우
    const localPublicPath = path.resolve(process.cwd(), "public", cleanPath);
    if (fs.existsSync(localPublicPath)) {
      resolvedPaths.push(localPublicPath);
      continue;
    }

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
    await page.goto(writeUrl, { waitUntil: "networkidle", timeout: 45000 });

    // 로그인 만료 체크 (로그인 페이지로 튕겼는지 확인)
    if (page.url().includes("nidlogin.login")) {
      await browser.close();
      return {
        success: false,
        error: "네이버 로그인 세션이 만료되었습니다. 다시 로그인해주세요."
      };
    }

    // 스마트에디터 로딩 및 비동기 팝업 렌더링 대기
    await page.waitForTimeout(2500);

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
      await page.waitForTimeout(500);
    };

    await dismissPopups();

    // 1. 제목 입력
    console.log("[NaverPoster] 제목 입력 중...");
    await dismissPopups();
    const titleLocator = page.locator('.se-documentTitle .se-text-paragraph, .se-documentTitle p, .se-title-text').first();
    await titleLocator.waitFor({ state: "visible", timeout: 15000 });
    await titleLocator.click({ force: true });
    await page.waitForTimeout(300);
    await page.keyboard.type(options.title, { delay: 15 });
    await page.waitForTimeout(300);

    // 2. 이미지 업로드 (있는 경우)
    if (options.imageUrls && options.imageUrls.length > 0) {
      console.log("[NaverPoster] 이미지 파일 변환 및 준비 중...");
      const localImages = await resolveImageFiles(options.imageUrls);
      
      if (localImages.length > 0) {
        console.log(`[NaverPoster] ${localImages.length}개 이미지 업로드 시도 중...`);
        try {
          const photoBtn = page.locator('button:has-text("사진"), button[data-name="image"], [data-click-area*="image"]').first();
          if (await photoBtn.isVisible({ timeout: 3000 })) {
            const [fileChooser] = await Promise.all([
              page.waitForEvent("filechooser", { timeout: 10000 }),
              photoBtn.click({ force: true })
            ]);
            await fileChooser.setFiles(localImages);
            console.log("[NaverPoster] 이미지 파일 주입 완료. 업로드 대기 중...");
            await page.waitForTimeout(5000);
          } else {
            console.warn("[NaverPoster] 사진 버튼을 찾지 못해 이미지 업로드를 건너뜁니다.");
          }
        } catch (imgErr) {
          console.warn("[NaverPoster] 이미지 업로드 중 오류 발생:", imgErr);
        }
      }
    }

    // 3. 본문 입력
    console.log("[NaverPoster] 본문 입력 중...");
    await dismissPopups();
    
    // 본문 단락 클릭 또는 Enter로 본문 영역 진입
    const contentLocator = page.locator('.se-content p.se-text-paragraph').nth(1);
    if (await contentLocator.isVisible({ timeout: 3000 }).catch(() => false)) {
      await contentLocator.click({ force: true });
    } else {
      await page.keyboard.press("Enter");
    }
    await page.waitForTimeout(300);

    const paragraphs = options.content.split("\n");
    for (const para of paragraphs) {
      if (para.length > 0) {
        await page.keyboard.type(para, { delay: 5 });
      }
      await page.keyboard.press("Enter");
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(1000);

    // 4. [발행] 버튼 클릭 (우측 상단 1단계 발행 설정 패널 열기)
    console.log("[NaverPoster] 상단 발행 설정 패널 열기...");
    await dismissPopups();
    const openPublishBtn = page.locator(
      'button[data-click-area="tpb.publish"], [class*="publish_btn"]:has-text("발행"), button:has-text("발행"):visible'
    ).first();
    await openPublishBtn.waitFor({ state: "visible", timeout: 15000 });
    await openPublishBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // 5. 공개 설정 (전체공개 vs 비공개)
    try {
      if (isPublic) {
        const publicRadio = page.locator('input#open_public, label[for="open_public"], input[data-click-area*="public"]').first();
        if (await publicRadio.isVisible({ timeout: 2000 })) {
          await publicRadio.click({ force: true });
        }
      } else {
        const privateRadio = page.locator('input#open_private, label[for="open_private"], input[data-click-area*="secret"]').first();
        if (await privateRadio.isVisible({ timeout: 2000 })) {
          await privateRadio.click({ force: true });
        }
      }
      await page.waitForTimeout(300);
    } catch (e) {
      console.warn("[NaverPoster] 공개 설정 선택 건너뜀:", e);
    }

    // 6. 태그 입력
    if (options.tags && options.tags.length > 0) {
      console.log("[NaverPoster] 태그 입력 중:", options.tags.join(", "));
      try {
        const tagInput = page.locator('input#tag-input, input.tag_input__zdSy_, input[placeholder*="태그"]').first();
        if (await tagInput.isVisible({ timeout: 2000 })) {
          for (const tag of options.tags.slice(0, 10)) {
            const cleanTag = tag.replace(/^#/, "").trim();
            if (cleanTag) {
              await tagInput.fill(cleanTag);
              await page.keyboard.press("Enter");
              await page.waitForTimeout(150);
            }
          }
        }
      } catch (tagErr) {
        console.warn("[NaverPoster] 태그 입력 중 건너뜀:", tagErr);
      }
    }

    // 7. 최종 [발행] 확인 버튼 클릭 (하단 확인 버튼)
    console.log("[NaverPoster] 최종 발행 확인 클릭...");
    const confirmPublishBtn = page.locator(
      'button[data-testid="seOnePublishBtn"], button.confirm_btn__byZZW, button[data-click-area="tpb*i.publish"]'
    ).first();
    await confirmPublishBtn.waitFor({ state: "visible", timeout: 15000 });

    await Promise.all([
      page.waitForURL((url) => !url.toString().includes("postwrite"), { timeout: 35000 }).catch(() => {}),
      confirmPublishBtn.click({ force: true })
    ]);
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    console.log("[NaverPoster] 발행 완료 URL:", finalUrl);

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
