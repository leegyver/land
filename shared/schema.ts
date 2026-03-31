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
  isActive: integer("isActive", { mode: 'boolean' }).default(true),
  createdAt: text("createdAt"),

  updatedAt: text("updatedAt"),
  buildingName: text("buildingName"),
  unitNumber: text("unitNumber"),
  supplyArea: text("supplyArea"),
  privateArea: text("privateArea"),
  areaSize: text("areaSize"),
  floor: integer("floor"),
  totalFloors: integer("totalFloors"),
  direction: text("direction"),
  elevator: integer("elevator", { mode: 'boolean' }),
  parking: text("parking"),
  heatingSystem: text("heatingSystem"),
  approvalDate: text("approvalDate"),
  landType: text("landType"),
  zoneType: text("zoneType"),
  dealType: text("dealType"),
  deposit: text("deposit"),
  depositAmount: text("depositAmount"),
  monthlyRent: text("monthlyRent"),
  maintenanceFee: text("maintenanceFee"),
  ownerName: text("ownerName"),
  ownerPhone: text("ownerPhone"),
  tenantName: text("tenantName"),
  tenantPhone: text("tenantPhone"),
  clientName: text("clientName"),
  clientPhone: text("clientPhone"),
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
  source: text("source"),
  atclNo: text("atclNo"),
  ownerId: integer("ownerId"),
});

// 헬퍼: Drizzle의 inferred insert type에서 Zod schema 생성시 발생하는 추론 오류(SomeType) 방지용 수동 정의
export const insertPropertySchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  type: z.string(),
  price: z.string().optional(),
  address: z.string().optional(),
  district: z.string().optional(),
  size: z.string().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  imageUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  agentId: z.number().optional(),
  featured: z.boolean().optional(),
  displayOrder: z.number().optional(),
  isUrgent: z.boolean().optional(),
  isNegotiable: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  buildingName: z.string().nullable().optional(),
  unitNumber: z.string().nullable().optional(),
  supplyArea: z.string().nullable().optional(),
  privateArea: z.string().nullable().optional(),
  areaSize: z.string().nullable().optional(),
  floor: z.number().nullable().optional(),
  totalFloors: z.number().nullable().optional(),
  direction: z.string().nullable().optional(),
  elevator: z.boolean().nullable().optional(),
  parking: z.string().nullable().optional(),
  heatingSystem: z.string().nullable().optional(),
  approvalDate: z.string().nullable().optional(),
  landType: z.string().nullable().optional(),
  zoneType: z.string().nullable().optional(),
  dealType: z.array(z.string()).optional(),
  deposit: z.string().nullable().optional(),
  depositAmount: z.string().nullable().optional(),
  monthlyRent: z.string().nullable().optional(),
  maintenanceFee: z.string().nullable().optional(),
  ownerName: z.string().nullable().optional(),
  ownerPhone: z.string().nullable().optional(),
  tenantName: z.string().nullable().optional(),
  tenantPhone: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(),
  clientPhone: z.string().nullable().optional(),
  specialNote: z.string().nullable().optional(),
  coListing: z.boolean().optional(),
  agentName: z.string().nullable().optional(),
  propertyDescription: z.string().nullable().optional(),
  privateNote: z.string().nullable().optional(),
  youtubeUrl: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  isSold: z.boolean().optional(),
  viewCount: z.number().optional(),
  ownerId: z.number().nullable().optional(),
  atclNo: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  urgentOrder: z.number().optional(),
  negotiableOrder: z.number().optional(),
  isLongTerm: z.boolean().optional(),
  longTermOrder: z.number().optional(),
});

