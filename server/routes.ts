import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { db } from "./db";
import multer from "multer";
import fs from "fs";
import path from "path";
import express from "express";
import Jimp from "jimp";
import {
  insertInquirySchema,
  insertPropertySchema,
  insertNewsSchema,
  insertPropertyInquirySchema,
  insertFavoriteSchema,
  insertBannerSchema,
  insertNoticeSchema,
  insertNewsletterSubscriptionSchema,
  insertPostSchema,
  insertPostCommentSchema
} from "@shared/schema";
import { memoryCache } from "./cache";
import { setupAuth } from "./auth";
import { fetchAndSaveNews, setupNewsScheduler } from "./news-fetcher";
import { sendEmail, createInquiryEmailTemplate } from "./mailer";
import { getRecentTransactions } from "./real-estate-api";
// import { testRealEstateAPI } from "./test-api";
import { getLatestBlogPosts } from "./blog-fetcher";
import { getLatestYouTubeVideos, getChannelIdByHandle, fetchYouTubeShorts, fetchLatestYouTubeVideosWithAPI } from "./youtube-fetcher";
import { importPropertiesFromSheet, checkDuplicatesFromSheet } from "./sheet-importer";
import { naverCrawler } from "./services/naver-crawler";
import { log } from "./vite";

// 사이트 설정 (필요시 환경변수나 설정 파일로 이동 가능)
const siteConfig = {
  siteName: "이가이버 부동산",
  siteDescription: "강화도 부동산 중개 서비스",
  siteContactEmail: "contact@ganghwaestate.com"
};

/**
 * 상세주소 마스킹 처리 함수
 * '동/리/가' 이후의 지번, 번지, 동호수 등 모든 상세 부분을 ***로 치환
 */
function maskAddress(address: string | null | undefined): string {
  if (!address) return "";

  const trimmedAddress = address.trim();

  // 강화군 주소 패턴 매팅 (읍/면/동/리 기준)
  // 예: "인천광역시 강화군 강화읍 관청리 123-4" -> "인천광역시 강화군 강화읍 관청리 ***"
  const patterns = [
    /(.*?[동리가])\s+\d+.*/,        // "관청리 123-4" -> "$1 ***"
    /(.*?[동리가])\s+산\s*\d+.*/,   // "신당리 산 12-3" -> "$1 ***"
    /(.*?[동리가])\s+[가-힣]+\d+.*/, // "온수리 현대아파트 101동" -> "$1 ***"
    /^(\d+[-]?\d*)$/,               // "925-10" (지번만 있는 경우) -> "***"
    /^\d+번지$/                      // "123번지" -> "***"
  ];

  for (const pattern of patterns) {
    if (pattern.test(trimmedAddress)) {
      if (pattern.source.includes('동리가')) {
        return trimmedAddress.replace(pattern, "$1 ***");
      }
      return "***";
    }
  }

  // 패턴에 맞지 않는 경우 공백 기준으로 마지막 단어 마스킹 (기존 로직 보강)
  const parts = trimmedAddress.split(/\s+/);
  if (parts.length >= 1) {
    const lastPart = parts[parts.length - 1];
    // 숫자가 포함되어 있거나 읍/면/동/리가 아니면 마스킹
    if (/\d/.test(lastPart) || (parts.length > 1 && !/[동리가]$/.test(lastPart))) {
      parts[parts.length - 1] = "***";
      return parts.join(" ");
    }
  }

  return trimmedAddress;
}

/**
 * 매물 객체에서 민감 정보를 제거하거나 마스킹하는 헬퍼 핸들러
 * - 토지/단독 유형: 지번 주소 마스킹 (토지/주택은 주소가 곧 개인정보)
 * - 그 외 유형: 지번 주소 노출 (아파트/다세대 등은 주소 공개해도 무방)
 */
