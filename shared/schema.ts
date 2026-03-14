import { sqliteTable, text, integer, numeric } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Property schema - Matched to SQLite and Form structure
export const properties = sqliteTable("properties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 토지, 주택, 아파트연립다세대, 원투룸, 상가공장창고펜션
  price: text("price").notNull(), // SQLite에 TEXT로 저장된 매매가 (Numeric 호환)
  address: text("address").notNull(), // 주소
  district: text("district").notNull(), // 읍면동리
  size: text("size").notNull(), // 면적(㎡)
  bedrooms: integer("bedrooms").notNull(), // 방 개수
  bathrooms: integer("bathrooms").notNull(), // 화장실 개수
  imageUrl: text("image_url").notNull(), // 단일 이미지 URL
  imageUrls: text("image_urls"), // SQLite는 배열 지원 안함 -> JSON string으로 처리 (storage.ts에서 파싱)
  featuredImageIndex: integer("featured_image_index"),
  agentId: integer("agent_id").notNull(),
  featured: integer("featured", { mode: 'boolean' }).default(false),
  displayOrder: integer("display_order").default(0),
  isVisible: integer("is_visible", { mode: 'boolean' }).default(true),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"), // SQLite는 timestamp 대신 text/integer
  
  // 위치 정보
  buildingName: text("building_name"),
  unitNumber: text("unit_number"),
  
  // 면적 정보
  supplyArea: text("supply_area"),
  privateArea: text("private_area"),
  areaSize: text("area_size"),
  
  // 건물 정보
  floor: integer("floor"),
  totalFloors: integer("total_floors"),
  direction: text("direction"),
  elevator: integer("elevator", { mode: 'boolean' }),
  parking: text("parking"),
  heatingSystem: text("heating_system"),
  approvalDate: text("approval_date"),
  
  // 토지 정보
  landType: text("land_type"),
  zoneType: text("zone_type"),
  
  // 금액 정보
  dealType: text("deal_type"), // JSON string
  deposit: text("deposit"),
  depositAmount: text("deposit_amount"),
  monthlyRent: text("monthly_rent"),
  maintenanceFee: text("maintenance_fee"),
  
  // 연락처 정보
  ownerName: text("owner_name"),
  ownerPhone: text("owner_phone"),
  tenantName: text("tenant_name"),
  tenantPhone: text("tenant_phone"),
  clientName: text("client_name"),
  clientPhone: text("client_phone"),
  
  // 추가 정보
  specialNote: text("special_note"),
  coListing: integer("co_listing", { mode: 'boolean' }).default(false),
  agentName: text("agent_name"),
  propertyDescription: text("property_description"),
  privateNote: text("private_note"),
  youtubeUrl: text("youtube_url"),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
}).extend({
  price: z.union([z.string(), z.number()]).optional().transform(val => val === "" || val === undefined || val === null ? "0" : String(val)),
});

// Agent schema
export const agents = sqliteTable("agents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  position: text("position"),
  photo: text("photo"),
  bio: text("bio"),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;

// Inquiry schema
export const inquiries = sqliteTable("inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  inquiryType: text("inquiry_type").notNull(),
  propertyId: integer("property_id"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
});

// User schema
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// News schema
export const news = sqliteTable("news", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull(),
  sourceUrl: text("source_url").notNull(),
  url: text("url").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  isPinned: integer("is_pinned", { mode: 'boolean' }).default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const insertNewsSchema = createInsertSchema(news).omit({
  id: true,
  createdAt: true,
});

export type News = typeof news.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;

// Property inquiry board schema
export const propertyInquiries = sqliteTable("property_inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isReply: integer("is_reply", { mode: 'boolean' }).default(false).notNull(),
  parentId: integer("parent_id"),
  isReadByAdmin: integer("is_read_by_admin", { mode: 'boolean' }).default(false).notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const insertPropertyInquirySchema = createInsertSchema(propertyInquiries).omit({
  id: true,
  createdAt: true,
});

export type PropertyInquiry = typeof propertyInquiries.$inferSelect;
export type InsertPropertyInquiry = z.infer<typeof insertPropertyInquirySchema>;

// Favorites schema
export const favorites = sqliteTable("favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
