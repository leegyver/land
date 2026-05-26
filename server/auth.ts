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
import { sendEmail, createWelcomeEmailTemplate } from "./mailer";

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
    secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',  // 프로덕션에서는 HTTPS 전용
      sameSite: "lax",    // CSRF 방어 + 같은 사이트 요청 허용
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
  const defaultUrl = process.env.NODE_ENV === "production"
    ? "https://leegyver.com" 
    : "http://localhost:5000";

  let rawAppUrl = (process.env.APP_URL || defaultUrl).replace(/\/$/, "");

  // 프로덕션 환경에서 잘못된 도메인(land.leegyver.com 등)이나 http 프로토콜이 들어온 경우 강제 교정
  if (process.env.NODE_ENV === "production") {
    if (rawAppUrl.includes("land.leegyver.com") || rawAppUrl.startsWith("http://")) {
      console.warn(`[AUTH] Invalid APP_URL detected: ${rawAppUrl}. Correcting to https://leegyver.com`);
      rawAppUrl = "https://leegyver.com";
    }
  }

  if (!rawAppUrl.startsWith("http")) {
    rawAppUrl = `http://${rawAppUrl}`;
  }
  const appUrl = rawAppUrl;

  console.log("[AUTH] Callback Base URL:", appUrl);

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
      clientSecret: process.env.KAKAO_CLIENT_SECRET || undefined, 
      callbackURL: `${appUrl}/api/auth/kakao/callback`,
    }
  };

  // Naver Strategy
  if (profiles.naver.clientID && profiles.naver.clientSecret) {
    passport.use(new NaverStrategy(profiles.naver as any,
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
              phone: profile._json?.mobile || "",
              role: "user",
              provider: "naver",
              providerId: profile.id
            });
            // 네이버 가입 관리자 알림 및 이메일 전송
            storage.createAdminNotification({
              type: "user_registration",
              relatedId: user.id,
              title: "새로운 네이버 가입",
              content: `${user.nickname || user.username}님이 네이버로 가입하셨습니다.`,
              isRead: false
            }).catch(console.error);

            if (user.email) {
              sendEmail(
                user.email,
                "[이가이버 부동산] 가입을 환영합니다!",
                createWelcomeEmailTemplate({ username: user.username, name: user.nickname || undefined })
              ).catch(console.error);
            }
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
    passport.use(new KakaoStrategy(profiles.kakao as any,
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
              phone: "", // Kakao often doesn't provide phone directly
              role: "user",
              provider: "kakao",
              providerId: profile.id
            });
            // 카카오 가입 알림
            storage.createAdminNotification({
              type: "user_registration",
              relatedId: user.id,
              title: "새로운 카카오 가입",
              content: `${user.nickname || user.username}님이 카카오로 가입하셨습니다.`,
              isRead: false
            }).catch(console.error);

            if (user.email) {
              sendEmail(
                user.email,
                "[이가이버 부동산] 가입을 환영합니다!",
                createWelcomeEmailTemplate({ username: user.username, name: user.nickname || undefined })
              ).catch(console.error);
            }
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
      
      if (!phone || phone.trim() === "") {
        return res.status(400).json({ message: "전화번호를 반드시 입력해주세요." });
      }

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
      storage.createAdminNotification({
        type: "user_registration",
        relatedId: user.id,
        title: "새로운 회원 가입",
        content: `${user.nickname || user.username}님이 가입하셨습니다.`,
        isRead: false
      }).catch(console.error);

      if (user.email) {
        sendEmail(
          user.email,
          "[이가이버 부동산] 가입을 환영합니다!",
          createWelcomeEmailTemplate({ username: user.username, name: user.nickname || undefined })
        ).catch(console.error);
      }

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

  // 아이디 찾기 API
  app.post("/api/auth/find-username", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, phone } = req.body;
      if (!email && !phone) {
        return res.status(400).json({ message: "이메일 또는 전화번호를 입력해주세요." });
      }

      // storage에 getAllUsers가 없다면 다른 방법 사용, 혹은 추가해야 함
      // 현재 존재하는 storage.getAllUsers() 사용
      const users = await storage.getAllUsers();
      const matchedUser = users.find(u => 
        (email && u.email === email) || (phone && u.phone === phone)
      );

      if (!matchedUser) {
        return res.status(404).json({ message: "가입된 사용자 정보를 찾을 수 없습니다." });
      }

      if (matchedUser.provider) {
        return res.status(400).json({ message: `해당 연락처는 소셜 로그인(${matchedUser.provider}) 계정으로 가입되어 있습니다.` });
      }

      // 아이디 마스킹 (ex: abc***)
      const username = matchedUser.username;
      const maskedUsername = username.length > 3 
        ? username.substring(0, 3) + "*".repeat(username.length - 3)
        : username.substring(0, 1) + "*".repeat(username.length - 1);

      res.json({ username: maskedUsername, message: "아이디 찾기 성공" });
    } catch (error) {
      next(error);
    }
  });

  // 비밀번호 찾기 API (임시 비밀번호 발급)
  app.post("/api/auth/find-password", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, email, phone } = req.body;
      if (!username || (!email && !phone)) {
        return res.status(400).json({ message: "아이디와 이메일(또는 전화번호)을 정확히 입력해주세요." });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "일치하는 회원 정보가 없습니다." });
      }

      if (user.provider) {
        return res.status(400).json({ message: `해당 계정은 소셜 로그인(${user.provider}) 전용입니다. 제공자를 통해 로그인해주세요.` });
      }

      const isMatch = (email && user.email === email) || (phone && user.phone === phone);
      if (!isMatch) {
         return res.status(404).json({ message: "일치하는 회원 정보가 없습니다." });
      }

      // 임시 비밀번호 생성 (8자리 영숫자)
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(tempPassword);
      
      await storage.updateUser(user.id, { password: hashedPassword });

      // 이메일이 있으면 이메일로 전송
      if (user.email) {
        const htmlContent = `
          <div style="font-family: 'Malgun Gothic', Dotum, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 8px; border-top: 5px solid #3b82f6;">
            <h2 style="color: #1e293b; margin-bottom: 20px; font-size: 24px; text-align: center;">이가이버 부동산 임시 비밀번호 안내</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
              요청하신 임시 비밀번호가 발급되었습니다.
            </p>
            <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 6px; text-align: center;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #3b82f6;">${tempPassword}</span>
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 20px; text-align: center;">
              로그인 후 반드시 내 프로필에서 비밀번호를 변경해 주시기 바랍니다.
            </p>
          </div>
        `;
        await sendEmail(user.email, "[이가이버 부동산] 임시 비밀번호 안내", htmlContent);
        return res.json({ message: "등록된 이메일로 임시 비밀번호를 발송했습니다." });
      } else {
        // 이메일이 없는 경우
        return res.json({ message: `임시 비밀번호가 발급되었습니다: [ ${tempPassword} ]\n로그인 후 즉시 비밀번호를 변경해 주세요.` });
      }
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
    if (!req.isAuthenticated() || (req.user.role !== "admin" && req.user.role !== "master")) {
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
      const { 
        currentPassword, password, email, phone, birthDate, birthTime, isLunar, nickname,
        businessName, realtorName, realtorPhone, realtorAddress, businessLicenseNo, realtorPhoto 
      } = req.body;

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
      if (businessName !== undefined) updateData.businessName = businessName;
      if (realtorName !== undefined) updateData.realtorName = realtorName;
      if (realtorPhone !== undefined) updateData.realtorPhone = realtorPhone;
      if (realtorAddress !== undefined) updateData.realtorAddress = realtorAddress;
      if (businessLicenseNo !== undefined) updateData.businessLicenseNo = businessLicenseNo;
      if (realtorPhoto !== undefined) updateData.realtorPhoto = realtorPhoto;

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

      const targetUser = await storage.getUser(userId);
      if (targetUser && targetUser.role === 'master') {
        return res.status(403).json({ message: "마스터 계정은 삭제할 수 없습니다." });
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