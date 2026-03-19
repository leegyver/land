import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as NaverStrategy } from "passport-naver";
import { Strategy as KakaoStrategy } from "passport-kakao";
import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, User } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// 데이터베이스 초기화
storage.initializeData().catch(console.error);

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "한국부동산비밀키",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24시간
      httpOnly: true,
    },
    store: storage.sessionStore // 세션 스토어 설정
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // 로컬 로그인 전략
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  // APP_URL 정제 (말단 슬래시 제거, 프로토콜 강제)
  // 사용자가 환경변수를 설정하지 않아도 작동하도록 프로덕션 도메인을 기본값으로 설정
  const defaultUrl = process.env.NODE_ENV === "production"
    ? "http://1.234.53.82" // Cafe24 VPS IP (기본값 변경)
    : "http://localhost:5000";

  let rawAppUrl = (process.env.APP_URL || defaultUrl).replace(/\/$/, "");

  // HTTPS 강제 로직 제거 (IP 접속 지원을 위해)
  // 도메인 연결 후 SSL 적용 시에는 APP_URL에 https://... 를 설정하면 됨
  if (!rawAppUrl.startsWith("http")) {
    rawAppUrl = `http://${rawAppUrl}`;
  }
  const appUrl = rawAppUrl;

  console.log("Auth Callback Base URL:", appUrl);

  // 네이버 로그인
  const profiles = {
    naver: {
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: `${appUrl}/api/auth/naver/callback`,
      svcCode: "0",
      authType: "reauthenticate"
    },
    kakao: {
      clientID: process.env.KAKAO_API_KEY,
      clientSecret: process.env.KAKAO_CLIENT_SECRET, // Kakao does not typically use clientSecret for web login
      callbackURL: `${appUrl}/api/auth/kakao/callback`,
    }
  };

  // Naver Strategy
  if (profiles.naver.clientID && profiles.naver.clientSecret) {
    passport.use(new NaverStrategy(profiles.naver,
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const username = `naver_${profile.id}`;
          let user = await storage.getUserByUsername(username);
          if (!user) {
            user = await storage.createUser({
              username,
              password: "", // Social login users don't have a local password
              email: profile.emails?.[0]?.value || null,
              nickname: profile.displayName || profile._json?.nickname || null,
              phone: profile._json?.mobile || null,
              role: "user",
              provider: "naver",
              providerId: profile.id
            });
            // 네이버 가입 알림
            await storage.createNotification({
              type: "signup",
              title: "새로운 네이버 가입",
              content: `${user.nickname || user.username}님이 네이버로 가입하셨습니다.`,
              isRead: false,
              linkUrl: "/admin?tab=users"
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    ));
  }

  // Kakao Strategy
  if (profiles.kakao.clientID) {
    passport.use(new KakaoStrategy(profiles.kakao,
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const username = `kakao_${profile.id}`;
          let user = await storage.getUserByUsername(username);
          if (!user) {
            user = await storage.createUser({
              username,
              password: "", // Social login users don't have a local password
              email: profile._json?.kakao_account?.email || null,
              nickname: profile.displayName || profile._json?.properties?.nickname || null,
              phone: null, // Kakao often doesn't provide phone directly
              role: "user",
              provider: "kakao",
              providerId: profile.id
            });
            // 카카오 가입 알림
            await storage.createNotification({
              type: "signup",
              title: "새로운 카카오 가입",
              content: `${user.nickname || user.username}님이 카카오로 가입하셨습니다.`,
              isRead: false,
              linkUrl: "/admin?tab=users"
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    ));
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, email, phone, nickname, birthDate, birthTime, isLunar } = req.body;
      const existingUser = await storage.getUserByUsername(username);

      if (existingUser) {
        return res.status(400).json({ message: "이미 존재하는 사용자 이름입니다" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        phone,
        nickname,
        birthDate,
        birthTime,
        isLunar: !!isLunar,
        role: "user"
      });

      // 일반 가입 알림
      await storage.createNotification({
        type: "signup",
        title: "새로운 회원 가입",
        content: `${user.nickname || user.username}님이 가입하셨습니다.`,
        isRead: false,
        linkUrl: "/admin?tab=users"
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // 비밀번호 정보는 클라이언트에 반환하지 않음
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: Express.User | false, info: { message: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });

      req.login(user, (err) => {
        if (err) return next(err);
        // 비밀번호 정보는 클라이언트에 반환하지 않음
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
    // 비밀번호 정보는 클라이언트에 반환하지 않음
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // 관리자 권한 검사 미들웨어
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "관리자 권한이 필요합니다." });
    }
    next();
  };

  // 관리자 전용 API 엔드포인트
  app.get("/api/admin/users", isAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await storage.getAllUsers();
      // 사용자 목록에서 비밀번호 정보 제거
      const usersWithoutPasswords = users.map((user: User) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });

  // 회원 정보 수정 API
  app.patch("/api/users/profile", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }

      const userId = req.user.id;
      const { currentPassword, password, email, phone, birthDate, birthTime, isLunar, nickname } = req.body;

      // 현재 사용자 정보 가져오기
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }

      // ... (password check logic)

      // 업데이트할 데이터 준비
      const updateData: any = {};
      if (password) {
        updateData.password = await hashPassword(password);
      }
      if (email !== undefined) {
        updateData.email = email;
      }
      if (phone !== undefined) {
        updateData.phone = phone;
      }
      if (birthDate !== undefined) {
        updateData.birthDate = birthDate;
      }
      if (birthTime !== undefined) {
        updateData.birthTime = birthTime;
      }
      if (isLunar !== undefined) {
        updateData.isLunar = isLunar;
      }
      if (nickname !== undefined) {
        updateData.nickname = nickname;
      }

      // 사용자 정보 업데이트
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(500).json({ message: "사용자 정보 업데이트에 실패했습니다." });
      }

      // 비밀번호 제외하고 응답
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // 비밀번호 변경 API
  app.patch("/api/users/password", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "현재 비밀번호와 새 비밀번호가 필요합니다." });
      }

      // 현재 사용자 정보 가져오기
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }

      // 현재 비밀번호 확인
      const isPasswordCorrect = await comparePasswords(currentPassword, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ message: "현재 비밀번호가 올바르지 않습니다." });
      }

      // 새 비밀번호 해싱 및 업데이트
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });

      if (!updatedUser) {
        return res.status(500).json({ message: "비밀번호 변경에 실패했습니다." });
      }

      res.json({ message: "비밀번호가 성공적으로 변경되었습니다." });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "유효하지 않은 사용자 ID입니다." });
      }

      // 관리자는 자기 자신을 삭제할 수 없음
      if (req.user && userId === req.user.id) {
        return res.status(400).json({ message: "관리자는 자신의 계정을 삭제할 수 없습니다." });
      }

      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "해당 사용자를 찾을 수 없습니다." });
      }

      res.status(200).json({ message: "사용자가 성공적으로 삭제되었습니다." });
    } catch (error) {
      next(error);
    }
  });

  // 네이버 로그인 라우트
  app.get('/api/auth/naver', passport.authenticate('naver'));

  // 네이버 로그인 콜백 라우트 (커스텀 콜백으로 에러 디버깅)
  app.get('/api/auth/naver/callback', (req, res, next) => {
    passport.authenticate('naver', (err: any, user: Express.User, info: any) => {
      if (err) {
        console.error("Naver Login Callback Error:", err);
        const errMsg = err.message || JSON.stringify(err);
        return res.redirect(`/auth?error=naver_login_failed&details=${encodeURIComponent(errMsg)}`);
      }
      if (!user) {
        console.error("Naver Login Failed: No User returned");
        return res.redirect('/auth?error=naver_login_failed_no_user');
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Session Login Error:", loginErr);
          return next(loginErr);
        }
        res.redirect('/');
      });
    })(req, res, next);
  });

  // 카카오 로그인 라우트
  app.get('/api/auth/kakao', passport.authenticate('kakao'));

  // 카카오 로그인 콜백 라우트
  app.get(
    '/api/auth/kakao/callback',
    passport.authenticate('kakao', {
      failureRedirect: '/auth?error=kakao_login_failed',
    }),
    (req, res) => {
      // 성공 시 홈페이지로 리다이렉트
      res.redirect('/');
    }
  );
}