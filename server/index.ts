import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { setupNewsScheduler } from "./news-fetcher";
import { seedInitialData } from "./seeder";

const app = express();
console.log("SERVER_STARTUP_ENV:", app.get("env"), "PROCESS_ENV:", process.env.NODE_ENV);

// ... existing code ...
// ... existing code ...
app.use(helmet());
app.use(compression());

// 기본 레이트 리밋 설정 (15분당 100건)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again later." }
});

// 로그인 및 문의하기 등 민감한 API에 좀 더 엄격한 제한 적용
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 20, // 20건만 허용
  message: { message: "Too many attempts, please try again after an hour." }
});

app.use("/api/auth/login", strictLimiter);
app.use("/api/inquiries", strictLimiter);
app.use("/api/", apiLimiter);

app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
// 파일 업로드 크기 제한 증가 (기본값 100kb → 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);

    // 뉴스 스케줄러 초기화
    setupNewsScheduler();

    // 초기 데이터 시딩 (DB가 비어있을 경우)
    seedInitialData().catch(console.error);
  });
})();
