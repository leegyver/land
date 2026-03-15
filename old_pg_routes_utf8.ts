import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { db } from "./db";
import multer from "multer";
import fs from "fs";
import path from "path";
import express from "express";
import { Jimp } from "jimp";
import {
  insertInquirySchema,
  insertPropertySchema,
  insertNewsSchema,
  insertPropertyInquirySchema,
  insertFavoriteSchema,
  insertBannerSchema,
  insertNoticeSchema,
  insertNewsletterSubscriptionSchema
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
import { naverCrawler } from "./services/naver-crawler";
import { log } from "./vite";

// ?ъ씠???ㅼ젙 (?꾩슂???섍꼍蹂?섎굹 ?ㅼ젙 ?뚯씪濡??대룞 媛??
const siteConfig = {
  siteName: "?닿??대쾭 遺?숈궛",
  siteDescription: "媛뺥솕??遺?숈궛 以묎컻 ?쒕퉬??,
  siteContactEmail: "contact@ganghwaestate.com"
};

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
      // ?쒓? ?뚯씪紐?源⑥쭚 諛⑹?瑜??꾪빐 safe-name 泥섎━ ?먮뒗 timestamp ?ъ슜
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  });

  const upload = multer({
    storage: uploadStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB ?쒗븳
  });

  // ?몄쬆 ?쒖뒪???ㅼ젙
  setupAuth(app);

  // ?ъ씠???ㅼ젙 API
  app.get('/api/site/config', (req, res) => {
    res.json(siteConfig);
  });

  // ?쒖뒪???곹깭 吏꾨떒 API (諛고룷 ?붾쾭源낆슜)
  app.get('/api/status', async (req, res) => {
    try {
      // 1. ?섍꼍 蹂??議댁옱 ?щ? ?뺤씤 (媛믪? ?④?)
      const envCheck = {
        FIREBASE_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
        YOUTUBE_KEY: !!process.env.YOUTUBE_API_KEY,
        NAVER_ID: !!process.env.NAVER_CLIENT_ID,
        NAVER_SECRET: !!process.env.NAVER_CLIENT_SECRET,
        // Server side doesn't see VITE_ keys usually, but helpful to check if passed
        VITE_KAKAO_KEY: !!process.env.VITE_KAKAO_MAP_KEY,
        NODE_ENV: process.env.NODE_ENV,
        APP_URL: process.env.APP_URL, // 媛??뺤씤 ?꾩슂 (http/https mismatch ?뺤씤??
      };

      const defaultUrl = process.env.NODE_ENV === "production"
        ? "http://1.234.53.82"
        : "http://localhost:5000";
      const appUrl = (process.env.APP_URL || defaultUrl).replace(/\/$/, "");

      const authDebug = {
        naverCallback: `${appUrl}/api/auth/naver/callback`,
        kakaoCallback: `${appUrl}/api/auth/kakao/callback`
      };

      // 2. DB ?곌껐 諛??곗씠??媛쒖닔 ?뚯뒪??      let dbStatus = "Unknown";
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

  // ?섎룞 ?쒕뵫 API (?곗씠??蹂듦뎄??
  app.get('/api/admin/seed', async (req, res) => {
    try {
      const { seedInitialData } = await import("./seeder");
      await seedInitialData();
      res.json({ message: "Seeding executed. Check server logs for details or /api/status for count." });
    } catch (e) {
      res.status(500).json({ message: "Seeding failed", error: String(e) });
    }
  });

  // Replit ?곗씠??媛?몄삤湲?API (留덉씠洹몃젅?댁뀡)
  app.get('/api/admin/import-from-replit', async (req, res) => {
    try {
      const REMOTE_URL = 'https://real-estate-hub-mino312044.replit.app';

      // ?숈쟻 import濡?fetch ?ъ슜
      const response = await fetch(`${REMOTE_URL}/api/properties`);
      if (!response.ok) throw new Error(`Failed to fetch from Replit: ${response.statusText}`);

      const properties: any[] = await response.json();
      let count = 0;

      for (const prop of properties) {
        // ID 異⑸룎 諛⑹?瑜??꾪빐 湲곗〈 ID 臾댁떆?섍굅??泥댄겕
        // ?ш린???⑥닚 ?앹꽦???쒕룄
        const { id, createdAt, updatedAt, ...newProp } = prop;

        // ?곗씠???뺤젣
        newProp.price = String(newProp.price || "0");
        newProp.size = String(newProp.size || "0");
        newProp.imageUrls = newProp.imageUrls || [];

        await storage.createProperty(newProp);
        count++;
        // Firestore 荑쇳꽣 ?쒗븳 怨좊젮 ?쒕젅??        await new Promise(r => setTimeout(r, 50));
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
      const { keyword, district, type, minPrice, maxPrice, tag } = req.query;
      const includeCrawled = req.query.includeCrawled === 'true';

      console.log("寃???붿껌 ?섏떊:", { keyword, district, type, minPrice, maxPrice, tag, includeCrawled });

      // Fetch internal sources (always needed)
      const internalProps = await storage.getAllProperties();
      let naverProps: any[] = [];

      // Fetch naver sources only if requested
      if (includeCrawled) {
        naverProps = await storage.getCrawledProperties();
      }

      // Map internal properties
      const mappedInternal = internalProps
        .filter(p => p.isVisible) // Internal only visible ones
        .map(p => ({ ...p, source: 'internal' }));

      // Map naver properties to same structure
      const mappedNaver = naverProps.map(p => ({
        id: `naver-${p.atclNo}`,
        atclNo: p.atclNo,
        title: p.atclNm,
        type: p.rletTpNm,
        price: String(Number(p.prc) * 10000), // Map to string Won
        address: `?몄쿇愿묒뿭??媛뺥솕援?${p.flrInfo}`,
        district: '?섏쭛留ㅻЪ',
        size: p.spc1,
        latitude: p.lat,
        longitude: p.lng,
        imageUrls: p.imgUrl ? [p.imgUrl] : [],
        dealType: [p.tradTpNm],
        source: 'naver',
        direction: p.direction,
        rltrNm: p.rltrNm,
        description: "",
        isUrgent: false,
        isNegotiable: false,
        isLongTerm: false,
        featured: false
      }));

      // Combine
      let combined: any[] = [...mappedInternal];
      if (includeCrawled) {
        combined = [...combined, ...mappedNaver];
      }

      // Safety check: Filter out anything that looks like naver if includeCrawled is false
      if (!includeCrawled) {
        combined = (combined as any[]).filter(p => String(p.id).startsWith('naver-') === false && p.district !== '?섏쭛留ㅻЪ' && p.source !== 'naver');
      }

      // 1. ?ㅼ썙??寃??      if (keyword && typeof keyword === 'string' && keyword.trim() !== '') {
        const term = keyword.toLowerCase().trim();
        combined = combined.filter(p =>
          (p.title && p.title.toLowerCase().includes(term)) ||
          (p.address && p.address.toLowerCase().includes(term)) ||
          (p.description && p.description.toLowerCase().includes(term)) ||
          (p.district && p.district.toLowerCase().includes(term))
        );
      }

      // 2. 吏???꾪꽣留?      if (district && district !== 'all') {
        const searchDistrict = (district as string).toLowerCase();
        combined = combined.filter(p => {
          const propertyDistrict = (p.district || "").toLowerCase();

          if (p.source === 'naver') {
            return searchDistrict === '?섏쭛留ㅻЪ';
          }

          // ?대? 留ㅻЪ???뱀닔 留ㅼ묶 (湲곗〈 濡쒖쭅 ?좎?)
          if (propertyDistrict === searchDistrict) return true;
          if (searchDistrict === '湲고?吏??) {
            return !propertyDistrict.includes('媛뺥솕') || propertyDistrict === '';
          }
          return false;
        });
      }

      // 3. ?좏삎 ?꾪꽣留?      if (type && type !== 'all') {
        const searchType = (type as string).toLowerCase();
        combined = combined.filter(p => (p.type || "").toLowerCase().includes(searchType));
      }

      // 4. 媛寃?踰붿쐞 ?꾪꽣留?(留ㅻℓ媛, ?꾩꽭湲? 蹂댁쬆湲?以??섎굹?쇰룄 留ㅼ묶)
      if (minPrice && maxPrice) {
        const min = Number(minPrice);
        const max = Number(maxPrice);
        combined = combined.filter(p => {
          const price = Number(p.price || 0);
          const deposit = Number((p as any).deposit || 0);
          const depositAmount = Number((p as any).depositAmount || 0);

          return (price >= min && price <= max) ||
            (deposit >= min && deposit <= max) ||
            (depositAmount >= min && depositAmount <= max);
        });
      } else if (minPrice) {
        const min = Number(minPrice);
        combined = combined.filter(p => Number(p.price || 0) >= min || Number((p as any).deposit || 0) >= min || Number((p as any).depositAmount || 0) >= min);
      } else if (maxPrice) {
        const max = Number(maxPrice);
        combined = combined.filter(p => Number(p.price || 0) <= max && Number(p.price || 0) > 0);
      }

      // 5. ?쒓렇 ?꾪꽣留?      if (tag) {
        if (tag === 'urgent') combined = combined.filter(p => (p as any).isUrgent);
        if (tag === 'negotiable') combined = combined.filter(p => (p as any).isNegotiable);
        if (tag === 'long-term') combined = combined.filter(p => (p as any).isLongTerm);
        if (tag === 'recommended') combined = combined.filter(p => (p as any).featured);
      }

      console.log(`寃???꾨즺: ${combined.length}媛?諛섑솚 (Naver ?ы븿 ?щ?: ${includeCrawled})`);
      res.json(combined);
    } catch (error) {
      console.error("Search API failed:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Properties
  app.get("/api/properties", async (req, res) => {
    try {
      // 罹먯떆 ?뺤씤 ?щ?瑜?荑쇰━ ?뚮씪誘명꽣濡??쒖뼱
      const skipCache = req.query.skipCache === 'true';

      if (!skipCache) {
        // 罹먯떆?먯꽌 癒쇱? ?뺤씤
        const cacheKey = "properties_all";
        const cachedProperties = memoryCache.get(cacheKey);

        if (cachedProperties) {
          return res.json(cachedProperties);
        }
      }

      // 罹먯떆???녾굅??罹먯떆 ?ㅽ궢 ?붿껌?대㈃ DB?먯꽌 議고쉶
      const properties = await storage.getProperties();

      // 罹먯떆 ?ㅽ궢???꾨땺 寃쎌슦?먮쭔 罹먯떆 ???      if (!skipCache) {
        // 議고쉶 寃곌낵瑜?罹먯떆?????(1遺??숈븞 - 吏㏐쾶 ?좎?)
        memoryCache.set("properties_all", properties, 1 * 60 * 1000);
      }

      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
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
          price: Number(p.prc) * 10000, // Convert Man-Won to Won
          // Essential map fields only
          latitude: p.lat,
          longitude: p.lng,
          dealType: [p.tradTpNm] || [],
          source: 'naver',
          // Omit detailed fields for list to keep homepage fast
          address: ``,
          district: '?섏쭛留ㅻЪ',
          size: '',
          imageUrls: [],
          direction: '',
          rltrNm: ''
        }))
      ];

      console.log(`[API] Integrated fetch: ${integrated.length} items (Internal: ${internalProps.length}, Crawled: ${crawledProps.length})`);
      res.json(integrated);
    } catch (error) {
      console.error("Integrated fetch failed:", error);
      res.status(500).json({ message: "Failed to fetch integrated properties" });
    }
  });

  // 愿由ъ옄??紐⑤뱺 留ㅻЪ 議고쉶 (?몄텧/誘몃끂異??ы븿)
  app.get("/api/admin/properties", async (req, res) => {
    try {
      // ?몄쬆 諛?沅뚰븳 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄留??묎렐?????덉뒿?덈떎." });
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

      // 罹먯떆 鍮꾪솢?깊솕 - ??긽 理쒖떊 ?곗씠?곕? 媛?몄샂
      const properties = await storage.getFeaturedProperties(limit);

      // ?붾쾭源낆슜 濡쒓렇 異붽?
      console.log(`異붿쿇 留ㅻЪ ${properties.length}媛?議고쉶??`,
        properties.map(p => `${p.id}:${p.title}(${p.featured ? '異붿쿇' : '?쇰컲'})`));

      res.json(properties);
    } catch (error) {
      console.error("Error fetching featured properties:", error);
      res.status(500).json({ message: "Failed to fetch featured properties" });
    }
  });

  app.get("/api/properties/urgent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const properties = await storage.getUrgentProperties(limit);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch urgent properties" });
    }
  });

  app.get("/api/properties/negotiable", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const properties = await storage.getNegotiableProperties(limit);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch negotiable properties" });
    }
  });

  app.get("/api/properties/long-term", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const properties = await storage.getLongTermProperties(limit);
      res.json(properties);
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
          price: String(Number(crawledProp.prc) * 10000),
          address: `?몄쿇愿묒뿭??媛뺥솕援?${crawledProp.flrInfo}`, // Approximate
          district: '?섏쭛留ㅻЪ',
          size: crawledProp.spc1,
          imageUrls: crawledProp.imgUrl ? [crawledProp.imgUrl] : [],
          dealType: [crawledProp.tradTpNm],
          source: 'naver',
          direction: crawledProp.direction,
          rltrNm: crawledProp.rltrNm,
          description: "?ㅼ씠踰?遺?숈궛?먯꽌 ?섏쭛??留ㅻЪ?낅땲??",
          isUrgent: false,
          isNegotiable: false,
          isLongTerm: false,
          featured: false
        };

        return res.json(mapped);
      }

      const id = parseInt(idParam);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      const property = await storage.getProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // 媛쒖씤?뺣낫 諛?誘쇨컧?뺣낫 ?꾪꽣留?(?대씪?댁뼵?몃줈 ?꾩넚?섏? ?딅룄濡??쒓굅)
      // ?? 愿由ъ옄??紐⑤뱺 ?뺣낫瑜?蹂????덉뼱????      let isAdmin = false;
      if (req.isAuthenticated()) {
        const user = req.user as Express.User;
        isAdmin = user.role === "admin";
      }

      if (isAdmin) {
        return res.json(property);
      }

      const {
        // address??吏???쒖떆瑜??꾪빐 ?덉슜 (?? ?곸꽭 二쇱냼??unitNumber???④?)
        buildingName,
        unitNumber, // ?숉샇??(?몄텧湲덉?)
        ownerName, ownerPhone, // ?뚯쑀???뺣낫 (?몄텧湲덉?)
        tenantName, tenantPhone, // ?꾩감???뺣낫 (?몄텧湲덉?)
        clientName, clientPhone, // ?섎ː???뺣낫 (?몄텧湲덉?)
        privateNote, // 鍮꾧났媛?硫붾え (?몄텧湲덉?)
        ...safeProperty
      } = property;

      res.json(safeProperty);
    } catch (error) {
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
      // ?몄쬆 ?뺤씤
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
      // ?몄쬆 ?뺤씤
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
      // ?몄쬆 ?뺤씤
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

  // Testimonials API - ?쒓굅??
  // Inquiries
  app.post("/api/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);

      // ?대찓??諛쒖넚 ?쒕룄
      try {
        // ?대찓???쒗뵆由??앹꽦
        const emailTemplate = createInquiryEmailTemplate({
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          message: validatedData.message
        });

        // ?섏떊???대찓??二쇱냼瑜?紐낆떆?곸쑝濡??ㅼ젙 
        const recipientEmail = '9551304@naver.com'; // ?ш린???먰븯???섏떊???대찓?쇱쓣 吏곸젒 ?낅젰
        console.log(`?섏떊???대찓???ㅼ젙: ${recipientEmail}`);

        // ?대찓??諛쒖넚
        const emailSent = await sendEmail(
          recipientEmail,
          `[?닿??대쾭遺?숈궛 ?뱀궗?댄듃] ${validatedData.name}?섏쓽 ?덈줈??臾몄쓽媛 ?깅줉?섏뿀?듬땲??,
          emailTemplate
        );

        if (emailSent) {
          console.log(`臾몄쓽 ID ${inquiry.id}??????뚮┝ ?대찓???꾩넚 ?꾨즺`);
        } else {
          console.error(`臾몄쓽 ID ${inquiry.id}??????뚮┝ ?대찓???꾩넚 ?ㅽ뙣`);
        }
      } catch (emailError) {
        // ?대찓??諛쒖넚 ?ㅽ뙣 ??濡쒓렇 湲곕줉留??섍퀬 ?꾩껜 ?붿껌? ?ㅽ뙣濡?泥섎━?섏? ?딆쓬
        console.error('臾몄쓽 ?뚮┝ ?대찓??諛쒖넚 以??ㅻ쪟 諛쒖깮:', emailError);
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
        return res.status(404).json({ message: "?대떦 留ㅻЪ??李얠쓣 ???놁뒿?덈떎." });
      }

      // ?ъ슜???몄쬆 ?곹깭 ?뺤씤
      let user = null;
      let isAdmin = false;

      if (req.isAuthenticated()) {
        user = req.user as Express.User;
        isAdmin = user.role === "admin";
      }

      // ?대떦 留ㅻЪ?????臾몄쓽湲 紐⑸줉 媛?몄삤湲?      const inquiries = await storage.getPropertyInquiries(propertyId);

      // 臾몄쓽湲 泥섎━ (紐⑤뱺 ?ъ슜?먯뿉寃??쒕ぉ? ?쒖떆?섎릺, ?댁슜? 沅뚰븳???곕씪 ?꾪꽣留?
      // 紐⑤뱺 臾몄쓽湲??湲곕낯?곸쑝濡??쒓났?섎릺, ?대엺 沅뚰븳???녿뒗 寃쎌슦 ?댁슜???④?
      const filteredInquiries = inquiries.map(inquiry => {
        // 1. 愿由ъ옄??寃쎌슦: 紐⑤뱺 臾몄쓽湲 ?꾩껜 ?댁슜 蹂????덉쓬
        if (isAdmin) return inquiry;

        // 2. 濡쒓렇?명븳 ?ъ슜?먯씠怨??먯떊???묒꽦??湲? ?꾩껜 ?댁슜 蹂????덉쓬
        if (user && inquiry.userId === user.id) return inquiry;

        // 3. 濡쒓렇?명븳 ?ъ슜?먯씠怨??듬?湲??寃쎌슦 ?먯떊???묒꽦??臾몄쓽湲???듬?留??댁슜??蹂????덉쓬
        if (user && inquiry.isReply && inquiry.parentId) {
          // ?먭? ?묒꽦??李얘린
          const parentInquiry = inquiries.find(i => i.id === inquiry.parentId);
          if (user && parentInquiry?.userId === user.id) return inquiry;

          // ?먭? ?묒꽦?먭? ?꾨땶 寃쎌슦 ?댁슜???④?
          return {
            ...inquiry,
            content: "沅뚰븳???놁뒿?덈떎. ???듬?? 臾몄쓽 ?묒꽦?먯? 愿由ъ옄留?蹂????덉뒿?덈떎." // ?댁슜 ?④?
          };
        }

        // 4. ?쇰컲 臾몄쓽湲? ?쒕ぉ怨??묒꽦???뺣낫留?蹂????덉쓬 (?댁슜 ?④?)
        return {
          ...inquiry,
          content: "沅뚰븳???놁뒿?덈떎. ??臾몄쓽湲? ?묒꽦?먯? 愿由ъ옄留?蹂????덉뒿?덈떎." // ?댁슜 ?④?
        };
      });

      res.json(filteredInquiries);
    } catch (error) {
      console.error("Error getting property inquiries:", error);
      res.status(500).json({ message: "臾몄쓽湲 紐⑸줉??媛?몄삤??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  app.post("/api/properties/:propertyId/inquiries", async (req, res) => {
    try {
      // ?몄쬆 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const propertyId = parseInt(req.params.propertyId);
      const property = await storage.getProperty(propertyId);

      if (!property) {
        return res.status(404).json({ message: "?대떦 留ㅻЪ??李얠쓣 ???놁뒿?덈떎." });
      }

      const user = req.user as Express.User;

      // ?듬????묒꽦?섎뒗 寃쎌슦 沅뚰븳 ?뺤씤 (愿由ъ옄留?媛??
      if (req.body.isReply) {
        const isAdmin = user.role === "admin";

        if (!isAdmin) {
          return res.status(403).json({ message: "?듬?? 愿由ъ옄留??묒꽦?????덉뒿?덈떎." });
        }

        // 遺紐?臾몄쓽湲 ?뺤씤
        const parentId = req.body.parentId;
        if (!parentId) {
          return res.status(400).json({ message: "?듬??먮뒗 遺紐?臾몄쓽湲 ID媛 ?꾩슂?⑸땲??" });
        }

        // 遺紐?臾몄쓽湲 議고쉶?섏뿬 議댁옱?섎뒗吏 ?뺤씤
        const parentInquiry = await storage.getPropertyInquiry(parentId);
        if (!parentInquiry) {
          return res.status(404).json({ message: "?먮낯 臾몄쓽湲??李얠쓣 ???놁뒿?덈떎." });
        }

        // 遺紐?臾몄쓽湲???듬?湲???꾨땶吏 ?뺤씤 (?듬????듬????????놁쓬)
        if (parentInquiry.isReply) {
          return res.status(400).json({ message: "?듬??먮뒗 異붽? ?듬????????놁뒿?덈떎." });
        }
      }

      const inquiryData = {
        ...req.body,
        propertyId,
        userId: user.id,
      };

      const validatedData = insertPropertyInquirySchema.parse(inquiryData);
      const inquiry = await storage.createPropertyInquiry(validatedData);

      // ?대찓???뚮┝ 諛쒖넚 (?듬????꾨땶 寃쎌슦?먮쭔 愿由ъ옄?먭쾶 ?뚮┝)
      if (!inquiry.isReply) {
        try {
          const recipientEmail = '9551304@naver.com';
          const emailSubject = `[?닿??대쾭遺?숈궛] 留ㅻЪ 臾몄쓽: ${property.title}`;
          const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
              <h2 style="color: #3b82f6; margin-bottom: 20px;">?덈줈??留ㅻЪ 臾몄쓽媛 ?깅줉?섏뿀?듬땲??/h2>
              
              <div style="margin-bottom: 15px; background-color: #f0f9ff; padding: 15px; border-radius: 5px;">
                <strong>留ㅻЪ ?뺣낫:</strong><br>
                [${property.type}] ${property.title}<br>
                ${property.district} / ${Number(property.price) > 0 ? (Number(property.price) / 10000) + '留뚯썝' : '媛寃⑸Ц??}
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong>臾몄쓽???뺣낫:</strong><br>
                ?대쫫: ${user.username}<br>
                ?곕씫泥? ${user.phone || '?놁쓬'}<br>
                ?대찓?? ${user.email || '?놁쓬'}
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong>臾몄쓽 ?쒕ぉ:</strong> ${inquiry.title}
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong>臾몄쓽 ?댁슜:</strong>
                <p style="background-color: #f9f9f9; padding: 10px; border-radius: 4px;">${inquiry.content.replace(/\n/g, '<br>')}</p>
              </div>
              
              <div style="font-size: 12px; color: #666; margin-top: 30px; padding-top: 10px; border-top: 1px solid #e1e1e1;">
                <p>愿由ъ옄 ?섏씠吏?먯꽌 ?듦????묒꽦?????덉뒿?덈떎.</p>
              </div>
            </div>
          `;

          console.log(`留ㅻЪ 臾몄쓽 ?뚮┝ ?대찓??諛쒖넚 以鍮? ${recipientEmail}`);
          await sendEmail(recipientEmail, emailSubject, emailContent);
        } catch (emailError) {
          console.error("留ㅻЪ 臾몄쓽 ?뚮┝ ?대찓??諛쒖넚 ?ㅽ뙣:", emailError);
          // ?대찓???ㅽ뙣?대룄 API ?붿껌? ?깃났 泥섎━
        }
      }

      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "?섎せ??臾몄쓽湲 ?곗씠?곗엯?덈떎.", errors: error.errors });
      }
      console.error("Error creating property inquiry:", error);
      res.status(500).json({ message: "臾몄쓽湲 ?묒꽦 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  app.delete("/api/properties/:propertyId/inquiries/:inquiryId", async (req, res) => {
    try {
      // ?몄쬆 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const inquiryId = parseInt(req.params.inquiryId);
      const inquiry = await storage.getPropertyInquiry(inquiryId);

      if (!inquiry) {
        return res.status(404).json({ message: "?대떦 臾몄쓽湲??李얠쓣 ???놁뒿?덈떎." });
      }

      // ?묎렐 沅뚰븳 ?뺤씤 (?묒꽦???먮뒗 愿由ъ옄留???젣 媛??
      const user = req.user as Express.User;
      const isAdmin = user.role === "admin";
      const isAuthor = inquiry.userId === user.id;

      if (!isAdmin && !isAuthor) {
        return res.status(403).json({ message: "?대떦 臾몄쓽湲????젣??沅뚰븳???놁뒿?덈떎." });
      }

      const success = await storage.deletePropertyInquiry(inquiryId);
      if (success) {
        res.status(200).json({ message: "臾몄쓽湲????젣?섏뿀?듬땲??" });
      } else {
        res.status(500).json({ message: "臾몄쓽湲 ??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
      }
    } catch (error) {
      console.error("Error deleting property inquiry:", error);
      res.status(500).json({ message: "臾몄쓽湲 ??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // 愿由ъ옄??臾몄쓽湲 ?뚮┝ API
  app.get("/api/admin/inquiries/unread", async (req, res) => {
    try {
      // 愿由ъ옄 沅뚰븳 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄留??묎렐?????덉뒿?덈떎." });
      }

      const unreadInquiries = await storage.getUnreadInquiries();
      res.json(unreadInquiries);
    } catch (error) {
      console.error("Error getting unread inquiries:", error);
      res.status(500).json({ message: "誘몄씫? 臾몄쓽湲??媛?몄삤??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  app.get("/api/admin/inquiries/unread/count", async (req, res) => {
    try {
      // 愿由ъ옄 沅뚰븳 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄留??묎렐?????덉뒿?덈떎." });
      }

      const count = await storage.getUnreadInquiryCount();
      res.json({ count });
    } catch (error) {
      console.error("Error getting unread inquiry count:", error);
      res.status(500).json({ message: "誘몄씫? 臾몄쓽湲 ?섎? 媛?몄삤??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  app.put("/api/admin/inquiries/:inquiryId/read", async (req, res) => {
    try {
      // 愿由ъ옄 沅뚰븳 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄留??묎렐?????덉뒿?덈떎." });
      }

      const inquiryId = parseInt(req.params.inquiryId);
      const success = await storage.markInquiryAsRead(inquiryId);

      if (success) {
        res.json({ message: "臾몄쓽湲???쎌쓬 泥섎━?덉뒿?덈떎." });
      } else {
        res.status(500).json({ message: "?쎌쓬 泥섎━ 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
      }
    } catch (error) {
      console.error("Error marking inquiry as read:", error);
      res.status(500).json({ message: "?쎌쓬 泥섎━ 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  app.put("/api/admin/inquiries/read-all", async (req, res) => {
    try {
      // 愿由ъ옄 沅뚰븳 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄留??묎렐?????덉뒿?덈떎." });
      }

      const success = await storage.markAllInquiriesAsRead();

      if (success) {
        res.json({ message: "紐⑤뱺 臾몄쓽湲???쎌쓬 泥섎━?덉뒿?덈떎." });
      } else {
        res.status(500).json({ message: "?쎌쓬 泥섎━ 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
      }
    } catch (error) {
      console.error("Error marking all inquiries as read:", error);
      res.status(500).json({ message: "?쎌쓬 泥섎━ 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // 愿由ъ옄 ?꾩슜 API ?붾뱶?ъ씤??  // 遺?숈궛 ?앹꽦
  app.post("/api/properties", async (req, res) => {
    try {
      // ?몄쬆 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // ?붾쾭源?濡쒓렇 異붽?
      console.log('遺?숈궛 ?깅줉 ?붿껌 ?곗씠??', JSON.stringify(req.body, null, 2));

      try {
        // ?レ옄 ?꾨뱶?먯꽌 ?쇳몴 ?쒓굅?섎뒗 ?ы띁 ?⑥닔
        const stripCommas = (value: any): string | null => {
          if (value === "" || value === null || value === undefined) return null;
          return String(value).replace(/,/g, '');
        };

        // ?ㅼ쨷 ?대?吏 URLs 諛곗뿴??泥섎━
        // imageUrls媛 ?덉쑝硫?洹몃?濡??ъ슜?섍퀬, ?놁쑝硫?湲곕낯媛믪씤 鍮?諛곗뿴???ъ슜
        // ??낆쓣 蹂?섑븯吏 ?딄퀬 ?먮옒 ???洹몃?濡??좎?
        // bedrooms, bathrooms? ?レ옄 ????꾨뱶??鍮?臾몄옄?댁쓣 蹂??        const processedData = {
          ...req.body,
          bedrooms: req.body.bedrooms !== undefined ? req.body.bedrooms : 0,
          bathrooms: req.body.bathrooms !== undefined ? req.body.bathrooms : 0,
          // ?대?吏 URL ?꾨뱶 泥섎━
          imageUrls: Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [],
          // dealType 泥섎━ - 諛곗뿴濡?蹂??          dealType: Array.isArray(req.body.dealType) ? req.body.dealType :
            (req.body.dealType ? [req.body.dealType] : ['留ㅻℓ']),
          // ?レ옄 ?꾨뱶??- ?쇳몴 ?쒓굅 ??泥섎━
          price: stripCommas(req.body.price) || "0",
          size: stripCommas(req.body.size) || "0",
          // agentId 泥섎━ - ?꾩닔 ?꾨뱶?대?濡?湲곕낯媛??ㅼ젙 (database?먯꽌??agent_id濡???λ맖)
          agentId: (() => {
            const raw = Number(req.body.agentId || req.body.agent_id);
            return Number.isFinite(raw) && raw > 0 ? raw : 4; // NaN?대굹 臾댄슚??媛믪씠硫?湲곕낯媛?4 (?대???以묎컻??
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

        console.log('泥섎━???곗씠??', JSON.stringify(processedData, null, 2));

        const validatedData = insertPropertySchema.parse(processedData);
        const property = await storage.createProperty(validatedData);
        res.status(201).json(property);
      } catch (e) {
        if (e instanceof z.ZodError) {
          console.error('?좏슚??寃???ㅻ쪟:', JSON.stringify(e.errors, null, 2));
          return res.status(400).json({ message: "Invalid property data", errors: e.errors });
        }
        throw e;
      }
    } catch (error) {
      console.error('遺?숈궛 ?깅줉 ?ㅻ쪟:', error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  // 遺?숈궛 ?섏젙
  app.patch("/api/properties/:id", async (req, res) => {
    try {
      // ?몄쬆 ?뺤씤
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

      // ?レ옄 ?꾨뱶?먯꽌 ?쇳몴 ?쒓굅?섎뒗 ?ы띁 ?⑥닔
      const stripCommas = (value: any): string | null => {
        if (value === "" || value === null || value === undefined) return null;
        return String(value).replace(/,/g, '');
      };

      // ?좉퇋 ?깅줉怨??꾩쟾???숈씪???곗씠??泥섎━ 濡쒖쭅 ?곸슜
      const processedData = {
        ...req.body,
        bedrooms: req.body.bedrooms !== undefined ? req.body.bedrooms : (existingProperty.bedrooms || 0),
        bathrooms: req.body.bathrooms !== undefined ? req.body.bathrooms : (existingProperty.bathrooms || 0),
        // ?대?吏 URL ?꾨뱶 泥섎━
        imageUrls: Array.isArray(req.body.imageUrls) ? req.body.imageUrls : (req.body.imageUrls ? [req.body.imageUrls] : existingProperty.imageUrls || []),
        // dealType 泥섎━ - 諛곗뿴濡?蹂??        dealType: Array.isArray(req.body.dealType) ? req.body.dealType :
          (req.body.dealType ? [req.body.dealType] : (existingProperty.dealType || ['留ㅻℓ'])),
        // ?レ옄 ?꾨뱶??- ?쇳몴 ?쒓굅 ??泥섎━
        price: stripCommas(req.body.price) || existingProperty.price || "0",
        size: stripCommas(req.body.size) || existingProperty.size || "0",
        // agentId 泥섎━ - ?꾩닔 ?꾨뱶?대?濡?湲곕낯媛??ㅼ젙 (database?먯꽌??agent_id濡???λ맖)
        agentId: (() => {
          const raw = Number(req.body.agentId || req.body.agent_id || existingProperty.agentId);
          return Number.isFinite(raw) && raw > 0 ? raw : 4; // NaN?대굹 臾댄슚??媛믪씠硫?湲곕낯媛?4 (?대???以묎컻??
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
        console.error('遺?숈궛 ?섏젙 ?좏슚??寃???ㅻ쪟:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      console.error('遺?숈궛 ?섏젙 ?ㅻ쪟:', error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  // 遺?숈궛 ??젣
  app.delete("/api/properties/:id", async (req, res) => {
    try {
      // ?몄쬆 ?뺤씤
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
        // 遺?숈궛 罹먯떆 紐⑤몢 ??젣
        memoryCache.deleteByPrefix("properties_");
        res.json({ success: true });
      } else {
        res.status(500).json({ message: "Failed to delete property" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // 愿?щℓ臾?APIs
  // ?ъ슜?먯쓽 愿?щℓ臾?紐⑸줉 議고쉶
  app.get("/api/favorites", async (req, res) => {
    try {
      // ?몄쬆 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      const favoriteProperties = await storage.getFavoriteProperties(user.id);

      res.json(favoriteProperties);
    } catch (error) {
      console.error("Error fetching favorite properties:", error);
      res.status(500).json({ message: "愿?щℓ臾?紐⑸줉??媛?몄삤??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // 留ㅻЪ??愿?щℓ臾쇱뿉 ?깅줉?섏뼱 ?덈뒗吏 ?뺤씤
  app.get("/api/properties/:propertyId/is-favorite", async (req, res) => {
    try {
      // ?몄쬆?섏? ?딆? ?ъ슜?먮뒗 false 諛섑솚
      if (!req.isAuthenticated()) {
        return res.json({ isFavorite: false });
      }

      const propertyId = parseInt(req.params.propertyId);
      const user = req.user as Express.User;

      const isFavorite = await storage.isFavorite(user.id, propertyId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking if property is favorite:", error);
      res.status(500).json({ message: "愿?щℓ臾??뺤씤 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // 愿?щℓ臾?異붽?
  app.post("/api/favorites", async (req, res) => {
    try {
      // ?몄쬆 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      const propertyId = parseInt(req.body.propertyId);

      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "?좏슚?섏? ?딆? 留ㅻЪ ID?낅땲??" });
      }

      // 留ㅻЪ??議댁옱?섎뒗吏 ?뺤씤
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "?대떦 留ㅻЪ??李얠쓣 ???놁뒿?덈떎." });
      }

      const favoriteData = {
        userId: user.id,
        propertyId: propertyId
      };

      try {
        const favorite = await storage.addFavorite(favoriteData);
        res.status(201).json({ message: "愿?щℓ臾쇰줈 ?깅줉?섏뿀?듬땲??", favorite });
      } catch (err) {
        // ?대? 愿?щℓ臾쇰줈 ?깅줉?섏뼱 ?덈뒗 寃쎌슦
        if (err instanceof Error && err.message.includes("?대? 愿??留ㅻЪ濡??깅줉")) {
          return res.status(409).json({ message: "?대? 愿?щℓ臾쇰줈 ?깅줉?섏뼱 ?덉뒿?덈떎." });
        }
        throw err;
      }
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "愿?щℓ臾??깅줉 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // 愿?щℓ臾???젣
  app.delete("/api/favorites/:propertyId", async (req, res) => {
    try {
      // ?몄쬆 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      const propertyId = parseInt(req.params.propertyId);

      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "?좏슚?섏? ?딆? 留ㅻЪ ID?낅땲??" });
      }

      const success = await storage.removeFavorite(user.id, propertyId);

      if (success) {
        res.json({ message: "愿?щℓ臾쇱뿉????젣?섏뿀?듬땲??" });
      } else {
        res.status(404).json({ message: "?대떦 愿?щℓ臾쇱쓣 李얠쓣 ???놁뒿?덈떎." });
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "愿?щℓ臾???젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // News API ?붾뱶?ъ씤??
  // 紐⑤뱺 ?댁뒪 媛?몄삤湲?  app.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ message: "?댁뒪瑜?遺덈윭?ㅻ뒗???ㅽ뙣?덉뒿?덈떎" });
    }
  });

  // API ?뚯뒪???붾뱶?ъ씤??(臾몄젣 ?닿껐??
  app.get("/api/test-real-estate", async (req, res) => {
    try {
      await testRealEstateAPI();
      res.json({
        success: true,
        message: "API ?뚯뒪???꾨즺, ?쒕쾭 濡쒓렇瑜??뺤씤?섏꽭??
      });
    } catch (error) {
      console.error("API ?뚯뒪???ㅻ쪟:", error);
      res.status(500).json({
        success: false,
        message: "API ?뚯뒪??以??ㅻ쪟 諛쒖깮"
      });
    }
  });

  // 遺?숈궛 ?ㅺ굅?섍? API ?쇱슦??  app.get("/api/real-estate/transactions", async (req, res) => {
    try {
      // 吏??퐫??(湲곕낯媛? 媛뺥솕援?28710)
      const regionCode = req.query.regionCode as string || '28710';

      console.log(`?ㅺ굅?섍? ?곗씠???붿껌: 吏??퐫??${regionCode}`);
      const transactions = await getRecentTransactions(regionCode);

      res.json({
        success: true,
        count: transactions.length,
        data: transactions
      });
    } catch (error) {
      console.error("?ㅺ굅?섍? ?곗씠??議고쉶 ?ㅻ쪟:", error);
      res.status(500).json({
        success: false,
        message: "?ㅺ굅?섍? ?곗씠?곕? 媛?몄삤??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎."
      });
    }
  });

  // 理쒖떊 ?좏뒠釉??곸긽 媛?몄삤湲?  app.get("/api/youtube/latest", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      // 罹먯떆?먯꽌 ?뺤씤
      const cacheKey = `youtube_latest_${limit}`;
      const cachedVideos = memoryCache.get(cacheKey);

      if (cachedVideos) {
        return res.json(cachedVideos);
      }

      // ?닿??대쾭 ?좏뒠釉?梨꾨꼸?먯꽌 理쒖떊 ?곸긽 媛?몄삤湲?      const channelUrl = "https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA?view_as=subscriber";
      const videos = await getLatestYouTubeVideos(channelUrl, limit);

      // 罹먯떆?????(6?쒓컙)
      memoryCache.set(cacheKey, videos, 6 * 60 * 60 * 1000);

      res.json(videos);
    } catch (error) {
      console.error("?좏뒠釉??곸긽 媛?몄삤湲??ㅻ쪟:", error);
      res.status(500).json({
        message: "理쒖떊 ?좏뒠釉??곸긽??遺덈윭?ㅻ뒗???ㅽ뙣?덉뒿?덈떎",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ?뱀젙 ?좏뒠釉?梨꾨꼸 ?곸긽 媛?몄삤湲?(?쇰컲 ?곸긽留? ?쇱툩 ?쒖쇅)
  app.get("/api/youtube/channel/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const refresh = req.query.refresh === 'true';

      // 罹먯떆?먯꽌 ?뺤씤
      const cacheKey = `youtube_channel_videos_${channelId}_${limit}`;

      if (refresh) {
        memoryCache.delete(cacheKey);
      }

      const cachedVideos = memoryCache.get(cacheKey);

      if (cachedVideos) {
        return res.json(cachedVideos);
      }

      // 梨꾨꼸 ID濡?吏곸젒 ?곸긽 媛?몄삤湲?(?쇰컲 ?곸긽留?- medium/long duration)
      const videos = await fetchLatestYouTubeVideosWithAPI(channelId, limit);

      // 罹먯떆?????(6?쒓컙)
      memoryCache.set(cacheKey, videos, 6 * 60 * 60 * 1000);

      res.json(videos);
    } catch (error) {
      console.error("?좏뒠釉?梨꾨꼸 ?곸긽 媛?몄삤湲??ㅻ쪟:", error);
      res.status(500).json({
        message: "?좏뒠釉?梨꾨꼸 ?곸긽??遺덈윭?ㅻ뒗???ㅽ뙣?덉뒿?덈떎",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ?좏뒠釉??몃뱾濡?梨꾨꼸 ID 議고쉶
  app.get("/api/youtube/handle/:handle", async (req, res) => {
    try {
      const { handle } = req.params;

      // 罹먯떆?먯꽌 ?뺤씤
      const cacheKey = `youtube_handle_${handle}`;
      const cachedChannelId = memoryCache.get(cacheKey);

      if (cachedChannelId) {
        return res.json({ channelId: cachedChannelId });
      }

      const channelId = await getChannelIdByHandle(handle);

      if (!channelId) {
        return res.status(404).json({ message: "梨꾨꼸??李얠쓣 ???놁뒿?덈떎" });
      }

      // 罹먯떆?????(24?쒓컙)
      memoryCache.set(cacheKey, channelId, 24 * 60 * 60 * 1000);

      res.json({ channelId });
    } catch (error) {
      console.error("?좏뒠釉??몃뱾 議고쉶 ?ㅻ쪟:", error);
      res.status(500).json({
        message: "梨꾨꼸 ID 議고쉶???ㅽ뙣?덉뒿?덈떎",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ?좏뒠釉??쇱툩 媛?몄삤湲?  app.get("/api/youtube/shorts/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      // 罹먯떆?먯꽌 ?뺤씤
      const cacheKey = `youtube_shorts_${channelId}_${limit}`;
      const cachedShorts = memoryCache.get(cacheKey);

      if (cachedShorts) {
        return res.json(cachedShorts);
      }

      const shorts = await fetchYouTubeShorts(channelId, limit);

      // 罹먯떆?????(6?쒓컙)
      memoryCache.set(cacheKey, shorts, 6 * 60 * 60 * 1000);

      res.json(shorts);
    } catch (error) {
      console.error("?좏뒠釉??쇱툩 媛?몄삤湲??ㅻ쪟:", error);
      res.status(500).json({
        message: "?좏뒠釉??쇱툩瑜?遺덈윭?ㅻ뒗???ㅽ뙣?덉뒿?덈떎",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ?ㅼ씠踰?釉붾줈洹?理쒖떊 湲 媛?몄삤湲?  app.get("/api/blog/latest", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3; // 湲곕낯媛?3?쇰줈 蹂寃?      const blogId = req.query.blogId as string || '9551304';
      // ?ㅼ씠踰?釉붾줈洹?移댄뀒怨좊━:
      // - 35: ?섏쓽 痍⑤??앺솢
      // - 36: 遺?숈궛?뺣낫
      // - 37: ?몄긽?댁빞湲?      const categories = req.query.categories
        ? (req.query.categories as string).split(',')
        : ['35', '36', '37'];

      // 罹먯떆瑜?媛뺤젣濡?珥덇린?뷀븯??荑쇰━ ?뚮씪誘명꽣 異붽?
      const refresh = req.query.refresh === 'true';

      // 罹먯떆?먯꽌 ?뺤씤
      const cacheKey = `blog_latest_${blogId}_${categories.join('_')}_${limit}`;

      // ?꾩옱 ?쒓컙 湲곗??쇰줈 罹먯떆媛 1遺??댁긽 吏?ъ쑝硫??먮룞 媛깆떊 (利됱떆??媛뺥솕)
      const now = Date.now();
      const cacheTimestamp = memoryCache.getTimestamp(cacheKey);
      const cacheAge = cacheTimestamp ? now - cacheTimestamp : Infinity;
      const shouldRefresh = refresh || !cacheTimestamp || cacheAge > 1 * 60 * 1000; // 1遺꾩쑝濡??⑥텞

      // 罹먯떆 珥덇린?붽? ?꾩슂?섎㈃ 罹먯떆 ??젣
      if (shouldRefresh) {
        console.log(`釉붾줈洹?罹먯떆 珥덇린??(?? ${cacheKey}, ?ъ쑀: ${refresh ? '媛뺤젣 媛깆떊' : '?먮룞 媛깆떊'}, 寃쎄낵?쒓컙: ${cacheAge / 1000}珥?`);
        memoryCache.delete(cacheKey);
      }

      const cachedPosts = memoryCache.get(cacheKey);

      if (cachedPosts) {
        if (Array.isArray(cachedPosts) && cachedPosts.length > 0) {
          console.log(`釉붾줈洹?罹먯떆?먯꽌 ${cachedPosts.length}媛??ъ뒪??諛섑솚`);
          return res.json(cachedPosts);
        } else {
          console.log('釉붾줈洹?罹먯떆媛 鍮꾩뼱?덇굅?? ?섎せ???뺤떇?낅땲?? ?덈줈 媛?몄샃?덈떎.');
          memoryCache.delete(cacheKey);
        }
      }

      console.log(`釉붾줈洹??곗씠???덈줈 ?붿껌 (?? ${cacheKey})`);

      // ?ㅼ씠踰?釉붾줈洹몄뿉??理쒖떊 ?ъ뒪??媛?몄삤湲?      // 湲곗〈 global blogCache 珥덇린?붾? 癒쇱? ?섑뻾
      if (refresh) {
        console.log('媛뺤젣 ?덈줈怨좎묠 ?붿껌 - ?꾩뿭 釉붾줈洹?罹먯떆 珥덇린??);
        // blogCache瑜?吏곸젒 import?섏뿬 ?ъ슜
        try {
          // blog-fetcher?먯꽌 blogCache瑜?import
          const blogFetcher = require('./blog-fetcher');
          if (blogFetcher.blogCache) {
            blogFetcher.blogCache = {};
            console.log('釉붾줈洹?罹먯떆媛 ?꾩쟾??珥덇린?붾릺?덉뒿?덈떎. 紐⑤뱺 ?곗씠?곕? ?덈줈 媛?몄샃?덈떎.');
          }
        } catch (e) {
          console.error('釉붾줈洹?罹먯떆 珥덇린???ㅽ뙣:', e);
        }
      }

      let posts = await getLatestBlogPosts(blogId, categories, limit);

      // ?곗씠???좏슚??寃??- ?ъ뒪?멸? ?놁쑝硫??ㅼ떆 ?쒕룄
      if (!posts || posts.length === 0) {
        console.log('釉붾줈洹??곗씠??議고쉶 ?ㅽ뙣, 移댄뀒怨좊━ 蹂寃????ъ떆??);
        // 湲곕낯 移댄뀒怨좊━瑜?蹂寃쏀븯???ㅼ떆 ?쒕룄
        posts = await getLatestBlogPosts(blogId, ['0', '11'], limit);
      }

      // ?ъ뒪?멸? ?놁쑝硫?怨좎젙 ?泥??곗씠???쒓났 (??긽 ?ㅼ젣 ?곗씠?곕? 癒쇱? ?쒕룄)
      if (!posts || !Array.isArray(posts) || posts.length === 0) {
        console.log('?ㅼ씠踰?釉붾줈洹몄뿉???ъ뒪?몃? 媛?몄삤吏 紐삵뻽?듬땲?? ?ㅼ떆 ?쒕룄?⑸땲??');

        // ??踰덉㎏ ?쒕룄
        try {
          posts = await getLatestBlogPosts(blogId, ['11', '0'], limit);
        } catch (retryErr) {
          console.error('釉붾줈洹??곗씠????踰덉㎏ ?쒕룄 ?ㅽ뙣:', retryErr);
        }
      }

      // ?곗씠??寃利?- ?섎せ???뺤떇 ?꾪꽣留?      if (Array.isArray(posts)) {
        posts = posts.filter(post =>
          post &&
          typeof post === 'object' &&
          post.id &&
          post.title &&
          post.link
        );

        // ?쒕ぉ 以묐났 ?쒓굅 諛?湲몄씠 議곗젙
        const uniqueTitles = new Set<string>();
        posts = posts.filter(post => {
          if (!post.title || uniqueTitles.has(post.title)) return false;
          uniqueTitles.add(post.title);

          // ?쒕ぉ???덈Т 湲몃㈃ ?먮Ⅴ湲?          if (post.title.length > 50) {
            post.title = post.title.substring(0, 50) + '...';
          }

          return true;
        });
      }

      // 罹먯떆?????(1遺?
      if (Array.isArray(posts) && posts.length > 0) {
        console.log(`${posts.length}媛쒖쓽 釉붾줈洹??ъ뒪?몃? 罹먯떆?????(1遺?`);
        memoryCache.set(cacheKey, posts, 1 * 60 * 1000);
      } else {
        console.log('?좏슚??釉붾줈洹??ъ뒪?멸? ?놁뒿?덈떎.');
      }

      res.json(posts);
    } catch (error) {
      console.error("釉붾줈洹??ъ뒪??媛?몄삤湲??ㅻ쪟:", error);
      res.status(500).json({
        message: "理쒖떊 釉붾줈洹??ъ뒪?몃? 遺덈윭?ㅻ뒗???ㅽ뙣?덉뒿?덈떎",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 理쒖떊 ?댁뒪 媛?몄삤湲?  app.get("/api/news/latest", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;

      // 罹먯떆?먯꽌 ?뺤씤
      const cacheKey = `news_latest_${limit}`;
      const cachedNews = memoryCache.get(cacheKey);

      if (cachedNews) {
        return res.json(cachedNews);
      }

      const news = await storage.getLatestNews(limit);

      // 罹먯떆?????(5遺?
      memoryCache.set(cacheKey, news, 5 * 60 * 1000);

      res.json(news);
    } catch (error) {
      res.status(500).json({ message: "理쒖떊 ?댁뒪瑜?遺덈윭?ㅻ뒗???ㅽ뙣?덉뒿?덈떎" });
    }
  });

  // ?뱀젙 ?댁뒪 媛?몄삤湲?  app.get("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "?좏슚?섏? ?딆? ?댁뒪 ID?낅땲?? });
      }

      const newsItem = await storage.getNewsById(id);
      if (!newsItem) {
        return res.status(404).json({ message: "?댁뒪瑜?李얠쓣 ???놁뒿?덈떎" });
      }

      res.json(newsItem);
    } catch (error) {
      res.status(500).json({ message: "?댁뒪瑜?遺덈윭?ㅻ뒗???ㅽ뙣?덉뒿?덈떎" });
    }
  });

  // 移댄뀒怨좊━蹂??댁뒪 媛?몄삤湲?  app.get("/api/news/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const news = await storage.getNewsByCategory(category);
      res.json(news);
    } catch (error) {
      res.status(500).json({ message: "移댄뀒怨좊━蹂??댁뒪瑜?遺덈윭?ㅻ뒗???ㅽ뙣?덉뒿?덈떎" });
    }
  });

  // 愿由ъ옄: ?댁뒪 ?앹꽦
  app.post("/api/news", async (req, res) => {
    try {
      // ?몄쬆 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆???꾩슂?⑸땲?? });
      }

      const validatedData = insertNewsSchema.parse(req.body);
      const newsItem = await storage.createNews(validatedData);
      res.status(201).json(newsItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "?좏슚?섏? ?딆? ?댁뒪 ?곗씠?곗엯?덈떎", errors: error.errors });
      }
      res.status(500).json({ message: "?댁뒪 ?앹꽦???ㅽ뙣?덉뒿?덈떎" });
    }
  });

  // 愿由ъ옄: ?댁뒪 ?섏젙
  app.patch("/api/news/:id", async (req, res) => {
    try {
      // ?몄쬆 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆???꾩슂?⑸땲?? });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "?좏슚?섏? ?딆? ?댁뒪 ID?낅땲?? });
      }

      const existingNews = await storage.getNewsById(id);
      if (!existingNews) {
        return res.status(404).json({ message: "?댁뒪瑜?李얠쓣 ???놁뒿?덈떎" });
      }

      const validatedData = insertNewsSchema.partial().parse(req.body);
      const updatedNews = await storage.updateNews(id, validatedData);

      res.json(updatedNews);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "?좏슚?섏? ?딆? ?댁뒪 ?곗씠?곗엯?덈떎", errors: error.errors });
      }
      res.status(500).json({ message: "?댁뒪 ?섏젙???ㅽ뙣?덉뒿?덈떎" });
    }
  });

  // 愿由ъ옄: ?댁뒪 ??젣
  app.delete("/api/news/:id", async (req, res) => {
    try {
      // ?몄쬆 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆???꾩슂?⑸땲?? });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "?좏슚?섏? ?딆? ?댁뒪 ID?낅땲?? });
      }

      const exists = await storage.getNewsById(id);
      if (!exists) {
        return res.status(404).json({ message: "?댁뒪瑜?李얠쓣 ???놁뒿?덈떎" });
      }

      const result = await storage.deleteNews(id);

      if (result) {
        res.json({ success: true });
      } else {
        res.status(500).json({ message: "?댁뒪 ??젣???ㅽ뙣?덉뒿?덈떎" });
      }
    } catch (error) {
      res.status(500).json({ message: "?댁뒪 ??젣???ㅽ뙣?덉뒿?덈떎" });
    }
  });

  // ?댁뒪 ?섎룞 ?낅뜲?댄듃 API ?붾뱶?ъ씤??(GET: ?뚯뒪?몄슜, POST: ?뺤떇 ?명꽣?섏씠??
  app.get("/api/admin/update-news", async (req, res) => {
    try {
      // 愿由ъ옄 ?몄쬆 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆???꾩슂?⑸땲?? });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??" });
      }

      // ?댁뒪 ?섎룞 ?낅뜲?댄듃 ?ㅽ뻾
      let newsItems = [];
      try {
        newsItems = await fetchAndSaveNews();
        console.log("?댁뒪 ?낅뜲?댄듃 ?깃났:", newsItems.length, "媛쒖쓽 ?댁뒪 ??ぉ");
      } catch (err) {
        const fetchError = err as Error;
        console.error("?댁뒪 ?낅뜲?댄듃 以??ㅻ쪟:", fetchError);
        return res.status(500).json({ message: "?댁뒪 ?낅뜲?댄듃 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎: " + fetchError.message });
      }

      return res.json({
        success: true,
        message: "?댁뒪媛 ?깃났?곸쑝濡??낅뜲?댄듃?섏뿀?듬땲??",
        count: newsItems.length
      });
    } catch (error) {
      console.error("?댁뒪 ?섎룞 ?낅뜲?댄듃 API ?ㅻ쪟:", error);
      return res.status(500).json({ message: "?댁뒪 ?낅뜲?댄듃 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // 異붿쿇 留ㅻЪ ?쒖꽌 蹂寃?API
  app.put("/api/properties/:id/order", async (req, res) => {
    try {
      // ?몄쬆 諛?沅뚰븳 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄留??묎렐?????덉뒿?덈떎." });
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

  // 留ㅻЪ ?몄텧 ?곹깭 ?좉? API
  app.patch("/api/properties/:id/visibility", async (req, res) => {
    try {
      // ?몄쬆 諛?沅뚰븳 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄留??묎렐?????덉뒿?덈떎." });
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

  // 留ㅻЪ 異붿쿇 ?곹깭 ?좉? API
  app.patch("/api/properties/:id/featured", async (req, res) => {
    try {
      // ?몄쬆 諛?沅뚰븳 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄留??묎렐?????덉뒿?덈떎." });
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

  // 遺?숈궛 ?ㅼ쨷 ??젣 API
  app.post("/api/properties/batch-delete", async (req, res) => {
    try {
      // ?몄쬆 諛?沅뚰븳 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄留??묎렐?????덉뒿?덈떎." });
      }

      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "??젣??留ㅻЪ ID媛 ?꾩슂?⑸땲??" });
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            return await storage.deleteProperty(parseInt(id));
          } catch (err) {
            console.error(`留ㅻЪ ID ${id} ??젣 以??ㅻ쪟:`, err);
            return false;
          }
        })
      );

      const successCount = results.filter(Boolean).length;

      // 罹먯떆 ??젣
      memoryCache.deleteByPrefix("properties_");

      res.status(200).json({
        message: `珥?${ids.length}媛?以?${successCount}媛쒖쓽 留ㅻЪ????젣?섏뿀?듬땲??`,
        successCount,
        totalCount: ids.length
      });
    } catch (error) {
      console.error("留ㅻЪ ?쇨큵 ??젣 以??ㅻ쪟:", error);
      res.status(500).json({ message: "留ㅻЪ ?쇨큵 ??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // ?댁뒪 ?ㅼ쨷 ??젣 API
  app.post("/api/news/batch-delete", async (req, res) => {
    try {
      // ?몄쬆 諛?沅뚰븳 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄留??묎렐?????덉뒿?덈떎." });
      }

      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "??젣???댁뒪 ID媛 ?꾩슂?⑸땲??" });
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            return await storage.deleteNews(parseInt(id));
          } catch (err) {
            console.error(`?댁뒪 ID ${id} ??젣 以??ㅻ쪟:`, err);
            return false;
          }
        })
      );

      const successCount = results.filter(Boolean).length;

      // 罹먯떆 ??젣
      memoryCache.deleteByPrefix("news_");

      res.status(200).json({
        message: `珥?${ids.length}媛?以?${successCount}媛쒖쓽 ?댁뒪媛 ??젣?섏뿀?듬땲??`,
        successCount,
        totalCount: ids.length
      });
    } catch (error) {
      console.error("?댁뒪 ?쇨큵 ??젣 以??ㅻ쪟:", error);
      res.status(500).json({ message: "?댁뒪 ?쇨큵 ??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // ?ъ슜???ㅼ쨷 ??젣 API
  app.post("/api/users/batch-delete", async (req, res) => {
    try {
      // ?몄쬆 諛?沅뚰븳 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄留??묎렐?????덉뒿?덈떎." });
      }

      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "??젣???ъ슜??ID媛 ?꾩슂?⑸땲??" });
      }

      // ?먭린 ?먯떊? ??젣?????녿룄濡??꾪꽣留?      const filteredIds = ids.filter(id => parseInt(id) !== user.id);

      if (filteredIds.length !== ids.length) {
        console.log("?ъ슜?먭? ?먭린 ?먯떊????젣?섎젮怨??쒕룄?덉뒿?덈떎.");
      }

      const results = await Promise.all(
        filteredIds.map(async (id) => {
          try {
            return await storage.deleteUser(parseInt(id));
          } catch (err) {
            console.error(`?ъ슜??ID ${id} ??젣 以??ㅻ쪟:`, err);
            return false;
          }
        })
      );

      const successCount = results.filter(Boolean).length;

      res.status(200).json({
        message: `珥?${filteredIds.length}媛?以?${successCount}媛쒖쓽 ?ъ슜??怨꾩젙????젣?섏뿀?듬땲??`,
        successCount,
        totalCount: filteredIds.length,
        skippedSelf: ids.length !== filteredIds.length
      });
    } catch (error) {
      console.error("?ъ슜???쇨큵 ??젣 以??ㅻ쪟:", error);
      res.status(500).json({ message: "?ъ슜???쇨큵 ??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // ?듯빀 ?쇨큵 ??젣 API ?붾뱶?ъ씤??(admin-page-new.tsx? ?명솚)
  app.post("/api/admin/batch-delete/:type", async (req, res) => {
    try {
      // ?몄쬆 諛?愿由ъ옄 沅뚰븳 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆???꾩슂?⑸땲??" });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??" });
      }

      const { type } = req.params;
      const { ids } = req.body;

      console.log(`?쇨큵 ??젣 API ?몄텧: type=${type}, body=`, req.body);
      console.log(`ids ??? ${typeof ids}, 諛곗뿴?щ?: ${Array.isArray(ids)}, 媛?`, ids);

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "?좏슚??ID 紐⑸줉???꾩슂?⑸땲??" });
      }

      console.log(`?쇨큵 ??젣 泥섎━ ?쒖옉: ${type}, ??젣??ID 媛쒖닔: ${ids.length}, IDs:`, ids);

      let successCount = 0;

      switch (type) {
        case 'properties':
          for (const id of ids) {
            const result = await storage.deleteProperty(id);
            if (result) successCount++;
          }
          // 愿??罹먯떆 ??젣
          memoryCache.deleteByPrefix("properties_");
          break;

        case 'news':
          for (const id of ids) {
            const result = await storage.deleteNews(id);
            if (result) successCount++;
          }
          // 愿??罹먯떆 ??젣
          memoryCache.deleteByPrefix("news_");
          break;

        case 'users':
          // ?먭린 ?먯떊? ??젣?????녿룄濡??꾪꽣留?          const filteredIds = ids.filter(id => id !== user.id);
          if (filteredIds.length !== ids.length) {
            console.log("?ъ슜?먭? ?먭린 ?먯떊????젣?섎젮怨??쒕룄?덉뒿?덈떎.");
          }

          for (const id of filteredIds) {
            // 愿由ъ옄 怨꾩젙? ?쒖쇅
            const userToDelete = await storage.getUser(id);
            if (userToDelete && userToDelete.role !== 'admin') {
              const result = await storage.deleteUser(id);
              if (result) successCount++;
            }
          }
          break;

        default:
          return res.status(400).json({ message: "吏?먮릺吏 ?딅뒗 ?좏삎?낅땲??" });
      }

      res.json({
        success: true,
        message: `${successCount}媛쒖쓽 ??ぉ????젣?섏뿀?듬땲??`,
        deletedCount: successCount,
        skippedSelf: type === 'users' && ids.includes(user.id)
      });
    } catch (error) {
      console.error('?쇨큵 ??젣 ?ㅻ쪟:', error);
      res.status(500).json({ message: "?쇨큵 ??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // 釉붾줈洹??ъ뒪??愿??API ?쒓굅??
  // --- 諛곕꼫 愿由?API ---
  app.get("/api/banners", async (req, res) => {
    try {
      const location = req.query.location as string | undefined;
      const banners = await storage.getBanners(location);
      res.json(banners);
    } catch (error) {
      console.error("諛곕꼫 議고쉶 ?ㅻ쪟:", error);
      res.status(500).json({ message: "諛곕꼫瑜?遺덈윭?ㅻ뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  app.post("/api/banners", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??" });
      }

      const parsed = insertBannerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "?섎せ???곗씠?곗엯?덈떎.", errors: parsed.error });
      }

      const banner = await storage.createBanner(parsed.data);
      res.status(201).json(banner);
    } catch (error) {
      console.error("諛곕꼫 ?앹꽦 ?ㅻ쪟:", error);
      res.status(500).json({ message: "諛곕꼫 ?앹꽦 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // 諛곕꼫 ?쒖꽌 蹂寃?API
  app.put("/api/banners/order", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??" });
      }

      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "?섎せ???곗씠???뺤떇?낅땲??" });
      }

      // ?쒖꽌 ?낅뜲?댄듃
      for (const item of items) {
        if (item.id && typeof item.displayOrder === 'number') {
          await storage.updateBannerOrder(item.id, item.displayOrder);
        }
      }

      res.json({ message: "諛곕꼫 ?쒖꽌媛 ?낅뜲?댄듃?섏뿀?듬땲??" });
    } catch (error) {
      console.error("諛곕꼫 ?쒖꽌 蹂寃??ㅻ쪟:", error);
      res.status(500).json({ message: "諛곕꼫 ?쒖꽌 蹂寃?以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // ?뚯씪 ?낅줈??API (?대?吏 由ъ궗?댁쭠 ?곸슜)
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "?뚯씪???낅줈?쒕릺吏 ?딆븯?듬땲??" });
      }

      const originalPath = req.file.path;
      const filename = req.file.filename;

      console.log(`[Upload DEBUG] File: ${filename}, Type: ${req.file.mimetype}, Size: ${req.file.size}`);

      // ?대?吏 ?뚯씪??寃쎌슦 由ъ궗?댁쭠 ?섑뻾
      if (req.file.mimetype.startsWith('image/')) {
        const tempPath = path.join(uploadDir, `temp_${filename}`);

        try {
          // Jimp濡?由ъ궗?댁쭠 諛?理쒖쟻??          // 媛濡?400px濡??쒗븳, 鍮꾩쑉 ?좎?
          const image = await Jimp.read(originalPath);
          const currentWidth = image.bitmap.width;

          console.log(`[Upload] Width: ${currentWidth}px`);

          if (currentWidth > 400) {
            console.log(`[Upload] Resizing from ${currentWidth}px to 400px`);
            await image
              .resize({ w: 400 }); // Jimp v1.x requires object syntax
            // .quality(80); // Skipping quality to avoid API mismatch risk

            // Get Buffer manually (Promise mode for Jimp v1.x)
            const resizedBuffer = await image.getBuffer(req.file.mimetype);

            console.log(`[Upload] Resized buffer size: ${resizedBuffer.length} bytes`);

            // Write buffer to temp path
            fs.writeFileSync(tempPath, resizedBuffer);

            // ?먮낯 ?뚯씪??由ъ궗?댁쭠???뚯씪濡?援먯껜
            if (fs.existsSync(originalPath)) {
              fs.unlinkSync(originalPath);
            }
            fs.renameSync(tempPath, originalPath);

            console.log(`[Upload] ?대?吏 由ъ궗?댁쭠 ?꾨즺(Jimp): ${filename}`);
          } else {
            // 400px ?댄븯??寃쎌슦 由ъ궗?댁쭠 ?ㅽ궢
            console.log(`[Upload] ?대?吏 由ъ궗?댁쭠 ?ㅽ궢(?덈퉬 ${currentWidth}px): ${filename}`);
          }
        } catch (resizeError) {
          console.error(`[Upload] ?대?吏 由ъ궗?댁쭠 ?ㅽ뙣 (?먮낯 ?좎?):`, resizeError);
          // 由ъ궗?댁쭠 ?ㅽ뙣 ??temp ?뚯씪 ?뺣━
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
      console.error("?뚯씪 ?낅줈???ㅻ쪟:", error);
      res.status(500).json({ message: "?뚯씪 ?낅줈??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  app.delete("/api/banners/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??" });
      }

      const id = parseInt(req.params.id);
      const success = await storage.deleteBanner(id);
      if (success) {
        res.json({ message: "諛곕꼫媛 ??젣?섏뿀?듬땲??" });
      } else {
        res.status(404).json({ message: "諛곕꼫瑜?李얠쓣 ???놁뒿?덈떎." });
      }
    } catch (error) {
      console.error("諛곕꼫 ??젣 ?ㅻ쪟:", error);
      res.status(500).json({ message: "諛곕꼫 ??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // 援ш? ?ㅽ봽?덈뱶?쒗듃 以묐났 留ㅻЪ ?뺤씤 API
  app.post("/api/admin/check-sheet-duplicates", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄留??묎렐?????덉뒿?덈떎." });
      }

      const { spreadsheetId, ranges, filterDate } = req.body;
      const apiKey = process.env.GOOGLE_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ success: false, error: "?쒕쾭??Google API ?ㅺ? ?ㅼ젙?섏? ?딆븯?듬땲??" });
      }

      if (!spreadsheetId || !filterDate) {
        return res.status(400).json({ success: false, error: "?ㅽ봽?덈뱶?쒗듃 ID? ?좎쭨???꾩닔?낅땲??" });
      }

      const sheetRanges = ranges || ["?좎?!A2:BA", "二쇳깮!A2:BA", "?꾪뙆?몄쇅!A2:BA", "?곴???A2:BA"];
      let allDuplicates: { rowIndex: number; address: string; existingPropertyId: number; existingPropertyTitle: string; sheetName: string }[] = [];

      for (const range of sheetRanges) {
        try {
          const result = await checkDuplicatesFromSheet(spreadsheetId, apiKey, range, filterDate);
          if (result.success && result.duplicates) {
            const sheetName = range.split('!')[0];
            allDuplicates = [...allDuplicates, ...result.duplicates.map(d => ({ ...d, sheetName }))];
          }
        } catch (sheetError) {
          log(`?쒗듃 ${range} 以묐났 ?뺤씤 以??ㅻ쪟 (臾댁떆??: ${sheetError}`, 'warn');
        }
      }

      res.json({ success: true, duplicates: allDuplicates });
    } catch (error) {
      console.error("以묐났 ?뺤씤 ?ㅻ쪟:", error);
      res.status(500).json({ success: false, error: "以묐났 ?뺤씤 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // 援ш? ?ㅽ봽?덈뱶?쒗듃?먯꽌 遺?숈궛 ?곗씠??媛?몄삤湲?API

  app.post("/api/admin/import-from-sheet", async (req, res) => {
    try {
      // ?몄쬆 諛?沅뚰븳 ?뺤씤
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "?몄쬆?섏? ?딆? ?ъ슜?먯엯?덈떎." });
      }

      const user = req.user as Express.User;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "愿由ъ옄留??묎렐?????덉뒿?덈떎." });
      }

      const { spreadsheetId, ranges, filterDate, skipAddresses } = req.body;

      // ?쒕쾭????λ맂 Google API ???ъ슜
      const apiKey = process.env.GOOGLE_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ success: false, error: "?쒕쾭??Google API ?ㅺ? ?ㅼ젙?섏? ?딆븯?듬땲??" });
      }

      if (!spreadsheetId) {
        return res.status(400).json({ message: "?ㅽ봽?덈뱶?쒗듃 ID???꾩닔?낅땲??" });
      }

      // ?좎쭨 ?꾪꽣 ?꾩닔 寃利?      if (!filterDate) {
        return res.status(400).json({ success: false, error: "?좎쭨瑜?諛섎뱶???좏깮?댁＜?몄슂." });
      }

      log(`?곗씠??媛?몄삤湲??쒖옉: ?ㅽ봽?덈뱶?쒗듃=${spreadsheetId}, ?좎쭨?꾪꽣=${filterDate}, 嫄대꼫??二쇱냼: ${skipAddresses?.length || 0}媛?, 'info');
      log(`?꾨떖諛쏆? ranges ?뚮씪誘명꽣: ${JSON.stringify(ranges)}`, 'info');

      // ?щ윭 ?쒗듃?먯꽌 ?곗씠??媛?몄삤湲?(?쒓? ?쒗듃 ?대쫫 ?ъ슜)
      const sheetRanges = ranges || ["?좎?!A2:BA", "二쇳깮!A2:BA", "?꾪뙆?몄쇅!A2:BA", "?곴???A2:BA"];
      log(`泥섎━???쒗듃 紐⑸줉: ${JSON.stringify(sheetRanges)}`, 'info');
      let totalCount = 0;
      let allImportedIds: number[] = [];
      let allErrors: string[] = [];
      const addressesToSkip: string[] = skipAddresses || [];

      for (const range of sheetRanges) {
        try {
          log(`?쒗듃 泥섎━ ?쒖옉: ${range}`, 'info');
          const result = await importPropertiesFromSheet(spreadsheetId, apiKey, range, filterDate, addressesToSkip);
          log(`?쒗듃 泥섎━ ?꾨즺: ${range}, ?깃났=${result.success}, 媛쒖닔=${result.count || 0}`, 'info');
          if (result.success && result.count) {
            totalCount += result.count;
            if (result.importedIds) {
              allImportedIds = [...allImportedIds, ...result.importedIds];
            }
          }
          if (result.error) {
            log(`?쒗듃 ?ㅻ쪟 諛쒖깮: ${range}: ${result.error}`, 'warn');
            allErrors.push(`${range}: ${result.error}`);
          }
        } catch (sheetError: any) {
          // ?쒗듃媛 ?녾굅??鍮?寃쎌슦 ?ㅻ쪟 臾댁떆?섍퀬 怨꾩냽
          const errorMessage = sheetError?.message || String(sheetError);
          log(`?쒗듃 ${range} 泥섎━ 以??덉쇅 諛쒖깮: ${errorMessage}`, 'error');
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
      console.error("?ㅽ봽?덈뱶?쒗듃 ?곗씠??媛?몄삤湲??ㅻ쪟:", error);
      res.status(500).json({ success: false, error: "?곗씠??媛?몄삤湲?以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
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
        return res.status(400).json({ message: "?좏슚???대찓??二쇱냼瑜??낅젰?댁＜?몄슂.", errors: parsed.error });
      }

      const { email } = parsed.data;

      // 以묐났 援щ룆 ?뺤씤
      const existing = await storage.getNewsletterSubscriptionByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "?대? 援щ룆 以묒씤 ?대찓?쇱엯?덈떎." });
      }

      // 援щ룆 ?뺣낫 ???      const subscription = await storage.createNewsletterSubscription({ email });

      // ?먮룞 ?묐떟 ?대찓??諛쒖넚
      try {
        const welcomeHtml = `
          <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 24px;">?닿??대쾭遺?숈궛 ?댁뒪?덊꽣 援щ룆??媛먯궗?쒕┰?덈떎!</h1>
            </div>
            
            <p>?덈뀞?섏꽭??</p>
            <p><strong>媛뺥솕???꾨Ц媛 '?닿??대쾭'</strong>??遺?숈궛 ?댁뒪?덊꽣瑜?援щ룆?댁＜?붿꽌 吏꾩떖?쇰줈 媛먯궗?쒕┰?덈떎.</p>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; color: #1e40af; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px;">?욎쑝濡??대윴 ?뚯떇???꾪빐?쒕젮??</h3>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                <li style="margin-bottom: 8px;"><strong>媛뺥솕??二쇨컙 遺?숈궛 ?쒖옣 ?숉뼢</strong> (?ㅺ굅?섍? 遺꾩꽍)</li>
                <li style="margin-bottom: 8px;"><strong>?닿??대쾭媛 ?꾩꽑??湲덉＜??異붿쿇 留ㅻЪ</strong></li>
                <li style="margin-bottom: 8px;"><strong>媛뺥솕??嫄곗＜ 諛??ъ옄 ??/strong> (吏곸젒 寃쏀뿕???명븯??</li>
                <li><strong>遺?숈궛 愿??踰뺣쪧 諛??몄젣 ?뚯떇</strong></li>
              </ul>
            </div>
            
            <p>留ㅼ＜ ?뚯갔 ?뺣낫瑜??댁븘 李얠븘逾숆쿋?듬땲?? ?뱀떆 沅곴툑?섏떊 ?ы빆???덈떎硫??몄젣???명븯寃?臾몄쓽??二쇱떆湲?諛붾엻?덈떎.</p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 14px; color: #666;">
              <p style="margin-bottom: 5px;"><strong>?닿??대쾭 遺?숈궛 以묎컻?щТ??/strong></p>
              <p style="margin-top: 5px;">?몄쿇愿묒뿭??媛뺥솕援?媛뺥솕??| ??? ?대???/p>
              <p><a href="${req.protocol}://${req.get('host')}" style="color: #2563eb; text-decoration: none;">?덊럹?댁? 諛⑸Ц?섍린</a></p>
            </div>
          </div>
        `;

        await sendEmail(
          email,
          "[?닿??대쾭遺?숈궛] ?댁뒪?덊꽣 援щ룆 ?좎껌???꾨즺?섏뿀?듬땲??",
          welcomeHtml
        );
        console.log(`[Newsletter] Auto-reply sent to ${email}`);
      } catch (emailError) {
        console.error(`[Newsletter] Failed to send auto-reply to ${email}:`, emailError);
        // 援щ룆 ??μ? ?깃났?덉쑝誘濡?怨꾩냽 吏꾪뻾
      }

      res.status(201).json({ message: "援щ룆 ?좎껌???꾨즺?섏뿀?듬땲?? 媛먯궗 硫붿씪???뺤씤?댁＜?몄슂!", subscription });
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      res.status(500).json({ message: "援щ룆 ?좎껌 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // 愿由ъ옄???댁뒪?덊꽣 援щ룆??紐⑸줉 議고쉶
  app.get("/api/admin/newsletter/subscriptions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(401).json({ message: "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??" });
      }

      const subscriptions = await storage.getNewsletterSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Newsletter fetch error:", error);
      res.status(500).json({ message: "援щ룆??紐⑸줉??遺덈윭?ㅻ뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // 愿由ъ옄???댁뒪?덊꽣 援щ룆 ??젣
  app.delete("/api/admin/newsletter/subscriptions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(401).json({ message: "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??" });
      }

      const id = parseInt(req.params.id);
      const success = await storage.deleteNewsletterSubscription(id);

      if (success) {
        res.json({ message: "援щ룆 ?뺣낫媛 ??젣?섏뿀?듬땲??" });
      } else {
        res.status(404).json({ message: "援щ룆 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎." });
      }
    } catch (error) {
      console.error("Newsletter delete error:", error);
      res.status(500).json({ message: "援щ룆 ??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." });
    }
  });

  // Crawler API
  app.post("/api/admin/crawler/run", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "?몄쬆???꾩슂?⑸땲??" });
      const user = req.user as Express.User;
      if (user.role !== "admin") return res.status(403).json({ message: "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??" });

      const bounds = req.body.bounds; // optional { minLat, minLon, maxLat, maxLon }
      const mode = req.body.mode; // optional 'single' | 'grid'
      const result = await naverCrawler.fetchAndSave(bounds, mode);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Crawler failed", error: String(error) });
    }
  });

  app.get("/api/admin/crawled-properties", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "?몄쬆???꾩슂?⑸땲??" });
      const user = req.user as Express.User;
      if (user.role !== "admin") return res.status(403).json({ message: "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??" });

      const properties = await storage.getCrawledProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crawled properties" });
    }
  });

  app.delete("/api/admin/crawled-properties", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "?몄쬆???꾩슂?⑸땲??" });
      const user = req.user as Express.User;
      if (user.role !== "admin") return res.status(403).json({ message: "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??" });

      await storage.clearCrawledProperties();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear crawled properties" });
    }
  });

  // ?댁뒪 ?먮룞 ?낅뜲?댄듃 ?ㅼ?以꾨윭 ?ㅽ뻾 (?ъ슜???붿껌???곕씪 ?쒖꽦??
  setupNewsScheduler();

  const httpServer = createServer(app);
  return httpServer;
}
