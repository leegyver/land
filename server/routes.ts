import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { db } from "./db";
import {
  insertInquirySchema,
  insertPropertySchema,
  insertNewsSchema,
  insertPropertyInquirySchema,
  insertFavoriteSchema,
  news
} from "@shared/schema";
import { memoryCache } from "./cache";
import { setupAuth } from "./auth";
import { fetchAndSaveNews, setupNewsScheduler } from "./news-fetcher";
import { sendEmail, createInquiryEmailTemplate } from "./mailer";
import { getRecentTransactions } from "./real-estate-api";
import { testRealEstateAPI } from "./test-api";
import { getLatestBlogPosts } from "./blog-fetcher";
import { getLatestYouTubeVideos, getChannelIdByHandle, fetchYouTubeShorts, fetchLatestYouTubeVideosWithAPI } from "./youtube-fetcher";
import { importPropertiesFromSheet, checkDuplicatesFromSheet } from "./sheet-importer";
import { log } from "./vite";

// 사이트 설정 (필요시 환경변수나 설정 파일로 이동 가능)
const siteConfig = {
  siteName: "이가이버 부동산",
  siteDescription: "강화도 부동산 중개 서비스",
  siteContactEmail: "contact@ganghwaestate.com"
};

export async function registerRoutes(app: Express): Promise<Server> {
  // 인증 시스템 설정
  setupAuth(app);

  // 사이트 설정 API
  app.get('/api/site/config', (req, res) => {
    res.json(siteConfig);
  });

  // 시스템 상태 진단 API (배포 디버깅용)
  app.get('/api/status', async (req, res) => {
    try {
      // 1. 환경 변수 존재 여부 확인 (값은 숨김)
      const envCheck = {
        FIREBASE_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
        YOUTUBE_KEY: !!process.env.YOUTUBE_API_KEY,
        NAVER_ID: !!process.env.NAVER_CLIENT_ID,
        NAVER_SECRET: !!process.env.NAVER_CLIENT_SECRET,
        // Server side doesn't see VITE_ keys usually, but helpful to check if passed
        VITE_KAKAO_KEY: !!process.env.VITE_KAKAO_MAP_KEY,
        NODE_ENV: process.env.NODE_ENV,
        APP_URL: process.env.APP_URL, // 값 확인 필요 (http/https mismatch 확인용)
      };

      const defaultUrl = process.env.NODE_ENV === "production"
        ? "https://land-5y3o.onrender.com"
        : "http://localhost:5000";
      const appUrl = (process.env.APP_URL || defaultUrl).replace(/\/$/, "");

      const authDebug = {
        naverCallback: `${appUrl}/api/auth/naver/callback`,
        kakaoCallback: `${appUrl}/api/auth/kakao/callback`
      };

      // 2. DB 연결 및 데이터 개수 테스트
      let dbStatus = "Unknown";
      let propertyCount = -1;
      let userCount = -1;

      try {
        const testProps = await storage.getProperties();
        const testUsers = await storage.getAllUsers();
        dbStatus = "Connected";
        propertyCount = testProps.length;
        userCount = testUsers.length;
      } catch (dbError) {
        dbStatus = `Error: ${dbError instanceof Error ? dbError.message : String(dbError)}`;
      }

      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: envCheck,
        authExpectedCallbacks: authDebug,
        database: {
          status: dbStatus,
          propertyCount,
          userCount,
          adminExists: userCount > 0 && (await storage.getUserByUsername('admin')) ? true : false
        }
      });
    } catch (e) {
      res.status(500).json({ status: "error", error: String(e) });
    }
  });

  // 수동 시딩 API (데이터 복구용)
  app.get('/api/admin/seed', async (req, res) => {
    try {
      const { seedInitialData } = await import("./seeder");
      await seedInitialData();
      res.json({ message: "Seeding executed. Check server logs for details or /api/status for count." });
    } catch (e) {
      res.status(500).json({ message: "Seeding failed", error: String(e) });
    }
  });

  // Replit 데이터 가져오기 API (마이그레이션)
  app.get('/api/admin/import-from-replit', async (req, res) => {
    try {
      const REMOTE_URL = 'https://real-estate-hub-mino312044.replit.app';

      // 동적 import로 fetch 사용
      const response = await fetch(`${REMOTE_URL}/api/properties`);
      if (!response.ok) throw new Error(`Failed to fetch from Replit: ${response.statusText}`);

      const properties: any[] = await response.json();
      let count = 0;

      for (const prop of properties) {
        // ID 충돌 방지를 위해 기존 ID 무시하거나 체크
        // 여기선 단순 생성을 시도
        const { id, createdAt, updatedAt, ...newProp } = prop;

        // 데이터 정제
        newProp.price = String(newProp.price || "0");
        newProp.size = String(newProp.size || "0");
        newProp.imageUrls = newProp.imageUrls || [];

        await storage.createProperty(newProp);
        count++;
        // Firestore 쿼터 제한 고려 딜레이
        await new Promise(r => setTimeout(r, 50));
      }

      res.json({
        message: "Migration started/completed.",
        source: REMOTE_URL,
        importedCount: count
      });
    } catch (e) {
      res.status(500).json({ message: "Migration failed", error: String(e) });
    }
  });

  // API ROUTES

  // Properties
  app.get("/api/properties", async (req, res) => {
    try {
      // 캐시 확인 여부를 쿼리 파라미터로 제어
      const skipCache = req.query.skipCache === 'true';

      if (!skipCache) {
        // 캐시에서 먼저 확인
        const cacheKey = "properties_all";
        const cachedProperties = memoryCache.get(cacheKey);

        if (cachedProperties) {
          return res.json(cachedProperties);
        }
      }

      // 캐시에 없거나 캐시 스킵 요청이면 DB에서 조회
      const properties = await storage.getProperties();

      // 캐시 스킵이 아닐 경우에만 캐시 저장
      if (!skipCache) {
        // 조회 결과를 캐시에 저장 (1분 동안 - 짧게 유지)
        memoryCache.set("properties_all", properties, 1 * 60 * 1000);
      }

      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // 관리자용 모든 매물 조회 (노출/미노출 포함)
  app.get("/api/admin/properties", async (req, res) => {
    try {
      // 인증 및 권한 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
      }

      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all properties" });
    }
  });

  app.get("/api/properties/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      // 캐시 비활성화 - 항상 최신 데이터를 가져옴
      const properties = await storage.getFeaturedProperties(limit);

      // 디버깅용 로그 추가
      console.log(`추천 매물 ${properties.length}개 조회됨:`,
        properties.map(p => `${p.id}:${p.title}(${p.featured ? '추천' : '일반'})`));

      res.json(properties);
    } catch (error) {
      console.error("Error fetching featured properties:", error);
      res.status(500).json({ message: "Failed to fetch featured properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.get("/api/properties/type/:type", async (req, res) => {
    try {
      const type = req.params.type;
      const properties = await storage.getPropertiesByType(type);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties by type" });
    }
  });

  app.get("/api/properties/district/:district", async (req, res) => {
    try {
      const district = req.params.district;
      const properties = await storage.getPropertiesByDistrict(district);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties by district" });
    }
  });

  app.get("/api/properties/price-range", async (req, res) => {
    try {
      const minParam = req.query.min;
      const maxParam = req.query.max;

      if (!minParam || !maxParam) {
        return res.status(400).json({ message: "Min and max parameters are required" });
      }

      const min = parseInt(minParam as string);
      const max = parseInt(maxParam as string);

      if (isNaN(min) || isNaN(max)) {
        return res.status(400).json({ message: "Min and max must be valid numbers" });
      }

      const properties = await storage.getPropertiesByPriceRange(min, max);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties by price range" });
    }
  });

  // Agents API
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);

      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin permission required" });
      }

      const agent = await storage.createAgent(req.body);
      res.status(201).json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  app.patch("/api/agents/:id", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin permission required" });
      }

      const id = parseInt(req.params.id);
      const agent = await storage.updateAgent(id, req.body);

      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  app.delete("/api/agents/:id", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin permission required" });
      }

      const id = parseInt(req.params.id);
      const result = await storage.deleteAgent(id);

      if (result) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Agent not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete agent" });
    }
  });

  // Testimonials API - 제거됨

  // Inquiries
  app.post("/api/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);

      // 이메일 발송 시도
      try {
        // 이메일 템플릿 생성
        const emailTemplate = createInquiryEmailTemplate({
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          message: validatedData.message
        });

        // 수신자 이메일 주소를 명시적으로 설정 
        const recipientEmail = '9551304@naver.com'; // 여기에 원하는 수신자 이메일을 직접 입력
        console.log(`수신자 이메일 설정: ${recipientEmail}`);

        // 이메일 발송
        const emailSent = await sendEmail(
          recipientEmail,
          `[이가이버부동산 웹사이트] ${validatedData.name}님의 새로운 문의가 등록되었습니다`,
          emailTemplate
        );

        if (emailSent) {
          console.log(`문의 ID ${inquiry.id}에 대한 알림 이메일 전송 완료`);
        } else {
          console.error(`문의 ID ${inquiry.id}에 대한 알림 이메일 전송 실패`);
        }
      } catch (emailError) {
        // 이메일 발송 실패 시 로그 기록만 하고 전체 요청은 실패로 처리하지 않음
        console.error('문의 알림 이메일 발송 중 오류 발생:', emailError);
      }

      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  // Property Inquiry Board API
  app.get("/api/properties/:propertyId/inquiries", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const property = await storage.getProperty(propertyId);

      if (!property) {
        return res.status(404).json({ message: "해당 매물을 찾을 수 없습니다." });
      }

      // 사용자 인증 상태 확인
      let user = null;
      let isAdmin = false;

      if (req.isAuthenticated()) {
        user = req.user as Express.User;
        isAdmin = user.role === "admin";
      }

      // 해당 매물에 대한 문의글 목록 가져오기
      const inquiries = await storage.getPropertyInquiries(propertyId);

      // 문의글 처리 (모든 사용자에게 제목은 표시하되, 내용은 권한에 따라 필터링)
      // 모든 문의글을 기본적으로 제공하되, 열람 권한이 없는 경우 내용을 숨김
      const filteredInquiries = inquiries.map(inquiry => {
        // 1. 관리자인 경우: 모든 문의글 전체 내용 볼 수 있음
        if (isAdmin) return inquiry;

        // 2. 로그인한 사용자이고 자신이 작성한 글은 전체 내용 볼 수 있음
        if (user && inquiry.userId === user.id) return inquiry;

        // 3. 로그인한 사용자이고 답변글인 경우 자신이 작성한 문의글의 답변만 내용을 볼 수 있음
        if (user && inquiry.isReply && inquiry.parentId) {
          // 원글 작성자 찾기
          const parentInquiry = inquiries.find(i => i.id === inquiry.parentId);
          if (user && parentInquiry?.userId === user.id) return inquiry;

          // 원글 작성자가 아닌 경우 내용을 숨김
          return {
            ...inquiry,
            content: "권한이 없습니다. 이 답변은 문의 작성자와 관리자만 볼 수 있습니다." // 내용 숨김
          };
        }

        // 4. 일반 문의글은 제목과 작성자 정보만 볼 수 있음 (내용 숨김)
        return {
          ...inquiry,
          content: "권한이 없습니다. 이 문의글은 작성자와 관리자만 볼 수 있습니다." // 내용 숨김
        };
      });

      res.json(filteredInquiries);
    } catch (error) {
      console.error("Error getting property inquiries:", error);
      res.status(500).json({ message: "문의글 목록을 가져오는 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/properties/:propertyId/inquiries", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const propertyId = parseInt(req.params.propertyId);
      const property = await storage.getProperty(propertyId);

      if (!property) {
        return res.status(404).json({ message: "해당 매물을 찾을 수 없습니다." });
      }

      const user = req.user as Express.User;

      // 답변을 작성하는 경우 권한 확인 (관리자만 가능)
      if (req.body.isReply) {
        const isAdmin = user.role === "admin";

        if (!isAdmin) {
          return res.status(403).json({ message: "답변은 관리자만 작성할 수 있습니다." });
        }

        // 부모 문의글 확인
        const parentId = req.body.parentId;
        if (!parentId) {
          return res.status(400).json({ message: "답변에는 부모 문의글 ID가 필요합니다." });
        }

        // 부모 문의글 조회하여 존재하는지 확인
        const parentInquiry = await storage.getPropertyInquiry(parentId);
        if (!parentInquiry) {
          return res.status(404).json({ message: "원본 문의글을 찾을 수 없습니다." });
        }

        // 부모 문의글이 답변글이 아닌지 확인 (답변에 답변을 달 수 없음)
        if (parentInquiry.isReply) {
          return res.status(400).json({ message: "답변에는 추가 답변을 달 수 없습니다." });
        }
      }

      const inquiryData = {
        ...req.body,
        propertyId,
        userId: user.id,
      };

      const validatedData = insertPropertyInquirySchema.parse(inquiryData);
      const inquiry = await storage.createPropertyInquiry(validatedData);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "잘못된 문의글 데이터입니다.", errors: error.errors });
      }
      console.error("Error creating property inquiry:", error);
      res.status(500).json({ message: "문의글 작성 중 오류가 발생했습니다." });
    }
  });

  app.delete("/api/properties/:propertyId/inquiries/:inquiryId", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const inquiryId = parseInt(req.params.inquiryId);
      const inquiry = await storage.getPropertyInquiry(inquiryId);

      if (!inquiry) {
        return res.status(404).json({ message: "해당 문의글을 찾을 수 없습니다." });
      }

      // 접근 권한 확인 (작성자 또는 관리자만 삭제 가능)
      const user = req.user as Express.User;
      const isAdmin = user.role === "admin";
      const isAuthor = inquiry.userId === user.id;

      if (!isAdmin && !isAuthor) {
        return res.status(403).json({ message: "해당 문의글을 삭제할 권한이 없습니다." });
      }

      const success = await storage.deletePropertyInquiry(inquiryId);
      if (success) {
        res.status(200).json({ message: "문의글이 삭제되었습니다." });
      } else {
        res.status(500).json({ message: "문의글 삭제 중 오류가 발생했습니다." });
      }
    } catch (error) {
      console.error("Error deleting property inquiry:", error);
      res.status(500).json({ message: "문의글 삭제 중 오류가 발생했습니다." });
    }
  });

  // 관리자용 문의글 알림 API
  app.get("/api/admin/inquiries/unread", async (req, res) => {
    try {
      // 관리자 권한 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
      }

      const unreadInquiries = await storage.getUnreadInquiries();
      res.json(unreadInquiries);
    } catch (error) {
      console.error("Error getting unread inquiries:", error);
      res.status(500).json({ message: "미읽은 문의글을 가져오는 중 오류가 발생했습니다." });
    }
  });

  app.get("/api/admin/inquiries/unread/count", async (req, res) => {
    try {
      // 관리자 권한 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
      }

      const count = await storage.getUnreadInquiryCount();
      res.json({ count });
    } catch (error) {
      console.error("Error getting unread inquiry count:", error);
      res.status(500).json({ message: "미읽은 문의글 수를 가져오는 중 오류가 발생했습니다." });
    }
  });

  app.put("/api/admin/inquiries/:inquiryId/read", async (req, res) => {
    try {
      // 관리자 권한 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
      }

      const inquiryId = parseInt(req.params.inquiryId);
      const success = await storage.markInquiryAsRead(inquiryId);

      if (success) {
        res.json({ message: "문의글을 읽음 처리했습니다." });
      } else {
        res.status(500).json({ message: "읽음 처리 중 오류가 발생했습니다." });
      }
    } catch (error) {
      console.error("Error marking inquiry as read:", error);
      res.status(500).json({ message: "읽음 처리 중 오류가 발생했습니다." });
    }
  });

  app.put("/api/admin/inquiries/read-all", async (req, res) => {
    try {
      // 관리자 권한 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
      }

      const success = await storage.markAllInquiriesAsRead();

      if (success) {
        res.json({ message: "모든 문의글을 읽음 처리했습니다." });
      } else {
        res.status(500).json({ message: "읽음 처리 중 오류가 발생했습니다." });
      }
    } catch (error) {
      console.error("Error marking all inquiries as read:", error);
      res.status(500).json({ message: "읽음 처리 중 오류가 발생했습니다." });
    }
  });

  // Search properties
  app.get("/api/search", async (req, res) => {
    try {
      const { district, type, minPrice, maxPrice, keyword } = req.query;
      console.log("검색 파라미터:", { district, type, minPrice, maxPrice, keyword });

      let properties = await storage.getProperties();

      // 키워드 검색 (제목, 설명, 주소에서 검색)
      if (keyword && typeof keyword === 'string' && keyword.trim() !== '') {
        const searchKeyword = keyword.toLowerCase().trim();
        console.log(`키워드 검색: "${searchKeyword}"`);

        properties = properties.filter(p => {
          const title = (p.title || '').toLowerCase();
          const description = (p.description || '').toLowerCase();
          const address = (p.address || '').toLowerCase();
          const district = (p.district || '').toLowerCase();

          return title.includes(searchKeyword) ||
            description.includes(searchKeyword) ||
            address.includes(searchKeyword) ||
            district.includes(searchKeyword);
        });
        console.log(`키워드 검색 결과: ${properties.length}개 매물`);
      }

      // 지역 필터링 (district 값이 존재하고 "all"이 아닌 경우)
      if (district && district !== "all") {
        console.log(`지역 필터링: ${district}`);

        properties = properties.filter(p => {
          // 매물의 district 필드가 없는 경우를 대비한 안전 처리
          const propertyDistrict = (p.district || "").toLowerCase();
          // 검색 조건의 district를 소문자로 변환
          const searchDistrict = (district as string).toLowerCase();

          // 이 부분에서 로그를 추가하여 디버깅
          console.log(`매물 ID ${p.id}의 지역: "${propertyDistrict}", 검색 지역: "${searchDistrict}"`);

          // 검색 조건 분석: 정확한 일치 검색 (등록 시와 동일한 지역명 사용)
          let isMatch = false;

          // 정확한 일치 케이스 
          if (propertyDistrict === searchDistrict) {
            isMatch = true;
          }
          // 기타지역 특수 케이스 (district 필드가 비어있거나 '강화'가 포함되지 않은 경우)
          else if (searchDistrict === '기타지역') {
            isMatch = !propertyDistrict.includes('강화') || propertyDistrict === '';
          }
          // all인 경우 모든 매물 표시
          else if (searchDistrict === 'all') {
            isMatch = true;
          }

          if (isMatch) {
            console.log(`✓ 매칭 매물 발견: ${p.id}, ${p.title}, ${p.district}`);
          }

          return isMatch;
        });
      }

      // 유형 필터링 (type 값이 존재하고 "all"이 아닌 경우)
      if (type && type !== "all") {
        properties = properties.filter(p => {
          // 대소문자 구분 없이 비교
          const propertyType = (p.type || "").toLowerCase();
          const searchType = (type as string).toLowerCase();
          return propertyType.includes(searchType);
        });
      }

      // 가격 범위 필터링 (minPrice와 maxPrice 둘 다 존재하는 경우)
      if (minPrice && maxPrice) {
        const min = parseInt(minPrice as string);
        const max = parseInt(maxPrice as string);

        if (!isNaN(min) && !isNaN(max)) {
          properties = properties.filter(p => {
            const price = p.price !== undefined ? Number(p.price) : 0;
            return price >= min && price <= max;
          });
        }
      }

      console.log(`검색 결과: ${properties.length}개 매물`);
      res.json(properties);
    } catch (error) {
      console.error("매물 검색 오류:", error);
      res.status(500).json({ message: "매물 검색 중 오류가 발생했습니다." });
    }
  });

  // 관리자 전용 API 엔드포인트
  // 부동산 생성
  app.post("/api/properties", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // 디버깅 로그 추가
      console.log('부동산 등록 요청 데이터:', JSON.stringify(req.body, null, 2));

      try {
        // 숫자 필드에서 쉼표 제거하는 헬퍼 함수
        const stripCommas = (value: any): string | null => {
          if (value === "" || value === null || value === undefined) return null;
          return String(value).replace(/,/g, '');
        };

        // 다중 이미지 URLs 배열을 처리
        // imageUrls가 있으면 그대로 사용하고, 없으면 기본값인 빈 배열을 사용
        // 타입을 변환하지 않고 원래 타입 그대로 유지
        // bedrooms, bathrooms와 숫자 타입 필드의 빈 문자열을 변환
        const processedData = {
          ...req.body,
          bedrooms: req.body.bedrooms !== undefined ? req.body.bedrooms : 0,
          bathrooms: req.body.bathrooms !== undefined ? req.body.bathrooms : 0,
          // 이미지 URL 필드 처리
          imageUrls: Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [],
          // dealType 처리 - 배열로 변환
          dealType: Array.isArray(req.body.dealType) ? req.body.dealType :
            (req.body.dealType ? [req.body.dealType] : ['매매']),
          // 숫자 필드들 - 쉼표 제거 후 처리
          price: stripCommas(req.body.price) || "0",
          size: stripCommas(req.body.size) || "0",
          // agentId 처리 - 필수 필드이므로 기본값 설정 (database에서는 agent_id로 저장됨)
          agentId: (() => {
            const raw = Number(req.body.agentId || req.body.agent_id);
            return Number.isFinite(raw) && raw > 0 ? raw : 4; // NaN이나 무효한 값이면 기본값 4 (이민호 중개사)
          })(),
          supplyArea: stripCommas(req.body.supplyArea),
          privateArea: stripCommas(req.body.privateArea),
          floor: req.body.floor === "" ? null : (req.body.floor ? parseInt(req.body.floor) || null : null),
          totalFloors: req.body.totalFloors === "" ? null : (req.body.totalFloors ? parseInt(req.body.totalFloors) || null : null),
          deposit: stripCommas(req.body.deposit),
          depositAmount: stripCommas(req.body.depositAmount),
          monthlyRent: stripCommas(req.body.monthlyRent),
          maintenanceFee: stripCommas(req.body.maintenanceFee)
        };

        console.log('처리된 데이터:', JSON.stringify(processedData, null, 2));

        const validatedData = insertPropertySchema.parse(processedData);
        const property = await storage.createProperty(validatedData);
        res.status(201).json(property);
      } catch (e) {
        if (e instanceof z.ZodError) {
          console.error('유효성 검사 오류:', JSON.stringify(e.errors, null, 2));
          return res.status(400).json({ message: "Invalid property data", errors: e.errors });
        }
        throw e;
      }
    } catch (error) {
      console.error('부동산 등록 오류:', error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  // 부동산 수정
  app.patch("/api/properties/:id", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      const existingProperty = await storage.getProperty(id);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }

      // 숫자 필드에서 쉼표 제거하는 헬퍼 함수
      const stripCommas = (value: any): string | null => {
        if (value === "" || value === null || value === undefined) return null;
        return String(value).replace(/,/g, '');
      };

      // 신규 등록과 완전히 동일한 데이터 처리 로직 적용
      const processedData = {
        ...req.body,
        bedrooms: req.body.bedrooms !== undefined ? req.body.bedrooms : (existingProperty.bedrooms || 0),
        bathrooms: req.body.bathrooms !== undefined ? req.body.bathrooms : (existingProperty.bathrooms || 0),
        // 이미지 URL 필드 처리
        imageUrls: Array.isArray(req.body.imageUrls) ? req.body.imageUrls : (req.body.imageUrls ? [req.body.imageUrls] : existingProperty.imageUrls || []),
        // dealType 처리 - 배열로 변환
        dealType: Array.isArray(req.body.dealType) ? req.body.dealType :
          (req.body.dealType ? [req.body.dealType] : (existingProperty.dealType || ['매매'])),
        // 숫자 필드들 - 쉼표 제거 후 처리
        price: stripCommas(req.body.price) || existingProperty.price || "0",
        size: stripCommas(req.body.size) || existingProperty.size || "0",
        // agentId 처리 - 필수 필드이므로 기본값 설정 (database에서는 agent_id로 저장됨)
        agentId: (() => {
          const raw = Number(req.body.agentId || req.body.agent_id || existingProperty.agentId);
          return Number.isFinite(raw) && raw > 0 ? raw : 4; // NaN이나 무효한 값이면 기본값 4 (이민호 중개사)
        })(),
        supplyArea: stripCommas(req.body.supplyArea),
        privateArea: stripCommas(req.body.privateArea),
        floor: req.body.floor === "" ? null : (req.body.floor ? parseInt(req.body.floor) || null : null),
        totalFloors: req.body.totalFloors === "" ? null : (req.body.totalFloors ? parseInt(req.body.totalFloors) || null : null),
        deposit: stripCommas(req.body.deposit),
        depositAmount: stripCommas(req.body.depositAmount),
        monthlyRent: stripCommas(req.body.monthlyRent),
        maintenanceFee: stripCommas(req.body.maintenanceFee)
      };

      const validatedData = insertPropertySchema.partial().parse(processedData);
      const updatedProperty = await storage.updateProperty(id, validatedData);

      res.json(updatedProperty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('부동산 수정 유효성 검사 오류:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      console.error('부동산 수정 오류:', error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  // 부동산 삭제
  app.delete("/api/properties/:id", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      const exists = await storage.getProperty(id);
      if (!exists) {
        return res.status(404).json({ message: "Property not found" });
      }

      const result = await storage.deleteProperty(id);

      if (result) {
        // 부동산 캐시 모두 삭제
        memoryCache.deleteByPrefix("properties_");
        res.json({ success: true });
      } else {
        res.status(500).json({ message: "Failed to delete property" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // 관리자 전용 사용자 목록 조회
  app.get("/api/admin/users", async (req, res) => {
    try {
      // 인증 및 관리자 권한 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user;
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin permission required" });
      }

      const users = await storage.getAllUsers();

      // 비밀번호 정보 제외하고 반환
      const usersWithoutPasswords = users.map(({ password, ...userData }) => userData);

      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // 관심매물 APIs
  // 사용자의 관심매물 목록 조회
  app.get("/api/favorites", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      const favoriteProperties = await storage.getFavoriteProperties(user.id);

      res.json(favoriteProperties);
    } catch (error) {
      console.error("Error fetching favorite properties:", error);
      res.status(500).json({ message: "관심매물 목록을 가져오는 중 오류가 발생했습니다." });
    }
  });

  // 매물이 관심매물에 등록되어 있는지 확인
  app.get("/api/properties/:propertyId/is-favorite", async (req, res) => {
    try {
      // 인증되지 않은 사용자는 false 반환
      if (!req.isAuthenticated()) {
        return res.json({ isFavorite: false });
      }

      const propertyId = parseInt(req.params.propertyId);
      const user = req.user as Express.User;

      const isFavorite = await storage.isFavorite(user.id, propertyId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking if property is favorite:", error);
      res.status(500).json({ message: "관심매물 확인 중 오류가 발생했습니다." });
    }
  });

  // 관심매물 추가
  app.post("/api/favorites", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      const propertyId = parseInt(req.body.propertyId);

      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "유효하지 않은 매물 ID입니다." });
      }

      // 매물이 존재하는지 확인
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "해당 매물을 찾을 수 없습니다." });
      }

      const favoriteData = {
        userId: user.id,
        propertyId: propertyId
      };

      try {
        const favorite = await storage.addFavorite(favoriteData);
        res.status(201).json({ message: "관심매물로 등록되었습니다.", favorite });
      } catch (err) {
        // 이미 관심매물로 등록되어 있는 경우
        if (err instanceof Error && err.message.includes("이미 관심 매물로 등록")) {
          return res.status(409).json({ message: "이미 관심매물로 등록되어 있습니다." });
        }
        throw err;
      }
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "관심매물 등록 중 오류가 발생했습니다." });
    }
  });

  // 관심매물 삭제
  app.delete("/api/favorites/:propertyId", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      const propertyId = parseInt(req.params.propertyId);

      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "유효하지 않은 매물 ID입니다." });
      }

      const success = await storage.removeFavorite(user.id, propertyId);

      if (success) {
        res.json({ message: "관심매물에서 삭제되었습니다." });
      } else {
        res.status(404).json({ message: "해당 관심매물을 찾을 수 없습니다." });
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "관심매물 삭제 중 오류가 발생했습니다." });
    }
  });

  // News API 엔드포인트

  // 모든 뉴스 가져오기
  app.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ message: "뉴스를 불러오는데 실패했습니다" });
    }
  });

  // API 테스트 엔드포인트 (문제 해결용)
  app.get("/api/test-real-estate", async (req, res) => {
    try {
      await testRealEstateAPI();
      res.json({
        success: true,
        message: "API 테스트 완료, 서버 로그를 확인하세요"
      });
    } catch (error) {
      console.error("API 테스트 오류:", error);
      res.status(500).json({
        success: false,
        message: "API 테스트 중 오류 발생"
      });
    }
  });

  // 부동산 실거래가 API 라우트
  app.get("/api/real-estate/transactions", async (req, res) => {
    try {
      // 지역코드 (기본값: 강화군 28710)
      const regionCode = req.query.regionCode as string || '28710';

      console.log(`실거래가 데이터 요청: 지역코드=${regionCode}`);
      const transactions = await getRecentTransactions(regionCode);

      res.json({
        success: true,
        count: transactions.length,
        data: transactions
      });
    } catch (error) {
      console.error("실거래가 데이터 조회 오류:", error);
      res.status(500).json({
        success: false,
        message: "실거래가 데이터를 가져오는 중 오류가 발생했습니다."
      });
    }
  });

  // 최신 유튜브 영상 가져오기
  app.get("/api/youtube/latest", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      // 캐시에서 확인
      const cacheKey = `youtube_latest_${limit}`;
      const cachedVideos = memoryCache.get(cacheKey);

      if (cachedVideos) {
        return res.json(cachedVideos);
      }

      // 이가이버 유튜브 채널에서 최신 영상 가져오기
      const channelUrl = "https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA?view_as=subscriber";
      const videos = await getLatestYouTubeVideos(channelUrl, limit);

      // 캐시에 저장 (6시간)
      memoryCache.set(cacheKey, videos, 6 * 60 * 60 * 1000);

      res.json(videos);
    } catch (error) {
      console.error("유튜브 영상 가져오기 오류:", error);
      res.status(500).json({
        message: "최신 유튜브 영상을 불러오는데 실패했습니다",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 특정 유튜브 채널 영상 가져오기 (일반 영상만, 쇼츠 제외)
  app.get("/api/youtube/channel/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const refresh = req.query.refresh === 'true';

      // 캐시에서 확인
      const cacheKey = `youtube_channel_videos_${channelId}_${limit}`;

      if (refresh) {
        memoryCache.delete(cacheKey);
      }

      const cachedVideos = memoryCache.get(cacheKey);

      if (cachedVideos) {
        return res.json(cachedVideos);
      }

      // 채널 ID로 직접 영상 가져오기 (일반 영상만 - medium/long duration)
      const videos = await fetchLatestYouTubeVideosWithAPI(channelId, limit);

      // 캐시에 저장 (6시간)
      memoryCache.set(cacheKey, videos, 6 * 60 * 60 * 1000);

      res.json(videos);
    } catch (error) {
      console.error("유튜브 채널 영상 가져오기 오류:", error);
      res.status(500).json({
        message: "유튜브 채널 영상을 불러오는데 실패했습니다",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 유튜브 핸들로 채널 ID 조회
  app.get("/api/youtube/handle/:handle", async (req, res) => {
    try {
      const { handle } = req.params;

      // 캐시에서 확인
      const cacheKey = `youtube_handle_${handle}`;
      const cachedChannelId = memoryCache.get(cacheKey);

      if (cachedChannelId) {
        return res.json({ channelId: cachedChannelId });
      }

      const channelId = await getChannelIdByHandle(handle);

      if (!channelId) {
        return res.status(404).json({ message: "채널을 찾을 수 없습니다" });
      }

      // 캐시에 저장 (24시간)
      memoryCache.set(cacheKey, channelId, 24 * 60 * 60 * 1000);

      res.json({ channelId });
    } catch (error) {
      console.error("유튜브 핸들 조회 오류:", error);
      res.status(500).json({
        message: "채널 ID 조회에 실패했습니다",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 유튜브 쇼츠 가져오기
  app.get("/api/youtube/shorts/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      // 캐시에서 확인
      const cacheKey = `youtube_shorts_${channelId}_${limit}`;
      const cachedShorts = memoryCache.get(cacheKey);

      if (cachedShorts) {
        return res.json(cachedShorts);
      }

      const shorts = await fetchYouTubeShorts(channelId, limit);

      // 캐시에 저장 (6시간)
      memoryCache.set(cacheKey, shorts, 6 * 60 * 60 * 1000);

      res.json(shorts);
    } catch (error) {
      console.error("유튜브 쇼츠 가져오기 오류:", error);
      res.status(500).json({
        message: "유튜브 쇼츠를 불러오는데 실패했습니다",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 네이버 블로그 최신 글 가져오기
  app.get("/api/blog/latest", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3; // 기본값 3으로 변경
      const blogId = req.query.blogId as string || '9551304';
      // 네이버 블로그 카테고리:
      // - 35: 나의 취미생활
      // - 36: 부동산정보
      // - 37: 세상이야기
      const categories = req.query.categories
        ? (req.query.categories as string).split(',')
        : ['35', '36', '37'];

      // 캐시를 강제로 초기화하는 쿼리 파라미터 추가
      const refresh = req.query.refresh === 'true';

      // 캐시에서 확인
      const cacheKey = `blog_latest_${blogId}_${categories.join('_')}_${limit}`;

      // 현재 시간 기준으로 캐시가 10분 이상 지났으면 자동 갱신
      const now = Date.now();
      const cacheTimestamp = memoryCache.getTimestamp(cacheKey);
      const cacheAge = cacheTimestamp ? now - cacheTimestamp : Infinity;
      const shouldRefresh = refresh || !cacheTimestamp || cacheAge > 10 * 60 * 1000; // 10분

      // 캐시 초기화가 필요하면 캐시 삭제
      if (shouldRefresh) {
        console.log(`블로그 캐시 초기화 (키: ${cacheKey}, 사유: ${refresh ? '강제 갱신' : '자동 갱신'}, 경과시간: ${cacheAge / 1000}초)`);
        memoryCache.delete(cacheKey);
      }

      const cachedPosts = memoryCache.get(cacheKey);

      if (cachedPosts) {
        if (Array.isArray(cachedPosts) && cachedPosts.length > 0) {
          console.log(`블로그 캐시에서 ${cachedPosts.length}개 포스트 반환`);
          return res.json(cachedPosts);
        } else {
          console.log('블로그 캐시가 비어있거나, 잘못된 형식입니다. 새로 가져옵니다.');
          memoryCache.delete(cacheKey);
        }
      }

      console.log(`블로그 데이터 새로 요청 (키: ${cacheKey})`);

      // 네이버 블로그에서 최신 포스트 가져오기
      // 기존 global blogCache 초기화를 먼저 수행
      if (refresh) {
        console.log('강제 새로고침 요청 - 전역 블로그 캐시 초기화');
        // blogCache를 직접 import하여 사용
        try {
          // blog-fetcher에서 blogCache를 import
          const blogFetcher = require('./blog-fetcher');
          if (blogFetcher.blogCache) {
            blogFetcher.blogCache = {};
            console.log('블로그 캐시가 완전히 초기화되었습니다. 모든 데이터를 새로 가져옵니다.');
          }
        } catch (e) {
          console.error('블로그 캐시 초기화 실패:', e);
        }
      }

      let posts = await getLatestBlogPosts(blogId, categories, limit);

      // 데이터 유효성 검사 - 포스트가 없으면 다시 시도
      if (!posts || posts.length === 0) {
        console.log('블로그 데이터 조회 실패, 카테고리 변경 후 재시도');
        // 기본 카테고리를 변경하여 다시 시도
        posts = await getLatestBlogPosts(blogId, ['0', '11'], limit);
      }

      // 포스트가 없으면 고정 대체 데이터 제공 (항상 실제 데이터를 먼저 시도)
      if (!posts || !Array.isArray(posts) || posts.length === 0) {
        console.log('네이버 블로그에서 포스트를 가져오지 못했습니다. 다시 시도합니다.');

        // 두 번째 시도
        try {
          posts = await getLatestBlogPosts(blogId, ['11', '0'], limit);
        } catch (retryErr) {
          console.error('블로그 데이터 두 번째 시도 실패:', retryErr);
        }
      }

      // 데이터 검증 - 잘못된 형식 필터링
      if (Array.isArray(posts)) {
        posts = posts.filter(post =>
          post &&
          typeof post === 'object' &&
          post.id &&
          post.title &&
          post.link
        );

        // 제목 중복 제거 및 길이 조정
        const uniqueTitles = new Set<string>();
        posts = posts.filter(post => {
          if (!post.title || uniqueTitles.has(post.title)) return false;
          uniqueTitles.add(post.title);

          // 제목이 너무 길면 자르기
          if (post.title.length > 50) {
            post.title = post.title.substring(0, 50) + '...';
          }

          return true;
        });
      }

      // 캐시에 저장 (30분)
      if (Array.isArray(posts) && posts.length > 0) {
        console.log(`${posts.length}개의 블로그 포스트를 캐시에 저장 (30분)`);
        memoryCache.set(cacheKey, posts, 30 * 60 * 1000);
      } else {
        console.log('유효한 블로그 포스트가 없습니다.');
      }

      res.json(posts);
    } catch (error) {
      console.error("블로그 포스트 가져오기 오류:", error);
      res.status(500).json({
        message: "최신 블로그 포스트를 불러오는데 실패했습니다",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 최신 뉴스 가져오기
  app.get("/api/news/latest", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;

      // 캐시에서 확인
      const cacheKey = `news_latest_${limit}`;
      const cachedNews = memoryCache.get(cacheKey);

      if (cachedNews) {
        return res.json(cachedNews);
      }

      const news = await storage.getLatestNews(limit);

      // 캐시에 저장 (5분)
      memoryCache.set(cacheKey, news, 5 * 60 * 1000);

      res.json(news);
    } catch (error) {
      res.status(500).json({ message: "최신 뉴스를 불러오는데 실패했습니다" });
    }
  });

  // 특정 뉴스 가져오기
  app.get("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "유효하지 않은 뉴스 ID입니다" });
      }

      const newsItem = await storage.getNewsById(id);
      if (!newsItem) {
        return res.status(404).json({ message: "뉴스를 찾을 수 없습니다" });
      }

      res.json(newsItem);
    } catch (error) {
      res.status(500).json({ message: "뉴스를 불러오는데 실패했습니다" });
    }
  });

  // 카테고리별 뉴스 가져오기
  app.get("/api/news/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const news = await storage.getNewsByCategory(category);
      res.json(news);
    } catch (error) {
      res.status(500).json({ message: "카테고리별 뉴스를 불러오는데 실패했습니다" });
    }
  });

  // 관리자: 뉴스 생성
  app.post("/api/news", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증이 필요합니다" });
      }

      const validatedData = insertNewsSchema.parse(req.body);
      const newsItem = await storage.createNews(validatedData);
      res.status(201).json(newsItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "유효하지 않은 뉴스 데이터입니다", errors: error.errors });
      }
      res.status(500).json({ message: "뉴스 생성에 실패했습니다" });
    }
  });

  // 관리자: 뉴스 수정
  app.patch("/api/news/:id", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증이 필요합니다" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "유효하지 않은 뉴스 ID입니다" });
      }

      const existingNews = await storage.getNewsById(id);
      if (!existingNews) {
        return res.status(404).json({ message: "뉴스를 찾을 수 없습니다" });
      }

      const validatedData = insertNewsSchema.partial().parse(req.body);
      const updatedNews = await storage.updateNews(id, validatedData);

      res.json(updatedNews);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "유효하지 않은 뉴스 데이터입니다", errors: error.errors });
      }
      res.status(500).json({ message: "뉴스 수정에 실패했습니다" });
    }
  });

  // 관리자: 뉴스 삭제
  app.delete("/api/news/:id", async (req, res) => {
    try {
      // 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증이 필요합니다" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "유효하지 않은 뉴스 ID입니다" });
      }

      const exists = await storage.getNewsById(id);
      if (!exists) {
        return res.status(404).json({ message: "뉴스를 찾을 수 없습니다" });
      }

      const result = await storage.deleteNews(id);

      if (result) {
        res.json({ success: true });
      } else {
        res.status(500).json({ message: "뉴스 삭제에 실패했습니다" });
      }
    } catch (error) {
      res.status(500).json({ message: "뉴스 삭제에 실패했습니다" });
    }
  });

  // 뉴스 수동 업데이트 API 엔드포인트 (GET: 테스트용, POST: 정식 인터페이스)
  app.get("/api/admin/update-news", async (req, res) => {
    try {
      // 관리자 인증 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증이 필요합니다" });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자 권한이 필요합니다." });
      }

      // 뉴스 수동 업데이트 실행
      let newsItems = [];
      try {
        newsItems = await fetchAndSaveNews();
        console.log("뉴스 업데이트 성공:", newsItems.length, "개의 뉴스 항목");
      } catch (err) {
        const fetchError = err as Error;
        console.error("뉴스 업데이트 중 오류:", fetchError);
        return res.status(500).json({ message: "뉴스 업데이트 중 오류가 발생했습니다: " + fetchError.message });
      }

      return res.json({
        success: true,
        message: "뉴스가 성공적으로 업데이트되었습니다.",
        count: newsItems.length
      });
    } catch (error) {
      console.error("뉴스 수동 업데이트 API 오류:", error);
      return res.status(500).json({ message: "뉴스 업데이트 중 오류가 발생했습니다." });
    }
  });

  // 추천 매물 순서 변경 API
  app.put("/api/properties/:id/order", async (req, res) => {
    try {
      // 인증 및 권한 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
      }

      const propertyId = parseInt(req.params.id);
      const { displayOrder } = req.body;

      if (typeof displayOrder !== 'number') {
        return res.status(400).json({ message: "Display order must be a number" });
      }

      const success = await storage.updatePropertyOrder(propertyId, displayOrder);

      if (!success) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.json({ message: "Property order updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update property order" });
    }
  });

  // 매물 노출 상태 토글 API
  app.patch("/api/properties/:id/visibility", async (req, res) => {
    try {
      // 인증 및 권한 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
      }

      const propertyId = parseInt(req.params.id);
      const { isVisible } = req.body;

      if (!propertyId || typeof isVisible !== 'boolean') {
        return res.status(400).json({ message: "Property ID and visibility state are required" });
      }

      const success = await storage.togglePropertyVisibility(propertyId, isVisible);

      if (!success) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.json({ message: "Property visibility updated successfully" });
    } catch (error) {
      console.error("Error updating property visibility:", error);
      res.status(500).json({ message: "Failed to update property visibility" });
    }
  });

  // 매물 추천 상태 토글 API
  app.patch("/api/properties/:id/featured", async (req, res) => {
    try {
      // 인증 및 권한 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
      }

      const propertyId = parseInt(req.params.id);
      const { featured } = req.body;

      if (!propertyId || typeof featured !== 'boolean') {
        return res.status(400).json({ message: "Property ID and featured state are required" });
      }

      const success = await storage.togglePropertyFeatured(propertyId, featured);

      if (!success) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.json({ message: "Property featured status updated successfully" });
    } catch (error) {
      console.error("Error updating property featured status:", error);
      res.status(500).json({ message: "Failed to update property featured status" });
    }
  });

  // 부동산 다중 삭제 API
  app.post("/api/properties/batch-delete", async (req, res) => {
    try {
      // 인증 및 권한 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
      }

      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "삭제할 매물 ID가 필요합니다." });
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            return await storage.deleteProperty(parseInt(id));
          } catch (err) {
            console.error(`매물 ID ${id} 삭제 중 오류:`, err);
            return false;
          }
        })
      );

      const successCount = results.filter(Boolean).length;

      // 캐시 삭제
      memoryCache.deleteByPrefix("properties_");

      res.status(200).json({
        message: `총 ${ids.length}개 중 ${successCount}개의 매물이 삭제되었습니다.`,
        successCount,
        totalCount: ids.length
      });
    } catch (error) {
      console.error("매물 일괄 삭제 중 오류:", error);
      res.status(500).json({ message: "매물 일괄 삭제 중 오류가 발생했습니다." });
    }
  });

  // 뉴스 다중 삭제 API
  app.post("/api/news/batch-delete", async (req, res) => {
    try {
      // 인증 및 권한 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
      }

      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "삭제할 뉴스 ID가 필요합니다." });
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            return await storage.deleteNews(parseInt(id));
          } catch (err) {
            console.error(`뉴스 ID ${id} 삭제 중 오류:`, err);
            return false;
          }
        })
      );

      const successCount = results.filter(Boolean).length;

      // 캐시 삭제
      memoryCache.deleteByPrefix("news_");

      res.status(200).json({
        message: `총 ${ids.length}개 중 ${successCount}개의 뉴스가 삭제되었습니다.`,
        successCount,
        totalCount: ids.length
      });
    } catch (error) {
      console.error("뉴스 일괄 삭제 중 오류:", error);
      res.status(500).json({ message: "뉴스 일괄 삭제 중 오류가 발생했습니다." });
    }
  });

  // 사용자 다중 삭제 API
  app.post("/api/users/batch-delete", async (req, res) => {
    try {
      // 인증 및 권한 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
      }

      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "삭제할 사용자 ID가 필요합니다." });
      }

      // 자기 자신은 삭제할 수 없도록 필터링
      const filteredIds = ids.filter(id => parseInt(id) !== user.id);

      if (filteredIds.length !== ids.length) {
        console.log("사용자가 자기 자신을 삭제하려고 시도했습니다.");
      }

      const results = await Promise.all(
        filteredIds.map(async (id) => {
          try {
            return await storage.deleteUser(parseInt(id));
          } catch (err) {
            console.error(`사용자 ID ${id} 삭제 중 오류:`, err);
            return false;
          }
        })
      );

      const successCount = results.filter(Boolean).length;

      res.status(200).json({
        message: `총 ${filteredIds.length}개 중 ${successCount}개의 사용자 계정이 삭제되었습니다.`,
        successCount,
        totalCount: filteredIds.length,
        skippedSelf: ids.length !== filteredIds.length
      });
    } catch (error) {
      console.error("사용자 일괄 삭제 중 오류:", error);
      res.status(500).json({ message: "사용자 일괄 삭제 중 오류가 발생했습니다." });
    }
  });

  // 통합 일괄 삭제 API 엔드포인트 (admin-page-new.tsx와 호환)
  app.post("/api/admin/batch-delete/:type", async (req, res) => {
    try {
      // 인증 및 관리자 권한 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자 권한이 필요합니다." });
      }

      const { type } = req.params;
      const { ids } = req.body;

      console.log(`일괄 삭제 API 호출: type=${type}, body=`, req.body);
      console.log(`ids 타입: ${typeof ids}, 배열여부: ${Array.isArray(ids)}, 값:`, ids);

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "유효한 ID 목록이 필요합니다." });
      }

      console.log(`일괄 삭제 처리 시작: ${type}, 삭제할 ID 개수: ${ids.length}, IDs:`, ids);

      let successCount = 0;

      switch (type) {
        case 'properties':
          for (const id of ids) {
            const result = await storage.deleteProperty(id);
            if (result) successCount++;
          }
          // 관련 캐시 삭제
          memoryCache.deleteByPrefix("properties_");
          break;

        case 'news':
          for (const id of ids) {
            const result = await storage.deleteNews(id);
            if (result) successCount++;
          }
          // 관련 캐시 삭제
          memoryCache.deleteByPrefix("news_");
          break;

        case 'users':
          // 자기 자신은 삭제할 수 없도록 필터링
          const filteredIds = ids.filter(id => id !== user.id);
          if (filteredIds.length !== ids.length) {
            console.log("사용자가 자기 자신을 삭제하려고 시도했습니다.");
          }

          for (const id of filteredIds) {
            // 관리자 계정은 제외
            const userToDelete = await storage.getUser(id);
            if (userToDelete && userToDelete.role !== 'admin') {
              const result = await storage.deleteUser(id);
              if (result) successCount++;
            }
          }
          break;

        default:
          return res.status(400).json({ message: "지원되지 않는 유형입니다." });
      }

      res.json({
        success: true,
        message: `${successCount}개의 항목이 삭제되었습니다.`,
        deletedCount: successCount,
        skippedSelf: type === 'users' && ids.includes(user.id)
      });
    } catch (error) {
      console.error('일괄 삭제 오류:', error);
      res.status(500).json({ message: "일괄 삭제 중 오류가 발생했습니다." });
    }
  });

  // 블로그 포스트 관련 API 제거됨

  // 구글 스프레드시트 중복 매물 확인 API
  app.post("/api/admin/check-sheet-duplicates", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
      }

      const { spreadsheetId, ranges, filterDate } = req.body;
      const apiKey = process.env.GOOGLE_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ success: false, error: "서버에 Google API 키가 설정되지 않았습니다." });
      }

      if (!spreadsheetId || !filterDate) {
        return res.status(400).json({ success: false, error: "스프레드시트 ID와 날짜는 필수입니다." });
      }

      const sheetRanges = ranges || ["토지!A2:BA", "주택!A2:BA", "아파트외!A2:BA", "상가외!A2:BA"];
      let allDuplicates: { rowIndex: number; address: string; existingPropertyId: number; existingPropertyTitle: string; sheetName: string }[] = [];

      for (const range of sheetRanges) {
        try {
          const result = await checkDuplicatesFromSheet(spreadsheetId, apiKey, range, filterDate);
          if (result.success && result.duplicates) {
            const sheetName = range.split('!')[0];
            allDuplicates = [...allDuplicates, ...result.duplicates.map(d => ({ ...d, sheetName }))];
          }
        } catch (sheetError) {
          log(`시트 ${range} 중복 확인 중 오류 (무시됨): ${sheetError}`, 'warn');
        }
      }

      res.json({ success: true, duplicates: allDuplicates });
    } catch (error) {
      console.error("중복 확인 오류:", error);
      res.status(500).json({ success: false, error: "중복 확인 중 오류가 발생했습니다." });
    }
  });

  // 구글 스프레드시트에서 부동산 데이터 가져오기 API

  app.post("/api/admin/import-from-sheet", async (req, res) => {
    try {
      // 인증 및 권한 확인
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
      }

      const { spreadsheetId, ranges, filterDate, skipAddresses } = req.body;

      // 서버에 저장된 Google API 키 사용
      const apiKey = process.env.GOOGLE_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ success: false, error: "서버에 Google API 키가 설정되지 않았습니다." });
      }

      if (!spreadsheetId) {
        return res.status(400).json({ message: "스프레드시트 ID는 필수입니다." });
      }

      // 날짜 필터 필수 검증
      if (!filterDate) {
        return res.status(400).json({ success: false, error: "날짜를 반드시 선택해주세요." });
      }

      log(`데이터 가져오기 시작: 스프레드시트=${spreadsheetId}, 날짜필터=${filterDate}, 건너뛸 주소: ${skipAddresses?.length || 0}개`, 'info');
      log(`전달받은 ranges 파라미터: ${JSON.stringify(ranges)}`, 'info');

      // 여러 시트에서 데이터 가져오기 (한글 시트 이름 사용)
      const sheetRanges = ranges || ["토지!A2:BA", "주택!A2:BA", "아파트외!A2:BA", "상가외!A2:BA"];
      log(`처리할 시트 목록: ${JSON.stringify(sheetRanges)}`, 'info');
      let totalCount = 0;
      let allImportedIds: number[] = [];
      let allErrors: string[] = [];
      const addressesToSkip: string[] = skipAddresses || [];

      for (const range of sheetRanges) {
        try {
          log(`시트 처리 시작: ${range}`, 'info');
          const result = await importPropertiesFromSheet(spreadsheetId, apiKey, range, filterDate, addressesToSkip);
          log(`시트 처리 완료: ${range}, 성공=${result.success}, 개수=${result.count || 0}`, 'info');
          if (result.success && result.count) {
            totalCount += result.count;
            if (result.importedIds) {
              allImportedIds = [...allImportedIds, ...result.importedIds];
            }
          }
          if (result.error) {
            log(`시트 오류 발생: ${range}: ${result.error}`, 'warn');
            allErrors.push(`${range}: ${result.error}`);
          }
        } catch (sheetError: any) {
          // 시트가 없거나 빈 경우 오류 무시하고 계속
          const errorMessage = sheetError?.message || String(sheetError);
          log(`시트 ${range} 처리 중 예외 발생: ${errorMessage}`, 'error');
          allErrors.push(`${range}: ${errorMessage}`);
        }
      }

      res.json({
        success: true,
        count: totalCount,
        importedIds: allImportedIds,
        error: allErrors.length > 0 ? allErrors.join('; ') : undefined
      });
    } catch (error) {
      console.error("스프레드시트 데이터 가져오기 오류:", error);
      res.status(500).json({ success: false, error: "데이터 가져오기 중 오류가 발생했습니다." });
    }
  });

  // 뉴스 자동 업데이트 스케줄러 실행 (사용자 요청에 따라 활성화)
  setupNewsScheduler();

  const httpServer = createServer(app);
  return httpServer;
}