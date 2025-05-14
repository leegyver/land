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
import { fetchAndSaveNews } from "./news-fetcher";
// 블로그 포스트 관련 코드 제거됨
import { sendEmail, createInquiryEmailTemplate } from "./mailer";

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
  
  // Agents API - 제거됨
  
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
  
  // Search properties
  app.get("/api/search", async (req, res) => {
    try {
      const { district, type, minPrice, maxPrice } = req.query;
      console.log("검색 파라미터:", { district, type, minPrice, maxPrice });
      
      let properties = await storage.getProperties();
      
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
          // 필수 필드에 대한 기본값 처리
          city: req.body.city || "인천", // city 필드에 기본값 설정
          size: req.body.size !== undefined ? String(req.body.size) : "0", // size를 문자열로 변환
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
        // 필수 필드에 대한 기본값 처리
        city: req.body.city || "인천", // city 필드에 기본값 설정
        size: req.body.size !== undefined ? String(req.body.size) : undefined, // size를 문자열로 변환
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
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "유효한 ID 목록이 필요합니다." });
      }
      
      console.log(`일괄 삭제 요청: ${type}, IDs:`, ids);
      
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
  
  const httpServer = createServer(app);
  return httpServer;
}
