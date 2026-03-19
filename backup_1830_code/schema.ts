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
  role: text("role").default("user").notNull(),
  nickname: text("nickname"),
  profileImage: text("profileImage"),
  birthDate: text("birthDate"),
  birthTime: text("birthTime"),
  isLunar: integer("isLunar", { mode: 'boolean' }).default(false),
  businessName: text("businessName"),
  businessLicenseNo: text("businessLicenseNo"),
  businessAddress: text("businessAddress"),
  isVerified: integer("isVerified", { mode: 'boolean' }).default(false),
  subscriptionTier: text("subscriptionTier").default("free"),
  subscriptionExpiresAt: text("subscriptionExpiresAt"),
  isActive: integer("isActive", { mode: 'boolean' }).default(true),
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
  title: text("title"), // UI에서 입력받지 않으므로 선택 사항으로 변경
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

export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true, likeCount: true, commentCount: true }).extend({ authorId: z.number().optional() });
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

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });
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

export const insertBannerSchema = createInsertSchema(banners).omit({ id: true, createdAt: true });
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

export const insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions).omit({ id: true, createdAt: true });
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
  landType: text("landType"),
  zoneType: text("zoneType"),
  crawledAt: text("crawledAt"),
});

export const insertCrawledPropertySchema = createInsertSchema(crawledProperties).omit({ id: true });
export type CrawledProperty = typeof crawledProperties.$inferSelect;
export type InsertCrawledProperty = z.infer<typeof insertCrawledPropertySchema>;
