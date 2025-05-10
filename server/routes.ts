import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertInquirySchema, 
  insertPropertySchema, 
  insertNewsSchema, 
  insertPropertyInquirySchema 
} from "@shared/schema";
import { memoryCache } from "./cache";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // 인증 시스템 설정
  setupAuth(app);
  
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
          // 숫자 필드에 대한 빈 값 처리
          supplyArea: req.body.supplyArea === "" ? null : req.body.supplyArea,
          privateArea: req.body.privateArea === "" ? null : req.body.privateArea,
          floor: req.body.floor === "" ? null : req.body.floor, 
          totalFloors: req.body.totalFloors === "" ? null : req.body.totalFloors,
          deposit: req.body.deposit === "" ? null : req.body.deposit,
          monthlyRent: req.body.monthlyRent === "" ? null : req.body.monthlyRent,
          maintenanceFee: req.body.maintenanceFee === "" ? null : req.body.maintenanceFee
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
        bathrooms: req.body.bathrooms !== undefined ? req.body.bathrooms : existingProperty.bathrooms,
        // 숫자 필드에 대한 빈 값 처리
        supplyArea: req.body.supplyArea === "" ? null : req.body.supplyArea,
        privateArea: req.body.privateArea === "" ? null : req.body.privateArea,
        floor: req.body.floor === "" ? null : req.body.floor, 
        totalFloors: req.body.totalFloors === "" ? null : req.body.totalFloors,
        deposit: req.body.deposit === "" ? null : req.body.deposit,
        monthlyRent: req.body.monthlyRent === "" ? null : req.body.monthlyRent,
        maintenanceFee: req.body.maintenanceFee === "" ? null : req.body.maintenanceFee
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
