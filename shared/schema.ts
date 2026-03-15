import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Property schema - Matched to actual SQLite column names (camelCase)
export const properties = sqliteTable("properties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  price: text("price").notNull(),
  address: text("address").notNull(),
  district: text("district").notNull(),
  size: text("size").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageUrls: text("imageUrls"),
  featuredImageIndex: integer("featuredImageIndex"),
  agentId: integer("agentId").notNull(),
  featured: integer("featured", { mode: 'boolean' }).default(false),
  displayOrder: integer("displayOrder").default(0),
  isUrgent: integer("isUrgent", { mode: 'boolean' }).default(false),
  urgentOrder: integer("urgentOrder").default(0),
  isNegotiable: integer("isNegotiable", { mode: 'boolean' }).default(false),
  negotiableOrder: integer("negotiableOrder").default(0),
  isVisible: integer("isVisible", { mode: 'boolean' }).default(true),
  createdAt: text("createdAt"),
  updatedAt: text("updatedAt"),

  // 위치 정보
  buildingName: text("buildingName"),
  unitNumber: text("unitNumber"),

  // 면적 정보
  supplyArea: text("supplyArea"),
  privateArea: text("privateArea"),
  areaSize: text("areaSize"),

  // 건물 정보
  floor: integer("floor"),
  totalFloors: integer("totalFloors"),
  direction: text("direction"),
  elevator: integer("elevator", { mode: 'boolean' }),
  parking: text("parking"),
  heatingSystem: text("heatingSystem"),
  approvalDate: text("approvalDate"),

  // 토지 정보
  landType: text("landType"),
  zoneType: text("zoneType"),

  // 금액 정보
  dealType: text("dealType"),
  deposit: text("deposit"),
  depositAmount: text("depositAmount"),
  monthlyRent: text("monthlyRent"),
  maintenanceFee: text("maintenanceFee"),

  // 연락처 정보
  ownerName: text("ownerName"),
  ownerPhone: text("ownerPhone"),
  tenantName: text("tenantName"),
  tenantPhone: text("tenantPhone"),
  clientName: text("clientName"),
  clientPhone: text("clientPhone"),

  // 추가 정보
  specialNote: text("specialNote"),
  coListing: integer("coListing", { mode: 'boolean' }).default(false),
  agentName: text("agentName"),
  propertyDescription: text("propertyDescription"),
  privateNote: text("privateNote"),
  youtubeUrl: text("youtubeUrl"),
  isSold: integer("isSold", { mode: 'boolean' }).default(false),
  viewCount: integer("viewCount").default(0),
  isLongTerm: integer("isLongTerm", { mode: 'boolean' }).default(false),
  longTermOrder: integer("longTermOrder").default(0),
  latitude: real("latitude"),
  longitude: real("longitude"),
  ownerId: integer("ownerId"),
  atclNo: text("atclNo"),
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
  isActive: integer("isActive", { mode: 'boolean' }).default(true),
  createdAt: text("createdAt"),
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
  inquiryType: text("inquiryType").notNull(),
  propertyId: integer("propertyId"),
  createdAt: text("createdAt"),
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
  role: text("role").default("user").notNull(), // user, realtor, admin
  nickname: text("nickname"),
  profileImage: text("profileImage"),
  birthDate: text("birthDate"),
  birthTime: text("birthTime"),
  isLunar: integer("isLunar", { mode: 'boolean' }).default(false),
  // 중개사 전용 필드
  businessName: text("businessName"),          // 사무소명
  businessLicenseNo: text("businessLicenseNo"), // 사업자등록번호
  businessAddress: text("businessAddress"),     // 사무소 주소
  isVerified: integer("isVerified", { mode: 'boolean' }).default(false), // 관리자 승인 여부
  // 구독 정보
  subscriptionTier: text("subscriptionTier").default("free"), // free, monthly, annual
  subscriptionExpiresAt: text("subscriptionExpiresAt"),
  createdAt: text("createdAt"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phone: true,
  role: true,
  nickname: true,
  birthDate: true,
  birthTime: true,
  isLunar: true,
  businessName: true,
  businessLicenseNo: true,
  businessAddress: true,
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
  sourceUrl: text("sourceUrl").notNull(),
  url: text("url").notNull(),
  imageUrl: text("imageUrl"),
  category: text("category").notNull(),
  isPinned: integer("isPinned", { mode: 'boolean' }).default(false),
  createdAt: text("createdAt"),
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
  propertyId: integer("propertyId").notNull(),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isReply: integer("isReply", { mode: 'boolean' }).default(false).notNull(),
  parentId: integer("parentId"),
  isReadByAdmin: integer("isReadByAdmin", { mode: 'boolean' }).default(false).notNull(),
  createdAt: text("createdAt"),
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
  userId: integer("userId").notNull(),
  propertyId: integer("propertyId").notNull(),
  createdAt: text("createdAt").notNull(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

// Notices schema
export const notices = sqliteTable("notices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrls: text("imageUrls", { mode: "json" }).$type<string[]>(),
  isPinned: integer("isPinned", { mode: 'boolean' }).default(false),
  viewCount: integer("viewCount").default(0),
  createdAt: text("createdAt"),
  updatedAt: text("updatedAt"),
});

export const insertNoticeSchema = createInsertSchema(notices).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export type Notice = typeof notices.$inferSelect;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;

// Posts (Community) schema
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("free"),
  authorId: integer("authorId").notNull(),
  authorName: text("authorName"),
  imageUrls: text("imageUrls", { mode: "json" }).$type<string[]>(),
  viewCount: integer("viewCount").default(0),
  likeCount: integer("likeCount").default(0),
  commentCount: integer("commentCount").default(0),
  isPinned: integer("isPinned", { mode: 'boolean' }).default(false),
  createdAt: text("createdAt"),
  updatedAt: text("updatedAt"),
});

