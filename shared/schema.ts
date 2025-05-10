import { pgTable, text, serial, integer, boolean, numeric, timestamp, varchar, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Property schema - Matched to existing database structure
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 토지, 주택, 아파트연립다세대, 원투룸, 상가공장창고펜션
  price: numeric("price").notNull(), // 매매가
  address: text("address").notNull(), // 주소
  city: text("city").notNull(), // 도시
  district: text("district").notNull(), // 읍면동 (ex: 강화읍 갑곳리, 강화읍 관청리 등)
  size: numeric("size").notNull(), // 면적(㎡)
  bedrooms: integer("bedrooms").notNull(), // 방 개수
  bathrooms: integer("bathrooms").notNull(), // 화장실 개수
  imageUrl: text("image_url").notNull(), // 단일 이미지 URL (하위 호환성 유지)
  imageUrls: text("image_urls").array(), // 다중 이미지 URLs
  agentId: integer("agent_id").notNull(), // 담당 중개사 ID
  featured: boolean("featured").default(false), // 추천 매물 여부
  createdAt: timestamp("created_at").defaultNow(), // 등록일
  
  // 위치 정보 - 아래 필드들은 추가 필드로서 나중에 migrate 시킬 예정
  buildingName: text("building_name"), // 건물명
  unitNumber: text("unit_number"), // 동호수
  
  // 면적 정보
  supplyArea: numeric("supply_area"), // 공급(평)
  privateArea: numeric("private_area"), // 전용(평)
  areaSize: text("area_size"), // 평형
  
  // 건물 정보
  floor: integer("floor"), // 층수
  totalFloors: integer("total_floors"), // 총층
  direction: text("direction"), // 방향
  elevator: boolean("elevator"), // 승강기유무
  parking: text("parking"), // 주차
  heatingSystem: text("heating_system"), // 난방방식
  approvalDate: text("approval_date"), // 사용승인
  
  // 금액 정보
  dealType: text("deal_type").array(), // 거래종류 (매매, 전세, 월세, 완료, 보류중) - 다중선택
  deposit: numeric("deposit"), // 전세금/보증금
  monthlyRent: numeric("monthly_rent"), // 월세
  maintenanceFee: numeric("maintenance_fee"), // 관리비
  
  // 연락처 정보
  ownerName: text("owner_name"), // a소유자
  ownerPhone: text("owner_phone"), // 소유자 전화
  tenantName: text("tenant_name"), // 임차인
  tenantPhone: text("tenant_phone"), // 임차인 전화
  clientName: text("client_name"), // 의뢰인
  clientPhone: text("client_phone"), // 의뢰인 전화
  
  // 추가 정보
  specialNote: text("special_note"), // 특이사항
  coListing: boolean("co_listing").default(false), // 공동중개
  propertyDescription: text("property_description"), // 매물설명
  privateNote: text("private_note"), // 비공개메모
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
});

// Agent schema
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  imageUrl: text("image_url").notNull(),
  specialization: text("specialization").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
});

// Inquiry schema
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  inquiryType: text("inquiry_type").notNull(),
  propertyId: integer("property_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
});

// Testimonial schema
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
});

// User schema for basic login - keeping the original users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").default("user").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phone: true,
  role: true,
});

// Type definitions
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// News schema
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(), // 뉴스 요약
  description: text("description").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull(),
  sourceUrl: text("source_url").notNull(),
  url: text("url").notNull(), // 원본 뉴스 URL
  imageUrl: text("image_url"),
  category: text("category").notNull(), // "인천 부동산", "강화군 부동산", "부동산 정책", "국토교통부"
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNewsSchema = createInsertSchema(news).omit({
  id: true,
  createdAt: true,
});

export type News = typeof news.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;

// Property inquiry board schema (전방 선언)
export const propertyInquiries = pgTable("property_inquiries", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isReply: boolean("is_reply").default(false).notNull(),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPropertyInquirySchema = createInsertSchema(propertyInquiries).omit({
  id: true,
  createdAt: true,
});

export type PropertyInquiry = typeof propertyInquiries.$inferSelect;
export type InsertPropertyInquiry = z.infer<typeof insertPropertyInquirySchema>;

// Session schema (for connect-pg-simple)
// Removed schema mapping from Drizzle to avoid conflicts with connect-pg-simple's own schema
