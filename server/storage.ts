import { 
  properties, type Property, type InsertProperty,
  // agents 삭제됨
  inquiries, type Inquiry, type InsertInquiry,
  testimonials, type Testimonial, type InsertTestimonial,
  users, type User, type InsertUser,
  news, type News, type InsertNews,
  propertyInquiries, type PropertyInquiry, type InsertPropertyInquiry,
  favorites, type Favorite, type InsertFavorite
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, gte, lte, like, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session Store
  sessionStore: session.Store;

  // Property methods
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  getFeaturedProperties(limit?: number): Promise<Property[]>;
  getPropertiesByType(type: string): Promise<Property[]>;
  getPropertiesByDistrict(district: string): Promise<Property[]>;
  getPropertiesByPriceRange(min: number, max: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  
  // Agent methods - 제거됨
  
  // Inquiry methods
  getInquiries(): Promise<Inquiry[]>;
  getInquiry(id: number): Promise<Inquiry | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  
  // Testimonial methods - 제거됨
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // News methods
  getNews(): Promise<News[]>;
  getLatestNews(limit?: number): Promise<News[]>;
  getNewsById(id: number): Promise<News | undefined>;
  getNewsByCategory(category: string): Promise<News[]>;
  createNews(news: InsertNews): Promise<News>;
  updateNews(id: number, news: Partial<InsertNews>): Promise<News | undefined>;
  deleteNews(id: number): Promise<boolean>;
  
  // Property Inquiry methods
  getPropertyInquiries(propertyId: number): Promise<PropertyInquiry[]>;
  getPropertyInquiry(id: number): Promise<PropertyInquiry | undefined>;
  createPropertyInquiry(inquiry: InsertPropertyInquiry): Promise<PropertyInquiry>;
  updatePropertyInquiry(id: number, inquiry: Partial<InsertPropertyInquiry>): Promise<PropertyInquiry | undefined>;
  deletePropertyInquiry(id: number): Promise<boolean>;
  
  // Favorites methods
  getUserFavorites(userId: number): Promise<Favorite[]>;
  getFavoriteProperties(userId: number): Promise<Property[]>;
  isFavorite(userId: number, propertyId: number): Promise<boolean>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, propertyId: number): Promise<boolean>;
  
  // Init Data
  initializeData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // 세션 저장소 설정 (PostgreSQL) - cookie_parse, serializer 옵션 추가
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session', // 테이블 이름 명시적 지정
      schemaName: 'public', // 스키마 명시적 지정
    });
  }
  
  // Property methods
  async getProperties(): Promise<Property[]> {
    const results = await db.select().from(properties).orderBy(desc(properties.createdAt));
    
    // 호환성을 위해 각 속성에 imageUrls 필드를 추가합니다
    return results.map(property => ({
      ...property,
      imageUrls: property.imageUrls || [] // imageUrls가 null이면 빈 배열로 초기화
    }));
  }
  
  async getProperty(id: number): Promise<Property | undefined> {
    const result = await db.select().from(properties).where(eq(properties.id, id));
    
    if (!result[0]) return undefined;
    
    // 호환성을 위해 imageUrls 필드를 추가합니다
    return {
      ...result[0],
      imageUrls: result[0].imageUrls || [] // imageUrls가 null이면 빈 배열로 초기화
    };
  }
  
  async getFeaturedProperties(limit: number = 6): Promise<Property[]> {
    const results = await db.select()
      .from(properties)
      .where(eq(properties.featured, true))
      .orderBy(desc(properties.createdAt))
      .limit(limit);
      
    // 호환성을 위해 각 속성에 imageUrls 필드를 추가합니다
    return results.map(property => ({
      ...property,
      imageUrls: property.imageUrls || [] // imageUrls가 null이면 빈 배열로 초기화
    }));
  }
  
  async getPropertiesByType(type: string): Promise<Property[]> {
    const results = await db.select()
      .from(properties)
      .where(eq(properties.type, type))
      .orderBy(desc(properties.createdAt));
      
    // 호환성을 위해 각 속성에 imageUrls 필드를 추가합니다  
    return results.map(property => ({
      ...property,
      imageUrls: property.imageUrls || []
    }));
  }
  
  async getPropertiesByDistrict(district: string): Promise<Property[]> {
    const results = await db.select()
      .from(properties)
      .where(eq(properties.district, district))
      .orderBy(desc(properties.createdAt));
      
    // 호환성을 위해 각 속성에 imageUrls 필드를 추가합니다
    return results.map(property => ({
      ...property,
      imageUrls: property.imageUrls || []
    }));
  }
  
  async getPropertiesByPriceRange(min: number, max: number): Promise<Property[]> {
    const results = await db.select()
      .from(properties)
      .where(
        and(
          gte(properties.price, min.toString()),
          lte(properties.price, max.toString())
        )
      )
      .orderBy(desc(properties.createdAt));
      
    // 호환성을 위해 각 속성에 imageUrls 필드를 추가합니다
    return results.map(property => ({
      ...property,
      imageUrls: property.imageUrls || []
    }));
  }
  
  async createProperty(property: InsertProperty): Promise<Property> {
    // imageUrls 필드가 없거나 유효하지 않으면 빈 배열로 설정
    const propertyWithDefaultValues = {
      ...property,
      imageUrls: property.imageUrls || [],
      createdAt: new Date()
    };
    
    const result = await db.insert(properties)
      .values(propertyWithDefaultValues)
      .returning();
    
    // 호환성을 위해 imageUrls 필드가 있는지 확인
    return {
      ...result[0],
      imageUrls: result[0].imageUrls || []
    };
  }
  
  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const result = await db.update(properties)
      .set(property)
      .where(eq(properties.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteProperty(id: number): Promise<boolean> {
    const result = await db.delete(properties)
      .where(eq(properties.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Agent methods - 제거됨
  
  // Inquiry methods
  async getInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  }
  
  async getInquiry(id: number): Promise<Inquiry | undefined> {
    const result = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return result[0];
  }
  
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const result = await db.insert(inquiries)
      .values({
        ...inquiry,
        createdAt: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  // Testimonial methods - 제거됨
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users)
      .values({
        ...insertUser,
        role: insertUser.role || "user"
      })
      .returning();
    
    return result[0];
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users)
      .where(eq(users.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // News methods
  async getNews(): Promise<News[]> {
    try {
      return await db.select().from(news).orderBy(desc(news.createdAt));
    } catch (error) {
      console.error("Error fetching news:", error);
      return [];
    }
  }
  
  async getLatestNews(limit: number = 6): Promise<News[]> {
    try {
      return await db.select()
        .from(news)
        .orderBy(desc(news.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error fetching latest news:", error);
      return [];
    }
  }
  
  async getNewsById(id: number): Promise<News | undefined> {
    try {
      const result = await db.select().from(news).where(eq(news.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching news by id:", error);
      return undefined;
    }
  }
  
  async getNewsByCategory(category: string): Promise<News[]> {
    try {
      return await db.select()
        .from(news)
        .where(eq(news.category, category))
        .orderBy(desc(news.createdAt));
    } catch (error) {
      console.error("Error fetching news by category:", error);
      return [];
    }
  }
  
  async createNews(newsItem: InsertNews): Promise<News> {
    try {
      const result = await db.insert(news)
        .values({
          ...newsItem,
          createdAt: new Date()
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating news:", error);
      throw error;
    }
  }
  
  async updateNews(id: number, newsItem: Partial<InsertNews>): Promise<News | undefined> {
    try {
      const result = await db.update(news)
        .set(newsItem)
        .where(eq(news.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating news:", error);
      return undefined;
    }
  }
  
  async deleteNews(id: number): Promise<boolean> {
    try {
      const result = await db.delete(news)
        .where(eq(news.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting news:", error);
      return false;
    }
  }
  
  // 초기 데이터 설정
  async initializeData(): Promise<void> {
    // 관리자 계정 생성
    const adminUser = await this.getUserByUsername("admin");
    if (!adminUser) {
      await this.createUser({
        username: "admin",
        password: await hashPassword("adminpass"),
        role: "admin"
      });
      
      // 일반 사용자 계정 생성
      await this.createUser({
        username: "user",
        password: await hashPassword("userpass"),
        role: "user"
      });
      
      // 중개사 데이터 - 제거됨
      
      // 부동산 데이터
      const properties: InsertProperty[] = [
        {
          title: "강남 푸르지오 아파트",
          description: "넓은 공간과 현대적인 인테리어를 갖춘 강남 푸르지오 아파트입니다. 역삼역에서 도보 5분 거리에 위치하여 교통이 매우 편리하며, 인근에 상업시설과 학교가 있어 생활환경이 좋습니다.",
          type: "아파트",
          price: "950000000",
          address: "서울시 강남구 역삼동 123-45",
          district: "강남구",
          size: "84.12",
          bedrooms: 3,
          bathrooms: 2,
          imageUrl: "https://images.unsplash.com/photo-1592595896616-c37162298647?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
          featured: true
        },
        {
          title: "서초구 단독주택",
          description: "서초구 방배동에 위치한 고급 단독주택입니다. 넓은 정원과 현대적인 인테리어가 특징이며, 조용한 주택가에 위치하여 편안한 주거환경을 제공합니다.",
          type: "주택",
          price: "1580000000",
          address: "서울시 서초구 방배동 456-78",
          district: "서초구",
          size: "165.3",
          bedrooms: 4,
          bathrooms: 3,
          imageUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
          featured: true
        },
        {
          title: "마포구 오피스텔",
          description: "홍대입구역 인근에 위치한 신축 오피스텔입니다. 효율적인 공간 활용과 세련된 디자인이 돋보이며, 월세 수익률이 높아 투자 가치가 높습니다.",
          type: "오피스텔",
          price: "320000000",
          address: "서울시 마포구 서교동 789-12",
          district: "마포구",
          size: "45.9",
          bedrooms: 1,
          bathrooms: 1,
          imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
          featured: true
        },
        {
          title: "용산구 래미안 아파트",
          description: "한강 조망이 가능한 용산구 래미안 아파트입니다. 한남동에 위치하여 접근성이 좋으며, 다양한 편의시설과 쾌적한 환경을 제공합니다.",
          type: "아파트",
          price: "1230000000",
          address: "서울시 용산구 한남동 101-23",
          district: "용산구",
          size: "109.5",
          bedrooms: 4,
          bathrooms: 2,
          imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
          featured: true
        },
        {
          title: "성북구 한옥 빌라",
          description: "전통적 한옥 스타일을 현대적으로 재해석한 성북구 한옥 빌라입니다. 조용한 주거환경과 함께 전통미와 현대적 편의성을 동시에 누릴 수 있습니다.",
          type: "빌라",
          price: "750000000",
          address: "서울시 성북구 성북동 345-67",
          district: "성북구",
          size: "92.7",
          bedrooms: 3,
          bathrooms: 2,
          imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
          featured: true
        },
        {
          title: "송파구 롯데캐슬 펜트하우스",
          description: "송파구 잠실동에 위치한 롯데캐슬 펜트하우스입니다. 탁트인 전망과 고급스러운 인테리어가 특징이며, 최상의 주거 환경을 제공합니다.",
          type: "펜트하우스",
          price: "2500000000",
          address: "서울시 송파구 잠실동 678-90",
          district: "송파구",
          size: "198.3",
          bedrooms: 5,
          bathrooms: 3,
          imageUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
          featured: true
        }
      ];
      
      for (const property of properties) {
        await this.createProperty(property);
      }
      
      // 후기 데이터
      const testimonials: InsertTestimonial[] = [
        {
          name: "박서연",
          description: "강남구 아파트 구매",
          message: "한국부동산을 통해 꿈에 그리던 집을 찾았습니다. 김지영 중개사님의 친절하고 전문적인 안내 덕분에 복잡한 계약 과정도 너무 수월했어요."
        },
        {
          name: "최준호",
          description: "마포구 오피스텔 구매",
          message: "처음 집을 구매하는 과정이라 걱정이 많았는데, 이민호 대표님이 세세하게 조언해주셔서 안심하고 계약할 수 있었습니다. 추천합니다!"
        },
        {
          name: "김미영",
          description: "서초구 주택 임대",
          message: "다른 부동산과 달리 투명한 정보 제공과 빠른 답변이 인상적이었습니다. 덕분에 좋은 조건으로 계약할 수 있었어요. 감사합니다!"
        }
      ];
      
      for (const testimonial of testimonials) {
        await this.createTestimonial(testimonial);
      }
      
      // 뉴스 데이터
      const newsItems: InsertNews[] = [
        {
          title: "인천시, 강화군 지역 부동산 개발 계획 발표",
          summary: "인천시가 강화군 지역 부동산 개발을 위한 새로운 계획을 발표했습니다.",
          description: "인천광역시가 강화군 지역 발전을 위한 대규모 부동산 개발 계획을 발표했습니다. 이번 계획은 지역 경제 활성화와 관광객 유치에 중점을 두고 있습니다.",
          content: "인천광역시는 오늘 강화군 지역 발전을 위한 새로운 부동산 개발 계획을 발표했습니다. 이 계획에 따르면 강화군 내 유휴 부지를 활용한 복합 문화 공간과 관광 시설이 들어설 예정입니다.\n\n시 관계자는 \"이번 개발을 통해 강화군의 관광 인프라를 확충하고 지역 경제에 활력을 불어넣을 것\"이라고 밝혔습니다. 총 사업비는 약 2,000억원으로 예상되며, 2026년까지 단계적으로 진행될 예정입니다.\n\n특히 강화읍 일대에는 전통 한옥 스타일의 숙박 시설과 문화 체험 공간이 조성되어 역사 관광과 연계된 개발이 이루어질 계획입니다.",
          source: "인천일보",
          sourceUrl: "https://www.incheonilbo.com",
          url: "https://www.incheonilbo.com/news/article/property-development-plan",
          imageUrl: "https://images.unsplash.com/photo-1460317442991-0ec209397118?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
          category: "인천 부동산",
          isPinned: true
        },
        {
          title: "강화도 부동산 시장 동향: 전년 대비 거래량 15% 증가",
          summary: "강화도 지역 부동산 거래량이 전년 동기 대비 15% 증가한 것으로 나타났습니다.",
          description: "최근 발표된 부동산 통계에 따르면 강화도 지역의 부동산 거래량이 전년 동기 대비 15% 증가했습니다. 특히 단독주택과 토지 거래가 크게 늘어난 것으로 조사되었습니다.",
          content: "한국부동산원이 발표한 최근 통계에 따르면, 강화도 지역의 부동산 거래량이 전년 동기 대비 15% 증가한 것으로 나타났습니다. 특히 단독주택과 토지 거래가 각각 22%, 18% 증가하며 전체 거래량 상승을 이끌었습니다.\n\n전문가들은 이러한 증가세의 배경으로 코로나19 이후 교외 주거 선호도 증가와 강화도의 개발 호재가 복합적으로 작용했다고 분석합니다.\n\n또한 정부의 규제 완화 정책과 금리 인하 기조도 거래량 증가에 영향을 미친 것으로 보입니다. 부동산 업계 관계자들은 \"강화도는 수도권과의 접근성이 개선되고 있고, 자연환경이 우수해 실거주 목적의 매수세가 꾸준히 유입되고 있다\"고 설명했습니다.",
          source: "부동산 뉴스",
          sourceUrl: "https://www.realestate-news.kr",
          url: "https://www.realestate-news.kr/news/article/ganghwa-property-trend",
          imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
          category: "강화군 부동산",
          isPinned: false
        },
        {
          title: "국토부, 부동산 정책 방향 재설정...규제 완화 기조 유지",
          summary: "국토교통부가 부동산 시장 안정을 위한 새로운 정책 방향을 발표했습니다.",
          description: "국토교통부가 부동산 시장 안정과 거래 활성화를 위한 새로운 정책 방향을 발표했습니다. 기존의 규제 완화 기조를 유지하면서 실수요자 중심의 정책을 강화할 예정입니다.",
          content: "국토교통부는 어제 부동산 시장 안정과 거래 활성화를 위한 새로운 정책 방향을 발표했습니다. 이번 발표에 따르면, 정부는 기존의 규제 완화 기조를 유지하면서도 실수요자 중심의 정책을 더욱 강화할 예정입니다.\n\n주요 내용으로는 1) 생애 첫 주택 구매자에 대한 금융 지원 확대, 2) 재건축·재개발 절차 간소화, 3) 공공주택 공급 확대 등이 포함되었습니다.\n\n국토부 관계자는 \"부동산 시장이 점차 안정을 찾아가고 있으나, 여전히 실수요자들의 내 집 마련 부담은 높은 상황\"이라며 \"이번 정책을 통해 실수요자 중심의 시장 형성을 유도할 것\"이라고 밝혔습니다.\n\n전문가들은 이번 정책이 단기적으로는 시장에 긍정적 영향을 줄 수 있지만, 장기적인 시장 안정을 위해서는 공급 물량 확대가 관건이라고 지적하고 있습니다.",
          source: "국토교통부",
          sourceUrl: "https://www.molit.go.kr",
          url: "https://www.molit.go.kr/news/article/property-policy-direction",
          imageUrl: "https://images.unsplash.com/photo-1592595896616-c37162298647?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
          category: "부동산 정책",
          isPinned: false
        },
        {
          title: "강화군, 친환경 스마트시티 조성 추진",
          summary: "강화군이 지역 활성화를 위한 친환경 스마트시티 조성 계획을 발표했습니다.",
          description: "강화군이 지역 경제 활성화와 미래 성장 동력 확보를 위한 친환경 스마트시티 조성 계획을 발표했습니다. 2027년까지 약 3,000억원이 투입될 예정입니다.",
          content: "강화군은 지난 25일 지역 경제 활성화와 미래 성장 동력 확보를 위한 '강화 그린 스마트시티' 조성 계획을 발표했습니다. 이 계획에 따르면 강화읍 일대 약 50만㎡ 부지에 친환경 주거단지와 스마트 농업 단지, 관광 인프라가 조성됩니다.\n\n총 사업비는 약 3,000억원으로, 2023년부터 2027년까지 단계적으로 진행될 예정입니다. 특히 재생에너지를 활용한 에너지 자립형 주거 환경과 IoT 기술을 접목한 스마트팜 단지가 핵심 사업으로 추진됩니다.\n\n강화군 관계자는 \"이번 사업을 통해 강화군을 수도권의 대표적인 친환경 미래 도시로 발전시키고, 청년층의 유입과 일자리 창출 효과도 기대하고 있다\"고 밝혔습니다.\n\n부동산 전문가들은 이번 계획이 실현될 경우 강화 지역의 부동산 가치 상승과 지역 경제 활성화에 긍정적인 영향을 미칠 것으로 전망하고 있습니다.",
          source: "강화군청",
          sourceUrl: "https://www.ganghwa.go.kr",
          url: "https://www.ganghwa.go.kr/news/article/smart-city-plan",
          imageUrl: "https://images.unsplash.com/photo-1542889601-399c4f3a8402?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
          category: "강화군 부동산",
          isPinned: true
        },
        {
          title: "인천 지역 아파트 매매가 6개월 연속 상승세",
          summary: "인천 지역 아파트 매매가격이 6개월 연속 상승세를 이어가고 있습니다.",
          description: "한국부동산원 통계에 따르면 인천 지역 아파트 매매가격이 6개월 연속 상승세를 기록했습니다. 특히 송도, 청라 지역의 상승폭이 두드러진 것으로 나타났습니다.",
          content: "한국부동산원이 발표한 최근 주간 아파트 가격 동향에 따르면, 인천 지역 아파트 매매가격이 6개월 연속 상승세를 기록하고 있습니다. 지난달 기준 인천 아파트 매매가격은 전월 대비 0.38% 상승했으며, 특히 송도와 청라 지역은 각각 0.62%, 0.57%로 상승폭이 더 컸습니다.\n\n이러한 상승세의 배경으로는 정부의 규제 완화 정책과 GTX 등 교통 인프라 개선 기대감, 상대적으로 서울보다 저렴한 가격대 등이 복합적으로 작용한 것으로 분석됩니다.\n\n부동산 전문가들은 \"인천은 서울에 비해 가격 메리트가 있고, 교통 개선과 신도시 개발 등 호재가 많아 당분간 상승세가 이어질 가능성이 높다\"고 전망했습니다.\n\n다만 일부 전문가들은 금리 인상과 경기 침체 우려 등 대외 변수가 있어 하반기에는 상승폭이 제한될 수 있다고 조심스럽게 전망하고 있습니다.",
          source: "인천경제",
          sourceUrl: "https://www.incheoneconomy.com",
          url: "https://www.incheoneconomy.com/news/article/apartment-price-trend",
          imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
          category: "인천 부동산",
          isPinned: false
        },
        {
          title: "정부, 농어촌 빈집 활용 지원사업 예산 확대",
          summary: "농림축산식품부가 농어촌 빈집 활용 지원사업 예산을 전년 대비 30% 확대했습니다.",
          description: "농림축산식품부가 농어촌 지역 빈집 활용을 위한 지원사업 예산을 전년 대비 30% 확대했습니다. 강화군을 비롯한 농어촌 지역의 주거환경 개선과 관광자원화를 추진합니다.",
          content: "농림축산식품부는 농어촌 지역 빈집 활용을 위한 지원사업 예산을 전년 대비 30% 확대한 650억원으로 편성했다고 밝혔습니다. 이 사업은 농어촌 지역의 빈집을 리모델링하여 주거환경을 개선하고 관광자원으로 활용하는 것을 목표로 합니다.\n\n특히 강화군과 같은 수도권 인접 농어촌 지역은 우선 지원 대상으로 선정되었으며, 빈집을 활용한 게스트하우스, 농촌체험시설, 청년 창업 공간 등 다양한 용도로의 전환을 지원합니다.\n\n농식품부 관계자는 \"이번 사업을 통해 농어촌 지역의 빈집 문제를 해결하고, 동시에 지역 경제 활성화와 인구 유입 효과도 기대하고 있다\"고 설명했습니다.\n\n강화군 관계자는 \"강화도 내 노후 빈집을 활용한 특색있는 관광 숙박시설과 문화공간을 조성할 계획\"이라며, \"이를 통해 강화도의 관광 경쟁력을 높이고 농촌 지역의 새로운 가치를 창출할 것\"이라고 밝혔습니다.",
          source: "농림축산식품부",
          sourceUrl: "https://www.mafra.go.kr",
          url: "https://www.mafra.go.kr/news/article/rural-empty-houses",
          imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
          category: "부동산 정책",
          isPinned: false
        }
      ];
      
      for (const newsItem of newsItems) {
        await this.createNews(newsItem);
      }
    }
  }
  
  // Property Inquiry methods
  async getPropertyInquiries(propertyId: number): Promise<(PropertyInquiry & { authorUsername?: string })[]> {
    try {
      const inquiries = await db
        .select({
          id: propertyInquiries.id,
          propertyId: propertyInquiries.propertyId,
          userId: propertyInquiries.userId,
          title: propertyInquiries.title,
          content: propertyInquiries.content,
          isReply: propertyInquiries.isReply,
          parentId: propertyInquiries.parentId,
          createdAt: propertyInquiries.createdAt,
          authorUsername: users.username
        })
        .from(propertyInquiries)
        .leftJoin(users, eq(propertyInquiries.userId, users.id))
        .where(eq(propertyInquiries.propertyId, propertyId))
        .orderBy(desc(propertyInquiries.createdAt));
      return inquiries as (PropertyInquiry & { authorUsername?: string })[];
    } catch (error) {
      console.error("Error getting property inquiries:", error);
      return [];
    }
  }

  async getPropertyInquiry(id: number): Promise<PropertyInquiry | undefined> {
    try {
      const [inquiry] = await db
        .select()
        .from(propertyInquiries)
        .where(eq(propertyInquiries.id, id));
      return inquiry;
    } catch (error) {
      console.error("Error getting property inquiry:", error);
      return undefined;
    }
  }

  async createPropertyInquiry(inquiry: InsertPropertyInquiry): Promise<PropertyInquiry> {
    try {
      const [createdInquiry] = await db
        .insert(propertyInquiries)
        .values(inquiry)
        .returning();
      return createdInquiry;
    } catch (error) {
      console.error("Error creating property inquiry:", error);
      throw new Error("Failed to create property inquiry");
    }
  }

  async updatePropertyInquiry(
    id: number,
    inquiry: Partial<InsertPropertyInquiry>
  ): Promise<PropertyInquiry | undefined> {
    try {
      const [updatedInquiry] = await db
        .update(propertyInquiries)
        .set(inquiry)
        .where(eq(propertyInquiries.id, id))
        .returning();
      return updatedInquiry;
    } catch (error) {
      console.error("Error updating property inquiry:", error);
      return undefined;
    }
  }

  async deletePropertyInquiry(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(propertyInquiries)
        .where(eq(propertyInquiries.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting property inquiry:", error);
      return false;
    }
  }

  // 관심 매물 (Favorites) 메서드
  async getUserFavorites(userId: number): Promise<Favorite[]> {
    try {
      return await db.select()
        .from(favorites)
        .where(eq(favorites.userId, userId))
        .orderBy(desc(favorites.createdAt));
    } catch (error) {
      console.error("Error fetching user favorites:", error);
      return [];
    }
  }
  
  async getFavoriteProperties(userId: number): Promise<Property[]> {
    try {
      const favs = await db.select({
          propertyId: favorites.propertyId
        })
        .from(favorites)
        .where(eq(favorites.userId, userId));
      
      if (favs.length === 0) return [];
      
      const propertyIds = favs.map(f => f.propertyId);
      
      const results = await db.select()
        .from(properties)
        .where(inArray(properties.id, propertyIds));
      
      // 호환성을 위한 imageUrls 처리
      return results.map(property => ({
        ...property,
        imageUrls: property.imageUrls || []
      }));
    } catch (error) {
      console.error("Error fetching favorite properties:", error);
      return [];
    }
  }
  
  async isFavorite(userId: number, propertyId: number): Promise<boolean> {
    try {
      const result = await db.select()
        .from(favorites)
        .where(and(
          eq(favorites.userId, userId),
          eq(favorites.propertyId, propertyId)
        ));
      
      return result.length > 0;
    } catch (error) {
      console.error("Error checking if property is favorite:", error);
      return false;
    }
  }
  
  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    try {
      // 이미 존재하는지 확인
      const existing = await this.isFavorite(favorite.userId, favorite.propertyId);
      if (existing) {
        throw new Error("이미 관심 매물로 등록되어 있습니다.");
      }
      
      const result = await db.insert(favorites)
        .values({
          ...favorite,
          createdAt: new Date()
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error adding favorite:", error);
      throw error;
    }
  }
  
  async removeFavorite(userId: number, propertyId: number): Promise<boolean> {
    try {
      const result = await db.delete(favorites)
        .where(and(
          eq(favorites.userId, userId),
          eq(favorites.propertyId, propertyId)
        ))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error removing favorite:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();