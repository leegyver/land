import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { Client } from "ssh2";

const LOCAL_SESSION_FILE = path.resolve(process.cwd(), "data", "naver-session.json");

async function main() {
  console.log("==================================================");
  console.log("   네이버 블로그 로그인 세션 동기화 도구 (Windows)");
  console.log("==================================================");
  console.log("\n[1/3] 실제 크롬 브라우저를 실행합니다...");

  // Ensure data dir exists
  if (!fs.existsSync(path.dirname(LOCAL_SESSION_FILE))) {
    fs.mkdirSync(path.dirname(LOCAL_SESSION_FILE), { recursive: true });
  }

  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized", "--disable-blink-features=AutomationControlled"]
  });

  const context = await browser.newContext({
    viewport: null,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
  });

  const page = await context.newPage();
  await page.goto("https://nid.naver.com/nidlogin.login");

  console.log("[2/3] 열린 브라우저 창에서 네이버 로그인을 완료해주세요 (2단계 인증 포함).");
  console.log("      로그인이 완료되면 자동으로 감지하여 서버로 전송합니다...\n");

  await new Promise<void>((resolve) => {
    const interval = setInterval(async () => {
      try {
        if (!browser.isConnected()) {
          clearInterval(interval);
          resolve();
          return;
        }

        const url = page.url();
        if (!url.includes("nidlogin.login") && (url.includes("naver.com") || url.includes("blog.naver.com"))) {
          console.log("🎉 네이버 로그인 성공 감지! 세션 추출 중...");
          await page.waitForTimeout(2000);

          await context.storageState({ path: LOCAL_SESSION_FILE });
          console.log("✅ 로컬 세션 저장 완료:", LOCAL_SESSION_FILE);

          clearInterval(interval);
          await browser.close();
          resolve();
        }
      } catch (e) {
        clearInterval(interval);
        resolve();
      }
    }, 1500);
  });

  if (!fs.existsSync(LOCAL_SESSION_FILE)) {
    console.log("❌ 로그인이 완료되지 않았습니다.");
    return;
  }

  console.log("\n[3/3] 실제 운영 서버(leegyver.com)로 로그인 세션을 안전하게 전송합니다...");
  await uploadSessionToServer(LOCAL_SESSION_FILE);
}

function uploadSessionToServer(localFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on("ready", () => {
      conn.sftp((err, sftp) => {
        if (err) {
          console.error("SFTP 오류:", err);
          conn.end();
          return reject(err);
        }

        const readStream = fs.createReadStream(localFile);
        const writeStream = sftp.createWriteStream("/root/land/data/naver-session.json");

        writeStream.on("close", () => {
          console.log("🚀 서버(/root/land/data/naver-session.json)로 세션 전송 완료!");
          console.log("\n==================================================");
          console.log("✨ 축하합니다! 이제 홈페이지에서 바로 네이버 블로그에 포스팅하실 수 있습니다.");
          console.log("==================================================");
          conn.end();
          resolve();
        });

        writeStream.on("error", (sftpErr) => {
          console.error("서버 파일 쓰기 오류:", sftpErr);
          conn.end();
          reject(sftpErr);
        });

        readStream.pipe(writeStream);
      });
    }).on("error", (connErr) => {
      console.error("서버 접속 오류:", connErr);
      reject(connErr);
    }).connect({
      host: "1.234.53.82",
      username: "root",
      password: "tlsgnsl3595!!"
    });
  });
}

main().catch(console.error);
