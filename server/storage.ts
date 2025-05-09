import { 
  properties, type Property, type InsertProperty,
  agents, type Agent, type InsertAgent,
  inquiries, type Inquiry, type InsertInquiry,
  testimonials, type Testimonial, type InsertTestimonial,
  users, type User, type InsertUser
} from "@shared/schema";

export interface IStorage {
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
  
  // Agent methods
  getAgents(): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, agent: Partial<InsertAgent>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<boolean>;
  
  // Inquiry methods
  getInquiries(): Promise<Inquiry[]>;
  getInquiry(id: number): Promise<Inquiry | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  
  // Testimonial methods
  getTestimonials(): Promise<Testimonial[]>;
  getTestimonial(id: number): Promise<Testimonial | undefined>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private properties: Map<number, Property>;
  private agents: Map<number, Agent>;
  private inquiries: Map<number, Inquiry>;
  private testimonials: Map<number, Testimonial>;
  private users: Map<number, User>;
  
  private propertyCurrentId: number;
  private agentCurrentId: number;
  private inquiryCurrentId: number;
  private testimonialCurrentId: number;
  private userCurrentId: number;
  
  constructor() {
    this.properties = new Map();
    this.agents = new Map();
    this.inquiries = new Map();
    this.testimonials = new Map();
    this.users = new Map();
    
    this.propertyCurrentId = 1;
    this.agentCurrentId = 1;
    this.inquiryCurrentId = 1;
    this.testimonialCurrentId = 1;
    this.userCurrentId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  // Property methods
  async getProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }
  
  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }
  
  async getFeaturedProperties(limit: number = 6): Promise<Property[]> {
    return Array.from(this.properties.values())
      .filter(property => property.featured)
      .slice(0, limit);
  }
  
  async getPropertiesByType(type: string): Promise<Property[]> {
    return Array.from(this.properties.values())
      .filter(property => property.type === type);
  }
  
  async getPropertiesByDistrict(district: string): Promise<Property[]> {
    return Array.from(this.properties.values())
      .filter(property => property.district === district);
  }
  
  async getPropertiesByPriceRange(min: number, max: number): Promise<Property[]> {
    return Array.from(this.properties.values())
      .filter(property => {
        const price = Number(property.price);
        return price >= min && price <= max;
      });
  }
  
  async createProperty(property: InsertProperty): Promise<Property> {
    const id = this.propertyCurrentId++;
    const now = new Date();
    const newProperty: Property = { 
      ...property, 
      id, 
      createdAt: now,
      featured: property.featured ?? null
    };
    this.properties.set(id, newProperty);
    return newProperty;
  }
  
  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const existingProperty = this.properties.get(id);
    if (!existingProperty) return undefined;
    
    const updatedProperty = { ...existingProperty, ...property };
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }
  
  async deleteProperty(id: number): Promise<boolean> {
    return this.properties.delete(id);
  }
  
  // Agent methods
  async getAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }
  
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }
  
  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = this.agentCurrentId++;
    const now = new Date();
    const newAgent: Agent = { 
      ...agent, 
      id, 
      createdAt: now 
    };
    this.agents.set(id, newAgent);
    return newAgent;
  }
  
  async updateAgent(id: number, agent: Partial<InsertAgent>): Promise<Agent | undefined> {
    const existingAgent = this.agents.get(id);
    if (!existingAgent) return undefined;
    
    const updatedAgent = { ...existingAgent, ...agent };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }
  
  async deleteAgent(id: number): Promise<boolean> {
    return this.agents.delete(id);
  }
  
  // Inquiry methods
  async getInquiries(): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values());
  }
  
  async getInquiry(id: number): Promise<Inquiry | undefined> {
    return this.inquiries.get(id);
  }
  
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const id = this.inquiryCurrentId++;
    const now = new Date();
    const newInquiry: Inquiry = { 
      ...inquiry, 
      id, 
      createdAt: now,
      propertyId: inquiry.propertyId ?? null
    };
    this.inquiries.set(id, newInquiry);
    return newInquiry;
  }
  
  // Testimonial methods
  async getTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values());
  }
  
  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    return this.testimonials.get(id);
  }
  
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const id = this.testimonialCurrentId++;
    const now = new Date();
    const newTestimonial: Testimonial = { 
      ...testimonial, 
      id, 
      createdAt: now 
    };
    this.testimonials.set(id, newTestimonial);
    return newTestimonial;
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "user" // 기본값으로 user 역할 설정
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  // Initialize with sample data
  private initializeSampleData() {
    // 관리자 계정 생성
    this.createUser({
      username: "admin",
      password: "adminpass", // 실제 환경에서는 보안을 위해 더 복잡한 비밀번호 사용
      role: "admin"
    });
    
    // 일반 사용자 계정 생성
    this.createUser({
      username: "user",
      password: "userpass",
      role: "user"
    });
    
    // Sample Agents
    const agents: InsertAgent[] = [
      {
        name: "김지영",
        title: "선임 중개사",
        description: "강남, 서초 지역 10년 경력의 아파트 전문가",
        email: "jiyoung.kim@korearealty.kr",
        phone: "010-1234-5678",
        imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=1000",
        specialization: "아파트",
      },
      {
        name: "이민호",
        title: "대표 중개사",
        description: "15년 경력의 주택 및 빌라 전문가",
        email: "minho.lee@korearealty.kr",
        phone: "010-2345-6789",
        imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=1000",
        specialization: "주택,빌라",
      },
      {
        name: "박수진",
        title: "선임 중개사",
        description: "마포, 용산 지역 8년 경력의 오피스텔 전문가",
        email: "sujin.park@korearealty.kr",
        phone: "010-3456-7890",
        imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=1000",
        specialization: "오피스텔",
      },
      {
        name: "정현우",
        title: "상담 중개사",
        description: "송파, 강동 지역 5년 경력의 투자 전문가",
        email: "hyunwoo.jung@korearealty.kr",
        phone: "010-4567-8901",
        imageUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=1000",
        specialization: "투자,아파트",
      }
    ];
    
    agents.forEach(agent => {
      this.createAgent(agent);
    });
    
    // Sample Properties
    const properties: InsertProperty[] = [
      {
        title: "강남 푸르지오 아파트",
        description: "넓은 공간과 현대적인 인테리어를 갖춘 강남 푸르지오 아파트입니다. 역삼역에서 도보 5분 거리에 위치하여 교통이 매우 편리하며, 인근에 상업시설과 학교가 있어 생활환경이 좋습니다.",
        type: "아파트",
        price: "950000000",
        address: "서울시 강남구 역삼동 123-45",
        city: "서울",
        district: "강남구",
        size: "84.12",
        bedrooms: 3,
        bathrooms: 2,
        imageUrl: "https://images.unsplash.com/photo-1592595896616-c37162298647?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
        agentId: 1,
        featured: true
      },
      {
        title: "서초구 단독주택",
        description: "서초구 방배동에 위치한 고급 단독주택입니다. 넓은 정원과 현대적인 인테리어가 특징이며, 조용한 주택가에 위치하여 편안한 주거환경을 제공합니다.",
        type: "주택",
        price: "1580000000",
        address: "서울시 서초구 방배동 456-78",
        city: "서울",
        district: "서초구",
        size: "165.3",
        bedrooms: 4,
        bathrooms: 3,
        imageUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
        agentId: 2,
        featured: true
      },
      {
        title: "마포구 오피스텔",
        description: "홍대입구역 인근에 위치한 신축 오피스텔입니다. 효율적인 공간 활용과 세련된 디자인이 돋보이며, 월세 수익률이 높아 투자 가치가 높습니다.",
        type: "오피스텔",
        price: "320000000",
        address: "서울시 마포구 서교동 789-12",
        city: "서울",
        district: "마포구",
        size: "45.9",
        bedrooms: 1,
        bathrooms: 1,
        imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
        agentId: 3,
        featured: true
      },
      {
        title: "용산구 래미안 아파트",
        description: "한강 조망이 가능한 용산구 래미안 아파트입니다. 한남동에 위치하여 접근성이 좋으며, 다양한 편의시설과 쾌적한 환경을 제공합니다.",
        type: "아파트",
        price: "1230000000",
        address: "서울시 용산구 한남동 101-23",
        city: "서울",
        district: "용산구",
        size: "109.5",
        bedrooms: 4,
        bathrooms: 2,
        imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
        agentId: 4,
        featured: true
      },
      {
        title: "성북구 한옥 빌라",
        description: "전통적 한옥 스타일을 현대적으로 재해석한 성북구 한옥 빌라입니다. 조용한 주거환경과 함께 전통미와 현대적 편의성을 동시에 누릴 수 있습니다.",
        type: "빌라",
        price: "750000000",
        address: "서울시 성북구 성북동 345-67",
        city: "서울",
        district: "성북구",
        size: "92.7",
        bedrooms: 3,
        bathrooms: 2,
        imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
        agentId: 2,
        featured: true
      },
      {
        title: "송파구 롯데캐슬 펜트하우스",
        description: "송파구 잠실동에 위치한 롯데캐슬 펜트하우스입니다. 탁트인 전망과 고급스러운 인테리어가 특징이며, 최상의 주거 환경을 제공합니다.",
        type: "펜트하우스",
        price: "2500000000",
        address: "서울시 송파구 잠실동 678-90",
        city: "서울",
        district: "송파구",
        size: "198.3",
        bedrooms: 5,
        bathrooms: 3,
        imageUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
        agentId: 4,
        featured: true
      }
    ];
    
    properties.forEach(property => {
      this.createProperty(property);
    });
    
    // Sample Testimonials
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
    
    testimonials.forEach(testimonial => {
      this.createTestimonial(testimonial);
    });
  }
}

export const storage = new MemStorage();