export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true, likeCount: true, commentCount: true });
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

// Banners schema
export const banners = sqliteTable("banners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  imageUrl: text("imageUrl").notNull(),
  linkUrl: text("linkUrl"),
  location: text("location").notNull().default("left"),
  isActive: integer("isActive", { mode: 'boolean' }).default(true),
  displayOrder: integer("displayOrder").default(0),
  createdAt: text("createdAt"),
});

export const insertBannerSchema = createInsertSchema(banners).omit({ id: true, createdAt: true });
export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;

// Newsletter Subscriptions schema
export const newsletterSubscriptions = sqliteTable("newsletter_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  name: text("name"),
  isActive: integer("isActive", { mode: 'boolean' }).default(true),
  createdAt: text("createdAt"),
});

export const insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions).omit({ id: true, createdAt: true });
export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type InsertNewsletterSubscription = z.infer<typeof insertNewsletterSubscriptionSchema>;

// Realtor Subscriptions (결제 이력) schema
export const realtorSubscriptions = sqliteTable("realtor_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  planType: text("planType").notNull(), // monthly, annual
  amount: integer("amount").notNull(),  // 결제 금액
  impUid: text("impUid"),              // 포트원 결제 ID
  merchantUid: text("merchantUid"),    // 주문번호
  status: text("status").default("active").notNull(), // active, expired, cancelled
  startDate: text("startDate"),
  endDate: text("endDate"),
  createdAt: text("createdAt"),
});

export const insertRealtorSubscriptionSchema = createInsertSchema(realtorSubscriptions).omit({ id: true, createdAt: true });
export type RealtorSubscription = typeof realtorSubscriptions.$inferSelect;
export type InsertRealtorSubscription = z.infer<typeof insertRealtorSubscriptionSchema>;

// Notifications schema
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  isRead: integer("isRead", { mode: 'boolean' }).default(false),
  linkUrl: text("linkUrl"),
  createdAt: text("createdAt"),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