function getSafeProperty(property: any, isAuthorized: boolean) {
  if (isAuthorized) return property;

  const {
    unitNumber, // 동호수 (노출금지)
    ownerName, ownerPhone, // 소유자 정보 (노출금지)
    tenantName, tenantPhone, // 임차인 정보 (노출금지)
    clientName, clientPhone, // 의뢰인 정보 (노출금지)
    privateNote, // 비공개 메모 (노출금지)
    realtorInfo, // 중개사 정보 (보존)
    // latitude, longitude는 지도 표시를 위해 통과시킴
    ...safeProperty
  } = property;

  // 토지/단독 유형만 주소 마스킹 (토지와 단독주택은 주소가 곧 개인 위치정보)
  const propertyType = (safeProperty.type || "").trim();
  const shouldMaskAddress = propertyType === "토지" || propertyType === "단독";

  if (safeProperty.address) {
    // 지도 핀 위치용으로 원본 주소를 별도 필드에 보존 (지오코딩용)
    safeProperty.mapAddress = safeProperty.address;

    if (shouldMaskAddress) {
      safeProperty.address = maskAddress(safeProperty.address);
    }
    // 토지/단독이 아닌 경우 주소를 그대로 노출
  }

  // 중개사 정보가 있으면 다시 붙여줌
  if (realtorInfo) {
    (safeProperty as any).realtorInfo = realtorInfo;
  }

  // 건물명도 토지/단독만 마스킹
  if (shouldMaskAddress && safeProperty.buildingName) {
    safeProperty.buildingName = "***";
  }

  return safeProperty;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Global request logger for debugging
  app.use((req, res, next) => {
    console.log(`[REQ] ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
    next();
  });

  // Ensure uploads directory exists
  const uploadDir = path.join(process.cwd(), "public/uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Serve the uploads directory at /uploads path
  app.use('/uploads', express.static(uploadDir));

  const uploadStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // 한글 파일명 깨짐 방지를 위해 safe-name 처리 또는 timestamp 사용
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  });

  const upload = multer({
    storage: uploadStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB 제한
  });

  // 인증 시스템 설정
  setupAuth(app);

  // ─────────────────────────────────────────────
  // 프로필 이미지 업로드 API
  // POST /api/upload/profile  → { url: '/uploads/filename.jpg' }
  // ─────────────────────────────────────────────
  app.post('/api/upload/profile', (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.status(403).json({ error: '관리자만 이용 가능합니다.' });
    }
    next();
  }, upload.single('photo'), (req: any, res: any) => {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

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
        ? "http://1.234.53.82"
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

  /*
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
  */

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

  // Search Properties
  app.get("/api/search", async (req, res) => {
    try {
      const { keyword, district: districtQuery, type: typeQuery, dealType, minPrice, maxPrice, tag, includeCrawled, onlyCrawled } = req.query as any;
      const sortBy = (req.query.sortBy as string) || 'latest';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      console.log("검색 요청 수신:", { keyword, district: districtQuery, type: typeQuery, dealType, minPrice, maxPrice, tag, includeCrawled, onlyCrawled, sortBy, page, limit });

      // 1. 키워드 분석 및 지능형 필터링 (지역/유형 자동 감지)
      let searchKeyword = "";
      let detectedDistrict = districtQuery !== 'all' ? districtQuery : null;
      let detectedType = typeQuery !== 'all' ? typeQuery : null;

      if (keyword && typeof keyword === 'string' && keyword.trim() !== '') {
        const term = keyword.toLowerCase().trim();
        const tokens = term.split(/\s+/);

        // 지역명 목록
        const districtNames = ["강화읍", "교동면", "길상면", "내가면", "불은면", "삼산면", "서도면", "선원면", "송해면", "양도면", "양사면", "하점면", "화도면"];

        // 유형 매핑 데이터
        const typeMapping: Record<string, string> = {
          "단독": "주택", "전원": "주택", "농가": "주택",
          "빌라": "아파트연립다세대", "아파트": "아파트연립다세대", "연립": "아파트연립다세대", "다세대": "아파트연립다세대",
          "상가": "상가공장창고펜션", "공장": "상가공장창고펜션", "창고": "상가공장창고펜션", "펜션": "상가공장창고펜션",
          "토지": "토지", "원룸": "원투룸", "투룸": "원투룸", "오피스텔": "상가공장창고펜션"
        };

        const filteredTokens = tokens.filter(token => {
          const foundDistrict = districtNames.find(d => token.includes(d));
          if (foundDistrict && !detectedDistrict) {
            detectedDistrict = foundDistrict;
            return false;
          }
          for (const [key, targetType] of Object.entries(typeMapping)) {
            if (token.includes(key) && !detectedType) {
              detectedType = targetType;
              return true;
            }
          }
          return true;
        });
        searchKeyword = filteredTokens.join(" ");
      }

      const finalDistrict = detectedDistrict || districtQuery;
      const finalType = detectedType || typeQuery;

      const typeMap: Record<string, string[]> = {
        '토지': ['토지'],
        '전체건물': ['단독', '근린', '아파트', '다세대', '연립', '원투룸', '다가구', '오피스텔', '기타', '주택', '상가공장창고펜션', '아파트연립다세대'],
        '주택': ['단독', '아파트', '다세대', '연립', '다가구', '주택'],
        '아파트연립다세대': ['아파트', '다세대', '연립', '아파트연립다세대'],
        '원투룸': ['원룸', '투룸', '원투룸', '다가구'],
        '상가공장창고펜션': ['근린', '오피스텔', '상가공장창고펜션', '상가', '공장', '창고', '펜션'],
        '기타': ['기타']
      };
      const allowedTypes = finalType && finalType !== 'all' ? (typeMap[finalType] || [finalType]) : null;

      // 2. Fetch data using SQL push-down (서버 속도 최적화 1단계)
      let internalProps: any[] = [];
      if (onlyCrawled !== 'true') {
        internalProps = await storage.searchInternalProperties({
          isVisible: true,
          district: finalDistrict && finalDistrict !== 'all' ? finalDistrict : null,
          type: allowedTypes
        });
      }

      let naverProps: any[] = [];
      if (includeCrawled === 'true' || onlyCrawled === 'true') {
        naverProps = await storage.searchCrawledProperties({
          district: finalDistrict && finalDistrict !== 'all' ? finalDistrict : null,
          type: allowedTypes
        });
      }

      // Robust numeric conversion helper (handles commas, nulls, non-numeric strings)
      const toNum = (val: any) => {
        if (val === null || val === undefined || val === '') return 0;
        if (typeof val === 'number') return val;
        // Strip everything except digits and decimal points (handles commas like 135,000)
        const cleaned = String(val).replace(/[^0-9.]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };

      // Filter and Map internal properties
      const mappedInternal = internalProps
        .filter(p => p.isVisible)
        .filter(p => {
          if (finalDistrict && finalDistrict !== 'all' && !(p.district || "").includes(finalDistrict)) return false;
          if (allowedTypes && !allowedTypes.includes(p.type)) return false;
          if (dealType && dealType !== 'all') {
            const types = Array.isArray(p.dealType) ? p.dealType : [p.dealType];
            if (!types.includes(dealType)) return false;
          }
          if (minPrice || maxPrice) {
            const min = minPrice ? Number(minPrice) : 0;
            const max = maxPrice ? Number(maxPrice) : Infinity;

            const pPrice = toNum(p.price);
            const pDeposit = toNum(p.deposit);
            const pDepositAmount = toNum(p.depositAmount);

            // If dealType is specified, check the specific field
            let val = 0;
            if (dealType === '매매') val = pPrice;
            else if (dealType === '전세') val = pDeposit;
            else if (dealType === '월세') val = pDepositAmount;
            else {
              // If dealType is 'all' or not specified, use the maximum of all price fields
              val = Math.max(pPrice, pDeposit, pDepositAmount);
            }

            // Internal data check (if in 10,000 won units)
            const targetPrice = (val > 0 && val < 1000000) ? val * 10000 : val;
            if (targetPrice < min || targetPrice > max) return false;
          }
          if (searchKeyword) {
            const k = searchKeyword.toLowerCase();
            return p.title.toLowerCase().includes(k) ||
              (p.description && p.description.toLowerCase().includes(k)) ||
              (p.address && p.address.toLowerCase().includes(k));
          }
          return true;
        })
        .map(p => ({
          ...p,
          // Standardize internal units to absolute KRW (multiply 만원 by 10,000)
          price: (toNum(p.price) > 0 && toNum(p.price) < 1000000) ? String(toNum(p.price) * 10000) : String(p.price),
          deposit: (toNum(p.deposit) > 0 && toNum(p.deposit) < 1000000) ? String(toNum(p.deposit) * 10000) : String(p.deposit),
          depositAmount: (toNum(p.depositAmount) > 0 && toNum(p.depositAmount) < 1000000) ? String(toNum(p.depositAmount) * 10000) : String(p.depositAmount),
          monthlyRent: (toNum(p.monthlyRent) > 0 && toNum(p.monthlyRent) < 1000000) ? String(toNum(p.monthlyRent) * 10000) : String(p.monthlyRent),
          source: 'internal'
        }));

      // Filter and Map naver properties
      const mappedNaver = naverProps
        .filter(p => {
          // If a district is selected, check if it's mentioned in the title (e.g. "선원면")
          if (finalDistrict && finalDistrict !== 'all') {
            const dMatch = p.atclNm?.includes(finalDistrict) || p.flrInfo?.includes(finalDistrict);
            if (!dMatch) return false;
          }

          // Inclusive type matching for Naver properties
          if (allowedTypes) {
            const matchesType = allowedTypes.some(type => p.rletTpNm && p.rletTpNm.includes(type));
            if (!matchesType) return false;
          }

          if (dealType && dealType !== 'all' && p.tradTpNm !== dealType) return false;
          if (minPrice || maxPrice) {
            const min = minPrice ? Number(minPrice) : 0;
            const max = maxPrice ? Number(maxPrice) : Infinity;

            // Naver data is in 만원 units.
            const price = toNum(p.prc) * 10000;
            if (price < min || price > max) return false;
          }
          if (searchKeyword) {
            const k = searchKeyword.toLowerCase();
            return p.atclNm.toLowerCase().includes(k);
          }
          return true;
        })
        .map(p => ({
          ...p,
          id: Number(p.atclNo),
          title: p.atclNm,
          description: `[네이버 매물] ${p.rletTpNm} - ${p.tradTpNm}`,
          type: p.rletTpNm,
          price: String(toNum(p.prc) * 10000),
          deposit: p.tradTpNm === '전세' ? String(toNum(p.prc) * 10000) : "0",
          depositAmount: p.tradTpNm === '월세' ? String(toNum(p.prc) * 10000) : "0",
          monthlyRent: p.rentPrc ? String(toNum(p.rentPrc) * 10000) : "0",
          size: p.spc1,
          latitude: p.lat,
          longitude: p.lng,
          imageUrls: p.imgUrl ? [p.imgUrl] : [],
          dealType: [p.tradTpNm],
          source: 'naver',
          direction: p.direction,
          rltrNm: p.rltrNm,
          isVisible: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          isUrgent: false,
          isNegotiable: false,
          isLongTerm: false,
          featured: false
        }));

      // Combine and filter
      let combined: any[] = [...mappedInternal];
      if (includeCrawled === 'true' || onlyCrawled === 'true') {
        combined = [...combined, ...mappedNaver];
      }

      // 관리자 여부 확인
      let isAdmin = false;
      if (req.isAuthenticated()) {
        const user = req.user as Express.User;
        isAdmin = user.role === "admin";
      }

      // Apply masking to all combined properties
      const user = req.user as any;
      combined = combined.map(p => {
        // 소유자 권한: 관리자이거나, 해당 매물을 등록한 중개사(agentId)이거나 소유자(ownerId)인 경우
        const isAuthorized = isAdmin || (user?.id && (p.ownerId === user.id || p.agentId === user.id));
        return getSafeProperty(p, isAuthorized);
      });

      // 6. 정렬 로직 및 우선순위 적용
      // sortBy에 따라 값이 0인 데이터는 아예 리스트에서 배제 (사용자 요청)
      if (sortBy && sortBy !== 'latest') {
        combined = combined.filter(p => {
          let val = 0;
          switch (sortBy) {
            case 'priceLow':
            case 'priceHigh':
              val = toNum(p.price);
              break;
            case 'depositLow':
            case 'depositHigh':
              val = toNum(p.deposit) + toNum(p.depositAmount);
              break;
            case 'monthlyLow':
            case 'monthlyHigh':
              val = toNum(p.monthlyRent);
              break;
            case 'areaHigh':
              val = toNum(p.size);
              break;
            default:
              return true;
          }
          return val > 0;
        });
      }
      // sortBy는 상단에서 이미 선언됨

      const getPriority = (p: any) => (p.source === 'naver' ? 1 : 0);

      // Common compare helper for all sorts to handle deterministic tie-breaking
      const compare = (a: any, b: any, primaryResult: number) => {
        if (primaryResult !== 0) return primaryResult;

        // Priority tie-breaker: Internal > Naver
        const priorityA = (a.source === 'naver' ? 1 : 0);
        const priorityB = (b.source === 'naver' ? 1 : 0);
        if (priorityA !== priorityB) return priorityA - priorityB;

        // Decency tie-breaker: Latest first
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        if (dateA !== dateB) return dateB - dateA;

        // Final tie-breaker: ID descending
        const idA = toNum(a.id);
        const idB = toNum(b.id);
        return idB - idA;
      };

      // Helper to handle ASC sorts where 0 should be at the bottom
      const ascSort = (a: any, b: any, valA: any, valB: any) => {
        const vA = toNum(valA);
        const vB = toNum(valB);

        let primary = 0;
        // If one is 0 and other isn't, push 0 to bottom
        if (vA === 0 && vB !== 0) primary = 1;
        else if (vA !== 0 && vB === 0) primary = -1;
        else if (vA !== vB) primary = vA - vB;

        return compare(a, b, primary);
      };

      // Helper for DESC sorts
      const descSort = (a: any, b: any, valA: any, valB: any) => {
        const vA = toNum(valA);
        const vB = toNum(valB);
        const primary = (vA !== vB) ? vB - vA : 0;
        return compare(a, b, primary);
      };

      switch (sortBy) {
        case 'type':
          combined.sort((a, b) => {
            const result = (a.type || '').localeCompare(b.type || '', 'ko');
            return compare(a, b, result);
          });
          break;
        case 'district':
          combined.sort((a, b) => {
            const result = (a.district || '').localeCompare(b.district || '', 'ko');
            return compare(a, b, result);
          });
          break;
        case 'dealType':
          combined.sort((a, b) => {
            const dtA = Array.isArray(a.dealType) ? a.dealType[0] : (a.dealType || '');
            const dtB = Array.isArray(b.dealType) ? b.dealType[0] : (b.dealType || '');
            const result = dtA.localeCompare(dtB, 'ko');
            return compare(a, b, result);
          });
          break;
        case 'priceLow':
          combined.sort((a, b) => ascSort(a, b, a.price, b.price));
          break;
        case 'priceHigh':
          combined.sort((a, b) => descSort(a, b, a.price, b.price));
          break;
        case 'depositLow':
          combined.sort((a, b) => {
            const vA = toNum(a.deposit) + toNum(a.depositAmount);
            const vB = toNum(b.deposit) + toNum(b.depositAmount);
            return ascSort(a, b, vA, vB);
          });
          break;
        case 'depositHigh':
          combined.sort((a, b) => {
            const vA = toNum(a.deposit) + toNum(a.depositAmount);
            const vB = toNum(b.deposit) + toNum(b.depositAmount);
            return descSort(a, b, vA, vB);
          });
          break;
        case 'monthlyHigh':
          combined.sort((a, b) => descSort(a, b, a.monthlyRent, b.monthlyRent));
          break;
        case 'monthlyLow':
          combined.sort((a, b) => ascSort(a, b, a.monthlyRent, b.monthlyRent));
          break;
        case 'areaHigh':
          combined.sort((a, b) => {
            const vA = toNum(a.size);
            const vB = toNum(b.size);
            const result = (vA !== vB) ? vB - vA : 0;
            return compare(a, b, result);
          });
          break;
        case 'latest':
        default:
          combined.sort((a, b) => compare(a, b, 0));
          break;
      }

      // 7. 페이징 처리
      // limit, page는 상단에서 이미 선언됨
      const totalCount = combined.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const pagedProperties = combined.slice(startIndex, startIndex + limit);

      res.json({
        properties: pagedProperties,
        total: totalCount,
        totalPages,
        currentPage: page
      });

    } catch (error) {
      console.error("검색 오류:", error);
      res.status(500).json({ message: "검색 중 오류가 발생했습니다." });
    }
  });

  // Properties
  app.get("/api/properties", async (req, res) => {
    try {
      // 관리자 여부 확인
      let isAdmin = false;
      if (req.isAuthenticated()) {
        const user = req.user as Express.User;
        isAdmin = user.role === "admin";
      }

      // 캐시 확인 여부를 쿼리 파라미터로 제어
      const skipCache = req.query.skipCache === 'true';

      if (!skipCache) {
        // 캐시에서 먼저 확인
        const cacheKey = isAdmin ? "properties_all_admin" : "properties_all_user";
        const cachedProperties = memoryCache.get(cacheKey);

        if (cachedProperties) {
          return res.json(cachedProperties);
        }
      }

      // 캐시에 없거나 캐시 스킵 요청이면 DB에서 조회
      const properties = await storage.getProperties();

      // 보안 필터링 적용
      const user = req.user as any;
      const safeProperties = properties.map(p => {
        const isAuthorized = isAdmin || (user?.id && p.ownerId === user.id);
        return getSafeProperty(p, isAuthorized);
      });

      // 캐시 스킵이 아닐 경우에만 캐시 저장
      if (!skipCache) {
        // 관리자용과 일반 사용자용 캐시 분리
        const cacheKey = isAdmin ? "properties_all_admin" : "properties_all_user";
        memoryCache.set(cacheKey, safeProperties, 1 * 60 * 1000);
      }

      res.json(safeProperties);
    } catch (error) {
      console.error("Properties fetch error:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Import Crawled Property to Internal Properties (One-click Import)
  app.post("/api/properties/import-crawled", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "관리자 전용 기능입니다." });
      }

      const { atclNos } = req.body;
      if (!Array.isArray(atclNos) || atclNos.length === 0) {
        return res.status(400).json({ message: "가져올 매물 번호가 없습니다." });
      }

      const results = {
        success: 0,
        skipped: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const atclNo of atclNos) {
        try {
          // 1. 이미 가져온 매물인지 확인
          const existing = await storage.getPropertyByAtclNo(String(atclNo));
          if (existing) {
            results.skipped++;
            continue;
          }

          // 2. 수집된 매물 데이터 조회
          const crawled = await storage.getCrawledProperty(String(atclNo));
          if (!crawled) {
            results.failed++;
            results.errors.push(`매물번호 ${atclNo}를 찾을 수 없습니다.`);
            continue;
          }

          // 3. 데이터 변환 (CrawledProperty -> InsertProperty)
          // Naver 유형 -> 이가이버 유형 매핑
          const typeMap: Record<string, string> = {
            '토지': '토지',
            '단독': '단독',
            '전원주택': '단독',
            '농가주택': '단독',
            '아파트': '아파트',
            '빌라': '다세대',
            '상가': '근린',
            '공장': '기타',
            '사무실': '근린'
          };
          const propertyType = typeMap[crawled.rletTpNm] || '기타';

          // 지역명 추출 (flrInfo에 읍/면/리 정보가 포함된 경우가 많음)
          // 예: "강화군 양도면 능내리"
          let district = "기타지역";
          if (crawled.flrInfo) {
            const match = crawled.flrInfo.match(/([가-힣]+(?:읍|면))\s+([가-힣]+리)/);
            if (match) {
              district = `${match[1]} ${match[2]}`;
            } else if (crawled.flrInfo.includes("강화읍")) {
              district = "강화읍"; // 기본값
            }
          }

          const insertData: any = {
            title: crawled.atclNm,
            description: `[네이버 확인매물] ${crawled.tradTpNm} ${crawled.atclNm}\n\n${crawled.flrInfo || ""}\n중개사: ${crawled.rltrNm || "정보없음"}`,
            type: propertyType,
            price: crawled.tradTpNm === '매매' ? String(Number(crawled.prc) * 10000) : "0",
            address: crawled.flrInfo || "",
            district: district,
            size: crawled.spc2 || crawled.spc1 || "0",
            bedrooms: 0,
            bathrooms: 0,
            imageUrl: crawled.imgUrl || "",
            imageUrls: crawled.imgUrl ? [crawled.imgUrl] : [],
            agentId: (req.user as any).id, // 현재 로그인한 관리자 ID
            featured: false,
            isVisible: true,
            dealType: [crawled.tradTpNm],
            deposit: crawled.tradTpNm === '전세' ? String(Number(crawled.prc) * 10000) : "0",
            depositAmount: crawled.tradTpNm === '월세' ? String(Number(crawled.prc) * 10000) : "0",
            monthlyRent: crawled.rentPrc ? String(Number(crawled.rentPrc) * 10000) : "0",
            source: 'naver',
            atclNo: String(atclNo),
            latitude: crawled.lat,
            longitude: crawled.lng,
            agentName: crawled.rltrNm || "네이버 수집",
            ownerId: (req.user as any).id
          };

          // 4. 저장
          await storage.createProperty(insertData);
          results.success++;

        } catch (err: any) {
          console.error(`Import error for ${atclNo}:`, err);
          results.failed++;
          results.errors.push(`${atclNo}: ${err.message}`);
        }
      }

      // 캐시 삭제
      memoryCache.delete("properties_all_admin");
      memoryCache.delete("properties_all_user");

      res.json({
        message: "가져오기 처리가 완료되었습니다.",
        ...results
      });

    } catch (error) {
      console.error("Import Crawled error:", error);
      res.status(500).json({ message: "가져오기 중 서버 오류가 발생했습니다." });
    }
  });

  // Integrated Properties (Internal + Crawled)
  app.get("/api/properties/integrated", async (req, res) => {
    try {
      const includeCrawled = req.query.includeCrawled === 'true';

      const internalPropsAction = storage.getProperties();
      const crawledPropsAction = includeCrawled ? storage.getCrawledProperties() : Promise.resolve([]);

      const [internalProps, crawledProps] = await Promise.all([
        internalPropsAction,
        crawledPropsAction
      ]);

      const integrated = [
        ...internalProps.map(p => ({ ...p, source: 'internal' })),
        ...crawledProps.map(p => ({
          id: `naver-${p.atclNo}`, // Unique ID for frontend key
          atclNo: p.atclNo, // Keep original ID for reference
          title: p.atclNm,
          type: p.rletTpNm,
          price: p.tradTpNm === '매매' ? Number(p.prc) * 10000 : 0,
          deposit: p.tradTpNm === '전세' ? Number(p.prc) * 10000 : 0,
          depositAmount: p.tradTpNm === '월세' ? Number(p.prc) * 10000 : 0,
          monthlyRent: p.rentPrc ? Number(p.rentPrc) * 10000 : 0,
          // Essential map fields only
          latitude: p.lat,
          longitude: p.lng,
          dealType: p.tradTpNm ? [p.tradTpNm] : [],
          source: 'naver',
          // Omit detailed fields for list to keep homepage fast
          address: ``,
          district: '수집매물',
          size: '',
          imageUrls: [],
          direction: '',
          rltrNm: '',
          ownerId: null
        }))
      ];

      const user = req.user as any;
      const isAdmin = user && user.role === "admin";
      const safeIntegrated = integrated.map(p => {
        const isAuthorized = isAdmin || (user?.id && p.ownerId === user.id);
        return getSafeProperty(p, isAuthorized);
      });

      console.log(`[API] Integrated fetch: ${safeIntegrated.length} items (Internal: ${internalProps.length}, Crawled: ${crawledProps.length})`);
      res.json(safeIntegrated);
    } catch (error) {
      console.error("Integrated fetch failed:", error);
      res.status(500).json({ message: "Failed to fetch integrated properties" });
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
      const isAdmin = user.role === "admin";
      const isRealtor = user.role === "realtor";

      if (!isAdmin && !isRealtor) {
        return res.status(403).json({ message: "접근 권한이 없습니다." });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filterType = req.query.type as string;
      const filterDistrict = req.query.district as string;
      const filterDealType = req.query.dealType as string;
      const filterAgent = req.query.agent as string;

      let properties: any[] = [];
      if (isAdmin) {
        properties = await storage.getAllProperties();
      } else {
        // Realtor: Only their own properties
        properties = await storage.getPropertiesByOwner(user.id);
      }

      // 백엔드 필터링 적용
      let filteredProperties = properties;

      if (filterType && filterType !== 'all') {
        filteredProperties = filteredProperties.filter(p => p.type === filterType);
      }

      if (filterDistrict && filterDistrict !== 'all') {
        filteredProperties = filteredProperties.filter(p => p.district === filterDistrict);
      }

      if (filterDealType && filterDealType !== 'all') {
        filteredProperties = filteredProperties.filter(p => {
          if (!p.dealType) return false;
          const dealTypesArray = Array.isArray(p.dealType) ? p.dealType : [String(p.dealType)];
          return dealTypesArray.some((t: string) => t.includes(filterDealType));
        });
      }

      if (filterAgent && filterAgent !== 'all') {
        filteredProperties = filteredProperties.filter(p => p.agentName === filterAgent);
      }

      const total = filteredProperties.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      // 페이징 처리된 매물 (Drag & Drop 순서 변경 기준이 displayOrder이므로 정렬 유지)
      const sortedProperties = filteredProperties.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      const paginatedProperties = sortedProperties.slice(offset, offset + limit);

      res.json({
        properties: paginatedProperties,
        total,
        totalPages,
        currentPage: page
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all properties" });
    }
  });

  app.get("/api/properties/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const properties = await storage.getFeaturedProperties(limit);

      const user = req.user as any;
      const isAdmin = user && user.role === "admin";
      const safeProperties = properties.map(p => {
        const isAuthorized = isAdmin || (user?.id && p.ownerId === user.id);
        return getSafeProperty(p, isAuthorized);
      });

      console.log(`추천 매물 ${safeProperties.length}개 조회됨`);
      res.json(safeProperties);
    } catch (error) {
      console.error("Error fetching featured properties:", error);
      res.status(500).json({ message: "Failed to fetch featured properties" });
    }
  });

  app.get("/api/properties/urgent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const properties = await storage.getUrgentProperties(limit);

      let isAdmin = false;
      const user = req.user as any;
      if (req.isAuthenticated()) isAdmin = user.role === "admin";

      res.json(properties.map(p => {
        const isAuthorized = isAdmin || (user?.id && p.ownerId === user.id);
        return getSafeProperty(p, isAuthorized);
      }));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch urgent properties" });
    }
  });

  app.get("/api/properties/latest", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const properties = await storage.getLatestProperties(limit);

      let isAdmin = false;
      const user = req.user as any;
      if (req.isAuthenticated()) isAdmin = user.role === "admin";

      res.json(properties.map(p => {
        const isAuthorized = isAdmin || (user?.id && p.ownerId === user.id);
        return getSafeProperty(p, isAuthorized);
      }));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest properties" });
    }
  });

  app.get("/api/properties/negotiable", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const properties = await storage.getNegotiableProperties(limit);

      let isAdmin = false;
      const user = req.user as any;
      if (req.isAuthenticated()) isAdmin = user.role === "admin";

      res.json(properties.map(p => {
        const isAuthorized = isAdmin || (user?.id && p.ownerId === user.id);
        return getSafeProperty(p, isAuthorized);
      }));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch negotiable properties" });
    }
  });

  app.get("/api/properties/long-term", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const properties = await storage.getLongTermProperties(limit);

      let isAdmin = false;
      const user = req.user as any;
      if (req.isAuthenticated()) isAdmin = user.role === "admin";

      res.json(properties.map(p => {
        const isAuthorized = isAdmin || (user?.id && p.ownerId === user.id);
        return getSafeProperty(p, isAuthorized);
      }));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch long-term properties" });
    }
  });

  // Toggle Property Status (Urgent, Negotiable, Long-term)
  app.patch("/api/properties/:id/urgent", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { isUrgent } = req.body;
      await storage.togglePropertyUrgent(id, isUrgent);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle urgent status" });
    }
  });

  app.patch("/api/properties/:id/negotiable", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { isNegotiable } = req.body;
      await storage.togglePropertyNegotiable(id, isNegotiable);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle negotiable status" });
    }
  });

  app.patch("/api/properties/:id/long-term", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { isLongTerm } = req.body;
      await storage.togglePropertyLongTerm(id, isLongTerm);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle long-term status" });
    }
  });

  // Reorder Properties
  app.put("/api/properties/urgent/order", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const { items } = req.body; // Array of { id, order }
      for (const item of items) {
        await storage.updatePropertyUrgentOrder(item.id, item.order);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update urgent order" });
    }
  });

  app.put("/api/properties/negotiable/order", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const { items } = req.body;
      for (const item of items) {
        await storage.updatePropertyNegotiableOrder(item.id, item.order);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update negotiable order" });
    }
  });

  app.put("/api/properties/long-term/order", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const { items } = req.body;
      for (const item of items) {
        await storage.updatePropertyLongTermOrder(item.id, item.order);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update long-term order" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const idParam = req.params.id;

      // Check for Naver Property ID
      if (idParam.startsWith('naver-')) {
        const atclNo = idParam.replace('naver-', '');
        const crawledProp = await storage.getCrawledProperty(atclNo);

        if (!crawledProp) {
          return res.status(404).json({ message: "Crawled property not found" });
        }

        // Map to Property interface locally for frontend compatibility
        const mapped: any = {
          id: `naver-${crawledProp.atclNo}`,
          atclNo: crawledProp.atclNo,
          title: crawledProp.atclNm,
          type: crawledProp.rletTpNm,
          price: crawledProp.tradTpNm === '매매' ? String(Number(crawledProp.prc) * 10000) : "0",
          deposit: crawledProp.tradTpNm === '전세' ? String(Number(crawledProp.prc) * 10000) : "0",
          depositAmount: crawledProp.tradTpNm === '월세' ? String(Number(crawledProp.prc) * 10000) : "0",
          monthlyRent: crawledProp.rentPrc ? String(Number(crawledProp.rentPrc) * 10000) : "0",
          // address는 flrInfo(지번 등)를 포함하므로 마스킹 처리
          address: maskAddress(`인천광역시 강화군 ${crawledProp.flrInfo || ''}`),
          district: '수집매물',
          size: crawledProp.spc1,
          imageUrls: crawledProp.imgUrl ? [crawledProp.imgUrl] : [],
          dealType: [crawledProp.tradTpNm],
          source: 'naver',
          direction: crawledProp.direction,
          rltrNm: crawledProp.rltrNm,
          description: "네이버 부동산에서 수집된 매물입니다.",
          isUrgent: false,
          isNegotiable: false,
          isLongTerm: false,
          featured: false,
          latitude: crawledProp.lat,
          longitude: crawledProp.lng
        };

        return res.json(mapped);
      }

      const id = parseInt(idParam);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      let property = await storage.getProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // 중개사 정보 결정 (leegyver를 기본으로 사용)
      const defaultRealtor = await storage.getUserByUsername('leegyver');
      const d = defaultRealtor as any;
      const defaultInfo = d ? {
        businessName: d.businessName,
        realtorName: d.realtorName,
        realtorPhone: d.realtorPhone,
        realtorPhoto: d.realtorPhoto,
        realtorAddress: d.realtorAddress,
        realtorLicenseNo: d.realtorLicenseNo
      } : null;

      if (property.ownerId) {
        const owner = await storage.getUser(property.ownerId);
        const o = owner as any;
        if (o && o.role === 'realtor') {
          (property as any).realtorInfo = {
            businessName: o.businessName,
            realtorName: o.realtorName,
            realtorPhone: o.realtorPhone,
            realtorPhoto: o.realtorPhoto,
            realtorAddress: o.realtorAddress,
            realtorLicenseNo: o.realtorLicenseNo
          };
        } else if (o && o.role === 'admin') {
          (property as any).realtorInfo = defaultInfo;
        }
      } else {
        // 소유주 정보가 없는 경우 기본 중개사 노출
        (property as any).realtorInfo = defaultInfo;
      }

      // 관리자인 경우 원본 데이터 반환, 일반 사용자는 마스킹 (등록 중개사 혹은 소유자면 마스킹 해제)
      let isAdmin = false;
      const user = req.user as any;
      if (req.isAuthenticated()) isAdmin = user.role === "admin";
      const isAuthorized = isAdmin || (user?.id && (property.ownerId === user.id || property.agentId === user.id));
      res.json(getSafeProperty(property, isAuthorized));
    } catch (error) {
      console.error("Property ID fetch error:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.patch("/api/properties/:id/featured", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { featured } = req.body;
      await storage.togglePropertyFeatured(id, featured);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle property featured status" });
    }
  });

  app.patch("/api/properties/:id/urgent", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { isUrgent } = req.body;
      await storage.togglePropertyUrgent(id, isUrgent);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle property urgent status" });
    }
  });

  app.patch("/api/properties/:id/negotiable", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { isNegotiable } = req.body;
      await storage.togglePropertyNegotiable(id, isNegotiable);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle property negotiable status" });
    }
  });

  app.patch("/api/properties/:id/long-term", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { isLongTerm } = req.body;
      await storage.togglePropertyLongTerm(id, isLongTerm);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle property long-term status" });
    }
  });

  app.put("/api/properties/:id/urgent-order", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { urgentOrder } = req.body;
      await storage.updatePropertyUrgentOrder(id, urgentOrder);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update property urgent order" });
    }
  });

  app.put("/api/properties/:id/negotiable-order", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { negotiableOrder } = req.body;
      await storage.updatePropertyNegotiableOrder(id, negotiableOrder);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update property negotiable order" });
    }
  });

  app.put("/api/properties/:id/long-term-order", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { longTermOrder } = req.body;
      await storage.updatePropertyLongTermOrder(id, longTermOrder);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update property long-term order" });
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

      // 이메일 알림 발송 (답변이 아닌 경우에만 관리자에게 알림)
      if (!inquiry.isReply) {
        try {
          const recipientEmail = '9551304@naver.com';
          const emailSubject = `[이가이버부동산] 매물 문의: ${property.title}`;
          const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
              <h2 style="color: #3b82f6; margin-bottom: 20px;">새로운 매물 문의가 등록되었습니다</h2>
              
              <div style="margin-bottom: 15px; background-color: #f0f9ff; padding: 15px; border-radius: 5px;">
                <strong>매물 정보:</strong><br>
                [${property.type}] ${property.title}<br>
                ${property.district} / ${Number(property.price) > 0 ? (Number(property.price) / 10000) + '만원' : '가격문의'}
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong>문의자 정보:</strong><br>
                이름: ${user.username}<br>
                연락처: ${user.phone || '없음'}<br>
                이메일: ${user.email || '없음'}
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong>문의 제목:</strong> ${inquiry.title}
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong>문의 내용:</strong>
                <p style="background-color: #f9f9f9; padding: 10px; border-radius: 4px;">${inquiry.content.replace(/\n/g, '<br>')}</p>
              </div>
              
              <div style="font-size: 12px; color: #666; margin-top: 30px; padding-top: 10px; border-top: 1px solid #e1e1e1;">
                <p>관리자 페이지에서 답글을 작성할 수 있습니다.</p>
              </div>
            </div>
          `;

          console.log(`매물 문의 알림 이메일 발송 준비: ${recipientEmail}`);
          await sendEmail(recipientEmail, emailSubject, emailContent);
        } catch (emailError) {
          console.error("매물 문의 알림 이메일 발송 실패:", emailError);
          // 이메일 실패해도 API 요청은 성공 처리
        }
      }

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
        const user = req.user as Express.User;
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
          maintenanceFee: stripCommas(req.body.maintenanceFee),
          // 공동중개 체크 안되어 있으면(false/undefined) 담당자를 '이가이버'로 자동 설정
          agentName: (!req.body.coListing) ? "이가이버" : (req.body.agentName || ""),
          // Realtor logic
          ownerId: user.role === 'realtor' ? user.id : (req.body.ownerId || null),
          coListing: user.role === 'realtor' ? true : (req.body.coListing || false)
        };

        if (user.role === 'realtor' && user.businessName) {
          processedData.agentName = user.businessName;
        }

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

      const user = req.user as Express.User;
      const isAdmin = user.role === "admin";
      const isRealtor = user.role === "realtor";

      // Realtor: Only their own properties
      if (isRealtor && existingProperty.ownerId !== user.id) {
        return res.status(403).json({ message: "본인의 매물만 수정할 수 있습니다." });
      }

      console.log(`[API] Property Update Request for ID ${id}:`, JSON.stringify(req.body, null, 2));

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
        maintenanceFee: stripCommas(req.body.maintenanceFee),
        // 공동중개 체크 안되어 있고(false 또는 undefined) agentName이 없으면 '이가이버'로 자동 설정
        // 이미 agentName이 "이가이버 공인중개사" 등으로 들어오면 유지함
        agentName: (req.body.coListing === false && (!req.body.agentName || req.body.agentName.trim() === ""))
          ? "이가이버"
          : (req.body.agentName !== undefined ? req.body.agentName : existingProperty.agentName)
      };

      console.log(`[API] Processed Update Data for ID ${id}:`, JSON.stringify(processedData, null, 2));

      const validatedData = insertPropertySchema.partial().parse(processedData);
      const updatedProperty = await storage.updateProperty(id, validatedData);

      if (updatedProperty) {
        console.log(`[API] Property ${id} successfully updated.`);
      } else {
        console.warn(`[API] Property ${id} update returned undefined.`);
      }

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

  // --- Admin User Management API ---
  app.get("/api/admin/users", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "접근 권한이 없습니다." });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "사용자 목록을 불러오는 데 실패했습니다." });
    }
  });

  app.patch("/api/admin/users/:id/role", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "접근 권한이 없습니다." });
      }
      const id = parseInt(req.params.id);
      const { role, realtorInfo } = req.body;
      const updatedUser = await storage.updateUserRole(id, role, realtorInfo);
      if (!updatedUser) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "사용자 역할 변경에 실패했습니다." });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "접근 권한이 없습니다." });
      }
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
    } catch (error) {
      res.status(500).json({ message: "사용자 삭제에 실패했습니다." });
    }
  });

  // --- Admin Batch Delete API ---
  app.post("/api/admin/batch-delete/:type", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }

      const user = req.user as any;
      const isAdmin = user.role === "admin";
      const isRealtor = user.role === "realtor";

      if (!isAdmin && !isRealtor) {
        return res.status(403).json({ message: "접근 권한이 없습니다." });
      }

      const { type } = req.params;
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "삭제할 항목을 선택해주세요." });
      }

      let successCount = 0;
      for (const id of ids) {
        try {
          const numericId = parseInt(id);
          if (isNaN(numericId)) continue;

          if (type === "properties") {
            // Check ownership if realtor
            if (isRealtor) {
              const prop = await storage.getProperty(numericId);
              if (prop && prop.ownerId === user.id) {
                await storage.deleteProperty(numericId);
                successCount++;
              }
            } else if (isAdmin) {
              await storage.deleteProperty(numericId);
              successCount++;
            }
          } else if (isAdmin) {
            // Other types are admin only
            if (type === "news") {
              await storage.deleteNews(numericId);
              successCount++;
            } else if (type === "users") {
              // Protecting admin account
              const targetUser = await storage.getUser(numericId);
              if (targetUser && targetUser.username !== "admin") {
                await storage.deleteUser(numericId);
                successCount++;
              }
            } else if (type === "newsletter") {
              await storage.deleteNewsletterSubscription(numericId);
              successCount++;
            }
          }
        } catch (err) {
          console.error(`Batch delete error for ${type} ID ${id}:`, err);
        }
      }

      res.json({ success: true, count: successCount });
    } catch (error) {
      console.error("Batch delete failed:", error);
      res.status(500).json({ message: "일괄 삭제 처리에 실패했습니다." });
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

  /*
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
  */

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
      const channelUrlParam = req.query.channelUrl as string;

      // 캐시에서 확인
      const cacheKey = `youtube_latest_${channelUrlParam || 'default'}_${limit}`;
      const cachedVideos = memoryCache.get(cacheKey);

      if (cachedVideos) {
        return res.json(cachedVideos);
      }

      // 유튜브 채널에서 최신 영상 가져오기 (전달된 URL이 있으면 사용, 없으면 기본 이가이버 채널)
      const channelUrl = channelUrlParam || "https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA?view_as=subscriber";
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

      // 현재 시간 기준으로 캐시가 1분 이상 지났으면 자동 갱신 (즉시성 강화)
      const now = Date.now();
      const cacheTimestamp = memoryCache.getTimestamp(cacheKey);
      const cacheAge = cacheTimestamp ? now - cacheTimestamp : Infinity;
      const shouldRefresh = refresh || !cacheTimestamp || cacheAge > 1 * 60 * 1000; // 1분으로 단축

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
        // blog-fetcher에서 blogCache를 import
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

      // 캐시에 저장 (1분)
      if (Array.isArray(posts) && posts.length > 0) {
        console.log(`${posts.length}개의 블로그 포스트를 캐시에 저장 (1분)`);
        memoryCache.set(cacheKey, posts, 1 * 60 * 1000);
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

  // 모든 뉴스 가져오기 (관리용)
  app.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getNews();
      res.json(news);
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
        const row = db.prepare("SELECT COUNT(*) as count FROM news").get() as { count: number };
        const newsCount = row.count;
        console.log(`현재 저장된 뉴스 개수: ${newsCount}`);
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

  // 누락된 ownerId 일괄 매핑 API (관리자용 데이터 보정)
  app.post("/api/admin/fix-ownerids", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
      }
      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
      }

      const allProperties = await storage.getAllProperties();
      const allUsers = await storage.getAllUsers();

      const realtors = allUsers.filter(u => u.role === 'realtor' || u.role === 'admin');
      let updatedCount = 0;

      for (const prop of allProperties) {
        // ownerId가 없고 agentName(담당중개사명)이 있는 경우 매핑 시도
        if (!prop.ownerId && prop.agentName) {
          const agentName = prop.agentName;
          const matchedRealtor = realtors.find(r =>
            (r.realtorName && r.realtorName.includes(agentName)) ||
            (r.businessName && r.businessName.includes(agentName)) ||
            (r.username && r.username.includes(agentName)) ||
            (r.realtorName && agentName.includes(r.realtorName)) ||
            (r.businessName && agentName.includes(r.businessName)) ||
            (agentName.includes('이가이버') && r.username === 'leegyver')
          );

          if (matchedRealtor) {
            await storage.updateProperty(prop.id, { ownerId: matchedRealtor.id });
            updatedCount++;
            console.log(`[Fix-OwnerId] 매물 ID ${prop.id}: '${prop.agentName}' -> 중개사 ID ${matchedRealtor.id} 매핑 완료`);
          }
        }
      }

      // 캐시 무효화
      memoryCache.deleteByPrefix("properties_");

      res.json({
        message: "ownerId 일괄 업데이트가 완료되었습니다.",
        updatedCount,
        totalProperties: allProperties.length
      });
    } catch (error) {
      console.error("ownerId 일괄 업데이트 중 오류:", error);
      res.status(500).json({ message: "ownerId 일괄 업데이트 중 오류가 발생했습니다." });
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

  // 관리자: 모든 사용자 목록 가져오기
  app.get("/api/admin/users", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다" });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "사용자 목록을 불러오는데 실패했습니다" });
    }
  });

  // 관리자: 사용자 역할 및 중개사 정보 업데이트
  app.patch("/api/admin/users/:id/role", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "관리자 권한이 필요합니다" });
      }

      const id = parseInt(req.params.id);
      const { role, businessName, realtorName, realtorPhone } = req.body;

      if (!role) {
        return res.status(400).json({ message: "역할 정보가 필요합니다" });
      }

      const updatedUser = await storage.updateUserRole(id, role, {
        businessName,
        realtorName,
        realtorPhone
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("사용자 역할 업데이트 오류:", error);
      res.status(500).json({ message: "사용자 정보 업데이트 중 오류가 발생했습니다" });
    }
  });

  // 관리자: 모든 뉴스레터 구독자 목록 가져오기
  app.get("/api/admin/newsletter/subscriptions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "관리자만 접근할 수 있습니다" });
      }
      const subs = await storage.getNewsletterSubscriptions();
      res.json(subs);
    } catch (error) {
      res.status(500).json({ message: "뉴스레터 구독자 목록을 불러오는데 실패했습니다" });
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

        case 'newsletter':
          for (const id of ids) {
            const result = await storage.deleteNewsletterSubscription(id);
            if (result) successCount++;
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

  // --- 배너 관리 API ---
  app.get("/api/banners", async (req, res) => {
    try {
      const location = req.query.location as string | undefined;
      const banners = await storage.getBanners(location);
      res.json(banners);
    } catch (error) {
      console.error("배너 조회 오류:", error);
      res.status(500).json({ message: "배너를 불러오는 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/banners", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "관리자 권한이 필요합니다." });
      }

      const parsed = insertBannerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "잘못된 데이터입니다.", errors: parsed.error });
      }

      const banner = await storage.createBanner(parsed.data);
      res.status(201).json(banner);
    } catch (error) {
      console.error("배너 생성 오류:", error);
      res.status(500).json({ message: "배너 생성 중 오류가 발생했습니다." });
    }
  });

  // 배너 순서 변경 API
  app.put("/api/banners/order", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "관리자 권한이 필요합니다." });
      }

      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "잘못된 데이터 형식입니다." });
      }

      // 순서 업데이트
      for (const item of items) {
        if (item.id && typeof item.displayOrder === 'number') {
          await storage.updateBannerOrder(item.id, item.displayOrder);
        }
      }

      res.json({ message: "배너 순서가 업데이트되었습니다." });
    } catch (error) {
      console.error("배너 순서 변경 오류:", error);
      res.status(500).json({ message: "배너 순서 변경 중 오류가 발생했습니다." });
    }
  });

  // 파일 업로드 API (이미지 리사이징 적용)
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "파일이 업로드되지 않았습니다." });
      }

      const originalPath = req.file.path;
      const filename = req.file.filename;

      console.log(`[Upload DEBUG] File: ${filename}, Type: ${req.file.mimetype}, Size: ${req.file.size}`);

      // 이미지 파일인 경우 리사이징 수행
      if (req.file.mimetype.startsWith('image/')) {
        const tempPath = path.join(uploadDir, `temp_${filename}`);

        try {
          // Jimp로 이미지 리사이징 및 최적화
          const image = await Jimp.read(originalPath);
          const currentWidth = image.getWidth();

          console.log(`[Upload] Original Width: ${currentWidth}px`);

          // 가로 1200px 초과 시 비율 유지하며 리사이징
          if (currentWidth > 1200) {
            console.log(`[Upload] Resizing from ${currentWidth}px to 1200px`);
            image.resize(1200, Jimp.AUTO);
          }

          // 품질 80%로 저장
          image.quality(80);
          await image.writeAsync(originalPath);

          console.log(`[Upload] 이미지 최적화 완료(Jimp, 최대 너비 1200px): ${filename}`);
        } catch (resizeError) {
          console.error(`[Upload] 이미지 최적화 실패 (원본 유지):`, resizeError);
          // 처리 실패 시 임시 파일 정리
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        }
      } else {
        console.log(`[Upload] Not an image, skipping resize. Mimetype: ${req.file.mimetype}`);
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("파일 업로드 오류:", error);
      res.status(500).json({ message: "파일 업로드 중 오류가 발생했습니다." });
    }
  });

  app.delete("/api/banners/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "관리자 권한이 필요합니다." });
      }

      const id = parseInt(req.params.id);
      const success = await storage.deleteBanner(id);
      if (success) {
        res.json({ message: "배너가 삭제되었습니다." });
      } else {
        res.status(404).json({ message: "배너를 찾을 수 없습니다." });
      }
    } catch (error) {
      console.error("배너 삭제 오류:", error);
      res.status(500).json({ message: "배너 삭제 중 오류가 발생했습니다." });
    }
  });

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

  // Notice Board API
  app.get("/api/notices", async (req, res) => {
    try {
      const notices = await storage.getNotices();
      res.json(notices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notices" });
    }
  });

  app.get("/api/notices/pinned", async (req, res) => {
    try {
      const notice = await storage.getPinnedNotice();
      res.json(notice || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pinned notice" });
    }
  });

  app.get("/api/notices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notice = await storage.getNotice(id);
      if (!notice) {
        return res.status(404).json({ message: "Notice not found" });
      }

      // Increment view count
      await storage.incrementNoticeViewCount(id);

      res.json(notice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notice" });
    }
  });

  app.post("/api/notices", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const user = req.user as Express.User;
      if (user.role !== "admin") return res.status(403).send("Forbidden");
      // const user = { id: 1, role: 'admin' } as any;

      const noticeData = insertNoticeSchema.parse(req.body);

      const notice = await storage.createNotice({
        ...noticeData,
        authorId: user.id
      });
      res.status(201).json(notice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid notice data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create notice" });
      }
    }
  });

  app.patch("/api/notices/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const user = req.user as Express.User;
      if (user.role !== "admin") return res.status(403).send("Forbidden");

      const id = parseInt(req.params.id);
      const noticeData = insertNoticeSchema.partial().parse(req.body);
      const updatedNotice = await storage.updateNotice(id, noticeData);

      if (!updatedNotice) return res.status(404).json({ message: "Notice not found" });

      res.json(updatedNotice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid notice data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update notice" });
      }
    }
  });

  app.delete("/api/notices/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const user = req.user as Express.User;
      if (user.role !== "admin") return res.status(403).send("Forbidden");

      const id = parseInt(req.params.id);
      const success = await storage.deleteNotice(id);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Notice not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notice" });
    }
  });

  // --- Newsletter API ---
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const parsed = insertNewsletterSubscriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "유효한 이메일 주소를 입력해주세요.", errors: parsed.error });
      }

      const { email } = parsed.data;

      // 중복 구독 확인
      const existing = await storage.getNewsletterSubscriptionByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "이미 구독 중인 이메일입니다." });
      }

      // 구독 정보 저장
      const subscription = await storage.createNewsletterSubscription({ email });

      // 자동 응답 이메일 발송
      try {
        const welcomeHtml = `
          <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 24px;">이가이버부동산 뉴스레터 구독을 감사드립니다!</h1>
            </div>
            
            <p>안녕하세요,</p>
            <p><strong>강화도 전문가 '이가이버'</strong>의 부동산 뉴스레터를 구독해주셔서 진심으로 감사드립니다.</p>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; color: #1e40af; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px;">앞으로 이런 소식을 전해드려요:</h3>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                <li style="margin-bottom: 8px;"><strong>강화도 주간 부동산 시장 동향</strong> (실거래가 분석)</li>
                <li style="margin-bottom: 8px;"><strong>이가이버가 엄선한 금주의 추천 매물</strong></li>
                <li style="margin-bottom: 8px;"><strong>강화도 거주 및 투자 팁</strong> (직접 경험한 노하우)</li>
                <li><strong>부동산 관련 법률 및 세제 소식</strong></li>
              </ul>
            </div>
            
            <p>매주 알찬 정보를 담아 찾아뵙겠습니다. 혹시 궁금하신 사항이 있다면 언제든 편하게 문의해 주시기 바랍니다.</p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 14px; color: #666;">
              <p style="margin-bottom: 5px;"><strong>이가이버 부동산 중개사무소</strong></p>
              <p style="margin-top: 5px;">인천광역시 강화군 강화읍 | 대표: 이민호</p>
              <p><a href="${req.protocol}://${req.get('host')}" style="color: #2563eb; text-decoration: none;">홈페이지 방문하기</a></p>
            </div>
          </div>
        `;

        await sendEmail(
          email,
          "[이가이버부동산] 뉴스레터 구독 신청이 완료되었습니다.",
          welcomeHtml
        );
        // console.log(`[Newsletter] Auto-reply sent to ${email}`);
      } catch (emailError) {
        console.error(`[Newsletter] Failed to send auto-reply to ${email}:`, emailError);
        // 구독 저장은 성공했으므로 계속 진행
      }

      res.status(201).json({ message: "구독 신청이 완료되었습니다. 감사 메일을 확인해주세요!", subscription });
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      res.status(500).json({ message: "구독 신청 중 오류가 발생했습니다." });
    }
  });

  // 관리자용 뉴스레터 구독자 목록 조회
  app.get("/api/admin/newsletter/subscriptions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(401).json({ message: "관리자 권한이 필요합니다." });
      }

      const subscriptions = await storage.getNewsletterSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Newsletter fetch error:", error);
      res.status(500).json({ message: "구독자 목록을 불러오는 중 오류가 발생했습니다." });
    }
  });

  // 관리자용 뉴스레터 구독 삭제
  app.delete("/api/admin/newsletter/subscriptions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(401).json({ message: "관리자 권한이 필요합니다." });
      }

      const id = parseInt(req.params.id);
      const success = await storage.deleteNewsletterSubscription(id);

      if (success) {
        res.json({ message: "구독 정보가 삭제되었습니다." });
      } else {
        res.status(404).json({ message: "구독 정보를 찾을 수 없습니다." });
      }
    } catch (error) {
      console.error("Newsletter delete error:", error);
      res.status(500).json({ message: "구독 삭제 중 오류가 발생했습니다." });
    }
  });

  // Crawler API
  app.post("/api/admin/crawler/run", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "인증이 필요합니다." });
      const user = req.user as Express.User;
      if (user.role !== "admin") return res.status(403).json({ message: "관리자 권한이 필요합니다." });

      const bounds = req.body.bounds;
      const mode = req.body.mode;

      // 비동기로 실행하고 결과를 기다리지 않음
      naverCrawler.fetchAndSave(bounds, mode).then(result => {
        // console.log("[Crawler] Background sync completed:", result);
      }).catch(err => {
        console.error("[Crawler] Background sync failed:", err);
      });

      res.json({
        success: true,
        message: "수집이 백그라운드에서 시작되었습니다. 수 분 내에 매물 목록에서 확인하실 수 있습니다."
      });
    } catch (error) {
      res.status(500).json({ message: "Crawler start failed", error: String(error) });
    }
  });

  app.get("/api/admin/crawled-properties", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "인증이 필요합니다." });
      const user = req.user as Express.User;
      if (user.role !== "admin") return res.status(403).json({ message: "관리자 권한이 필요합니다." });

      const properties = await storage.getCrawledProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crawled properties" });
    }
  });

  app.delete("/api/admin/crawled-properties", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "인증이 필요합니다." });
      const user = req.user as Express.User;
      if (user.role !== "admin") return res.status(403).json({ message: "관리자 권한이 필요합니다." });

      await storage.clearCrawledProperties();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear crawled properties" });
    }
  });

  // --- Post (Community) API ---
  app.get("/api/posts", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const posts = await storage.getPosts(category);
      const users = await storage.getAllUsers();
      const postsWithUser = posts.map(post => {
        const user = users.find(u => u.id === post.authorId);
        return {
          ...post,
          author: user ? { id: user.id, username: user.username, nickname: user.nickname } : null
        };
      });
      res.json(postsWithUser);
    } catch (error) {
      res.status(500).json({ message: "게시글 목록을 불러오는 중 오류가 발생했습니다." });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getPost(id);
      if (!post) return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });

      const users = await storage.getAllUsers();
      const user = users.find(u => u.id === post.authorId);
      const postWithUser = {
        ...post,
        author: user ? { id: user.id, username: user.username, nickname: user.nickname } : null
      };
      res.json(postWithUser);
    } catch (error) {
      res.status(500).json({ message: "게시글을 불러오는 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "로그인이 필요합니다." });
      const user = req.user as any;
      const parsed = insertPostSchema.safeParse({ ...req.body, authorId: user.id });
      if (!parsed.success) return res.status(400).json(parsed.error);
      const post = await storage.createPost(parsed.data);

      // 커뮤니티 게시글 알림
      try {
        await storage.createNotification({
          type: "post",
          title: "새로운 커뮤니티 게시글",
          content: `[${post.category}] ${post.title}`,
          isRead: false,
          linkUrl: `/admin?tab=posts`
        });
      } catch (e) {
        console.error("Failed to create post notification:", e);
      }

      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: "게시글 작성 중 오류가 발생했습니다." });
    }
  });

  app.patch("/api/posts/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "로그인이 필요합니다." });
      const id = parseInt(req.params.id);
      const existing = await storage.getPost(id);
      if (!existing) return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });

      const user = req.user as any;
      if (user.role !== "admin" && existing.authorId !== user.id) {
        return res.status(403).json({ message: "수정 권한이 없습니다." });
      }

      const parsed = insertPostSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);
      const updated = await storage.updatePost(id, parsed.data);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "게시글 수정 중 오류가 발생했습니다." });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "로그인이 필요합니다." });
      const id = parseInt(req.params.id);
      const existing = await storage.getPost(id);
      if (!existing) return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });

      const user = req.user as any;
      if (user.role !== "admin" && existing.authorId !== user.id) {
        return res.status(403).json({ message: "삭제 권한이 없습니다." });
      }

      const success = await storage.deletePost(id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "게시글 삭제 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/posts/:id/view", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementPostViewCount(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "조회수 증가 중 오류가 발생했습니다." });
    }
  });

  // --- Post Comments API ---
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const comments = await storage.getPostComments(id);

      // 사용자 이름(username) 조인
      const users = await storage.getAllUsers();
      const commentsWithUser = comments.map(comment => {
        const user = users.find(u => u.id === comment.authorId);
        return {
          ...comment,
          author: user ? { id: user.id, username: user.username, nickname: user.nickname } : null
        };
      });

      res.json(commentsWithUser);
    } catch (error) {
      res.status(500).json({ message: "댓글을 불러오는 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/posts/:id/comments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "로그인이 필요합니다." });
      const postId = parseInt(req.params.id);
      const user = req.user as any;

      const parsed = insertPostCommentSchema.safeParse({
        ...req.body,
        postId,
        authorId: user.id
      });
      if (!parsed.success) return res.status(400).json(parsed.error);

      const comment = await storage.createPostComment(parsed.data);
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "댓글 작성 중 오류가 발생했습니다." });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "로그인이 필요합니다." });
      const id = parseInt(req.params.id);
      const existing = await storage.getPostComment(id);
      if (!existing) return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });

      const user = req.user as any;
      if (user.role !== "admin" && existing.authorId !== user.id) {
        return res.status(403).json({ message: "삭제 권한이 없습니다." });
      }

      const success = await storage.deletePostComment(id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "댓글 삭제 중 오류가 발생했습니다." });
    }
  });

  // 뉴스 자동 업데이트 스케줄러 실행 (사용자 요청에 따라 활성화)
  setupNewsScheduler();

  // --- Admin Notification Management ---
  app.get("/api/admin/notifications", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(401).json({ message: "관리자 권한이 필요합니다." });
      }
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await storage.getNotifications(limit);
      const unreadCount = await storage.getUnreadNotificationCount();
      res.json({ notifications, unreadCount });
    } catch (error) {
      res.status(500).json({ message: "알림을 불러오는 중 오류가 발생했습니다." });
    }
  });

  app.patch("/api/admin/notifications/:id/read", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(401).json({ message: "관리자 권한이 필요합니다." });
      }
      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "알림 상태 변경 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/admin/notifications/read-all", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(401).json({ message: "관리자 권한이 필요합니다." });
      }
      await storage.markAllNotificationsAsRead();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "알림 일괄 읽음 처리 중 오류가 발생했습니다." });
    }
  });

  app.delete("/api/admin/notifications/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(401).json({ message: "관리자 권한이 필요합니다." });
      }
      const id = parseInt(req.params.id);
      await storage.deleteNotification(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "알림 삭제 중 오류가 발생했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}