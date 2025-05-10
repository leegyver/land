import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertInquirySchema, insertPropertySchema, insertNewsSchema } from "@shared/schema";
import { memoryCache } from "./cache";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // 인증 시스템 설정
  setupAuth(app);
  
  // API ROUTES
  
  // Properties
  app.get("/api/properties", async (req, res) => {
    try {
      // 캐시에서 먼저 확인
      const cacheKey = "properties_all";
      const cachedProperties = memoryCache.get(cacheKey);
      
      if (cachedProperties) {
        return res.json(cachedProperties);
      }
      
      // 캐시에 없으면 DB에서 조회
      const properties = await storage.getProperties();
      
      // 조회 결과를 캐시에 저장 (3분 동안)
      memoryCache.set(cacheKey, properties, 3 * 60 * 1000);
      
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });
  
  app.get("/api/properties/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const cacheKey = `properties_featured_${limit || 'default'}`;
      const cachedProperties = memoryCache.get(cacheKey);
      
      if (cachedProperties) {
        return res.json(cachedProperties);
      }
      
      const properties = await storage.getFeaturedProperties(limit);
      
      // 캐시 저장 (5분)
      memoryCache.set(cacheKey, properties, 5 * 60 * 1000);
      
      res.json(properties);
    } catch (error) {
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
  
  // Agents
  app.get("/api/agents", async (req, res) => {
    try {
      // 캐시에서 확인
      const cacheKey = "agents_all";
      const cachedAgents = memoryCache.get(cacheKey);
      
      if (cachedAgents) {
        return res.json(cachedAgents);
      }
      
      const agents = await storage.getAgents();
      
      // 캐시 저장 (10분)
      memoryCache.set(cacheKey, agents, 10 * 60 * 1000);
      
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
  
  // Testimonials
  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });
  
  // Inquiries
  app.post("/api/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });
  
  // Search properties
  app.get("/api/search", async (req, res) => {
    try {
      const { district, type, minPrice, maxPrice } = req.query;
      
      let properties = await storage.getProperties();
      
      if (district && district !== "all") {
        properties = properties.filter(p => p.district === district);
      }
      
      if (type && type !== "all") {
        properties = properties.filter(p => p.type === type);
      }
      
      if (minPrice && maxPrice) {
        const min = parseInt(minPrice as string);
        const max = parseInt(maxPrice as string);
        
        if (!isNaN(min) && !isNaN(max)) {
          properties = properties.filter(p => {
            const price = Number(p.price);
            return price >= min && price <= max;
          });
        }
      }
      
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to search properties" });
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
        // 타입을 변환하지 않고 원래 타입 그대로 유지
        // bedrooms와 bathrooms가 누락되는 문제 해결
        const processedData = {
          ...req.body,
          bedrooms: req.body.bedrooms !== undefined ? req.body.bedrooms : 0,
          bathrooms: req.body.bathrooms !== undefined ? req.body.bathrooms : 0
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
      
      // 타입을 변환하지 않고 원래 타입 그대로 유지
      const processedData = {
        ...req.body,
        bedrooms: req.body.bedrooms !== undefined ? req.body.bedrooms : existingProperty.bedrooms,
        bathrooms: req.body.bathrooms !== undefined ? req.body.bathrooms : existingProperty.bathrooms
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

  const httpServer = createServer(app);
  return httpServer;
}