// User schema
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").default("user").notNull(),
  provider: text("provider"),
  providerId: text("providerId"),
  birthDate: text("birthDate"),
  birthTime: text("birthTime"),
  isLunar: integer("isLunar", { mode: 'boolean' }).default(false),
  realtorPhoto: text("realtorPhoto"),
  realtorAddress: text("realtorAddress"),
  businessLicenseNo: text("realtorLicenseNo"),
  subscriptionTier: text("subscriptionTier").default("free"),
  nickname: text("nickname"),
  businessName: text("businessName"),
  realtorName: text("realtorName"),
  realtorPhone: text("realtorPhone"),
  isActive: integer("isActive", { mode: 'boolean' }).default(true),
  isVerified: integer("isVerified", { mode: 'boolean' }).default(false),
  subscriptionExpiresAt: text("subscriptionExpiresAt"),
  createdAt: text("createdAt"),
});

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().min(1, "전화번호를 입력해주세요."),
  role: z.string().optional(),
  provider: z.string().nullable().optional(),
  providerId: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  birthTime: z.string().nullable().optional(),
  isLunar: z.boolean().optional(),
  realtorPhoto: z.string().nullable().optional(),
  realtorAddress: z.string().nullable().optional(),
  businessLicenseNo: z.string().nullable().optional(),
  subscriptionTier: z.string().optional(),
  nickname: z.string().nullable().optional(),
  businessName: z.string().nullable().optional(),
  realtorName: z.string().nullable().optional(),
  realtorPhone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  subscriptionExpiresAt: z.string().nullable().optional(),
});
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

export const insertAgentSchema = z.object({
  name: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

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

export const insertInquirySchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  message: z.string(),
  inquiryType: z.string(),
  propertyId: z.number().nullable().optional(),
});



export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
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

export const insertNewsSchema = z.object({
  title: z.string(),
  summary: z.string(),
  description: z.string(),
  content: z.string(),
  source: z.string(),
  sourceUrl: z.string(),
  url: z.string(),
  imageUrl: z.string().nullable().optional(),
  category: z.string(),
  isPinned: z.boolean().optional(),
});

export type News = typeof news.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;

// Property inquiry board schema
export const propertyInquiries = sqliteTable("property_inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  propertyId: integer("propertyId").notNull(),
  userId: integer("userId").notNull(),
  title: text("title"), // UI에서 입력받지 않으므로 선택 사항으로 변경
  content: text("content").notNull(),
  isReply: integer("isReply", { mode: 'boolean' }).default(false).notNull(),
  parentId: integer("parentId"),
  isReadByAdmin: integer("isReadByAdmin", { mode: 'boolean' }).default(false).notNull(),
  createdAt: text("createdAt"),
});

export const insertPropertyInquirySchema = z.object({
  propertyId: z.number(),
  userId: z.number(),
  title: z.string().nullable().optional(),
  content: z.string(),
  isReply: z.boolean().optional(),
  parentId: z.number().nullable().optional(),
  isReadByAdmin: z.boolean().optional(),
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

export const insertFavoriteSchema = z.object({
  userId: z.number(),
  propertyId: z.number(),
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
  authorId: integer("authorId"),
  viewCount: integer("viewCount").default(0),
  createdAt: text("createdAt"),
  updatedAt: text("updatedAt"),
});

export const insertNoticeSchema = z.object({
  title: z.string(),
  content: z.string(),
  imageUrls: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  authorId: z.number().optional(),
});
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

export const insertPostSchema = z.object({
  title: z.string(),
  content: z.string(),
  category: z.string().optional(),
  authorId: z.number().optional(),
  authorName: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
});
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

// Comments schema
export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("postId").notNull(),
  authorId: integer("authorId").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  createdAt: text("createdAt"),
});

export const insertCommentSchema = z.object({
  postId: z.number(),
  authorId: z.number(),
  content: z.string(),
  imageUrl: z.string().optional(),
});
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Banners schema
export const banners = sqliteTable("banners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title"),

  imageUrl: text("imageUrl").notNull(),
  linkUrl: text("linkUrl"),
  location: text("location").notNull().default("left"),
  openNewWindow: integer("openNewWindow", { mode: 'boolean' }).default(false),
  isActive: integer("isActive", { mode: 'boolean' }).default(true),
  displayOrder: integer("displayOrder").default(0),
  createdAt: text("createdAt"),
});

export const insertBannerSchema = z.object({
  title: z.string().nullable().optional(),
  imageUrl: z.string(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  linkUrl: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  openNewWindow: z.boolean().optional(),
});
export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;

// Newsletter Subscriptions schema
export const newsletterSubscriptions = sqliteTable("newsletter_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name"),
  isActive: integer("isActive", { mode: 'boolean' }).default(true),
  createdAt: text("createdAt"),
});

export const insertNewsletterSubscriptionSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type InsertNewsletterSubscription = z.infer<typeof insertNewsletterSubscriptionSchema>;

// Realtor Subscriptions schema
export const realtorSubscriptions = sqliteTable("realtor_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  planType: text("planType").notNull(),
  amount: integer("amount").notNull(),
  impUid: text("impUid"),
  merchantUid: text("merchantUid"),
  status: text("status").default("active").notNull(),
  startDate: text("startDate"),
  endDate: text("endDate"),
  createdAt: text("createdAt"),
});

export const insertRealtorSubscriptionSchema = z.object({
  userId: z.number(),
  planType: z.string(),
  amount: z.number(),
  impUid: z.string().nullable().optional(),
  merchantUid: z.string().nullable().optional(),
  status: z.string().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});
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

export const insertNotificationSchema = z.object({
  userId: z.number().nullable().optional(),
  title: z.string(),
  message: z.string(),
  type: z.string().optional(),
  isRead: z.boolean().optional(),
  linkUrl: z.string().nullable().optional(),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Crawled Properties schema
export const crawledProperties = sqliteTable("crawled_properties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  atclNo: text("atclNo").notNull().unique(),
  atclNm: text("atclNm"),
  rletTpNm: text("rletTpNm"),
  tradTpNm: text("tradTpNm"),
  flrInfo: text("flrInfo"),
  prc: text("prc"),
  spc1: text("spc1"),
  spc2: text("spc2"),
  direction: text("direction"),
  lat: real("lat"),
  lng: real("lng"),
  imgUrl: text("imgUrl"),
  rltrNm: text("rltrNm"),
  rentPrc: text("rentPrc"),
  depositPrc: text("depositPrc"),
  landType: text("landType"),
  zoneType: text("zoneType"),
  crawledAt: text("crawledAt"),
});

export const insertCrawledPropertySchema = z.object({
  atclNo: z.string(),
  atclNm: z.string().nullable().optional(),
  rletTpNm: z.string().nullable().optional(),
  tradTpNm: z.string().nullable().optional(),
  flrInfo: z.string().nullable().optional(),
  prc: z.string().nullable().optional(),
  spc1: z.string().nullable().optional(),
  spc2: z.string().nullable().optional(),
  direction: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  imgUrl: z.string().nullable().optional(),
  rltrNm: z.string().nullable().optional(),
  rentPrc: z.string().nullable().optional(),
  depositPrc: z.string().nullable().optional(),
  landType: z.string().nullable().optional(),
  zoneType: z.string().nullable().optional(),
});
export type CrawledProperty = typeof crawledProperties.$inferSelect;
export type InsertCrawledProperty = z.infer<typeof insertCrawledPropertySchema>;

// Admin Notifications schema
export const adminNotifications = sqliteTable("admin_notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // 'subscription', 'user_registration', 'inquiry'
  relatedId: integer("relatedId"),
  title: text("title").notNull(),
  content: text("content"),
  isRead: integer("isRead", { mode: 'boolean' }).default(false),
  createdAt: text("createdAt"),
});

export const insertAdminNotificationSchema = z.object({
  type: z.string(),
  relatedId: z.number().nullable().optional(),
  title: z.string(),
  content: z.string().nullable().optional(),
  isRead: z.boolean().optional(),
});
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;

