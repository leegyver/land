import { z } from "zod";

// --- Property ---
export const propertySchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  type: z.string(),
  price: z.string().or(z.number()),
  address: z.string(),
  district: z.string(),
  size: z.string().or(z.number()),
  bedrooms: z.number(),
  bathrooms: z.number(),
  imageUrl: z.string(),
  imageUrls: z.array(z.string()).optional().default([]),
  featuredImageIndex: z.number().optional().nullable(),
  agentId: z.number(),
  featured: z.boolean().default(false).optional(),
  displayOrder: z.number().default(0).optional(),

  // New fields for Urgent and Negotiable sections
  isUrgent: z.boolean().default(false).optional(),
  urgentOrder: z.number().default(0).optional(),
  isNegotiable: z.boolean().default(false).optional(),
  negotiableOrder: z.number().default(0).optional(),
  isLongTerm: z.boolean().default(false).optional(),
  longTermOrder: z.number().default(0).optional(),

  isVisible: z.boolean().default(true).optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),

  // Optional fields
  buildingName: z.string().optional().nullable(),
  unitNumber: z.string().optional().nullable(),
  supplyArea: z.string().or(z.number()).optional().nullable(),
  privateArea: z.string().or(z.number()).optional().nullable(),
  areaSize: z.string().optional().nullable(),
  floor: z.number().optional().nullable(),
  totalFloors: z.number().optional().nullable(),
  direction: z.string().optional().nullable(),
  elevator: z.boolean().optional().nullable(),
  parking: z.string().optional().nullable(),
  heatingSystem: z.string().optional().nullable(),
  approvalDate: z.string().optional().nullable(),
  landType: z.string().optional().nullable(),
  zoneType: z.string().optional().nullable(),
  dealType: z.array(z.string()).optional().nullable(),
  deposit: z.string().or(z.number()).optional().nullable(),
  depositAmount: z.string().or(z.number()).optional().nullable(),
  monthlyRent: z.string().or(z.number()).optional().nullable(),
  maintenanceFee: z.string().or(z.number()).optional().nullable(),
  ownerName: z.string().optional().nullable(),
  ownerPhone: z.string().optional().nullable(),
  tenantName: z.string().optional().nullable(),
  tenantPhone: z.string().optional().nullable(),
  clientName: z.string().optional().nullable(),
  clientPhone: z.string().optional().nullable(),
  specialNote: z.string().optional().nullable(),
  coListing: z.boolean().default(false).optional(),
  agentName: z.string().optional().nullable(),
  propertyDescription: z.string().optional().nullable(),
  privateNote: z.string().optional().nullable(),
  youtubeUrl: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  isSold: z.boolean().default(false).optional(),
  viewCount: z.number().default(0).optional(),
});

export type Property = z.infer<typeof propertySchema>;

export const insertPropertySchema = propertySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  // Form data preprocessing
  price: z.union([z.string(), z.number()]).optional().transform(val => val === "" || val === undefined || val === null ? "0" : String(val)),
});
export type InsertProperty = z.infer<typeof insertPropertySchema>;

// --- Agent ---
export const agentSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  isActive: z.boolean().default(true).optional(),
  createdAt: z.date().optional()
});
export type Agent = z.infer<typeof agentSchema>;
export const insertAgentSchema = agentSchema.omit({ id: true, createdAt: true });
export type InsertAgent = z.infer<typeof insertAgentSchema>;

// --- Inquiry ---
export const inquirySchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  message: z.string(),
  inquiryType: z.string(),
  propertyId: z.number().optional().nullable(),
  createdAt: z.date().optional()
});
export type Inquiry = z.infer<typeof inquirySchema>;
export const insertInquirySchema = inquirySchema.omit({ id: true, createdAt: true });
export type InsertInquiry = z.infer<typeof insertInquirySchema>;

// --- User ---
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().default("user").optional(),
  provider: z.string().optional().nullable(),
  providerId: z.string().or(z.number()).optional().nullable(),
  birthDate: z.string().optional().nullable(), // YYYY-MM-DD
  birthTime: z.string().optional().nullable(),  // HH:MM
  isLunar: z.boolean().default(false).optional() // Added: Lunar Calendar flag
});
export type User = z.infer<typeof userSchema>;
export const insertUserSchema = userSchema.pick({
  username: true,
  password: true,
  email: true,
  phone: true,
  role: true,
  provider: true,
  providerId: true,
  birthDate: true,
  birthTime: true,
  isLunar: true // Added
});
export type InsertUser = z.infer<typeof insertUserSchema>;

// --- News ---
export const newsSchema = z.object({
  id: z.number(),
  title: z.string(),
  summary: z.string(),
  description: z.string(),
  content: z.string(),
  source: z.string(),
  sourceUrl: z.string(),
  url: z.string(),
  imageUrl: z.string().optional().nullable(),
  category: z.string(),
  isPinned: z.boolean().default(false).optional(),
  createdAt: z.date().optional()
});
export type News = z.infer<typeof newsSchema>;
export const insertNewsSchema = newsSchema.omit({ id: true, createdAt: true });
export type InsertNews = z.infer<typeof insertNewsSchema>;

// --- PropertyInquiry ---
export const propertyInquirySchema = z.object({
  id: z.number(),
  propertyId: z.number(),
  userId: z.number(),
  title: z.string(),
  content: z.string(),
  isReply: z.boolean().default(false).optional(),
  parentId: z.number().optional().nullable(),
  isReadByAdmin: z.boolean().default(false).optional(),
  createdAt: z.date().optional()
});
export type PropertyInquiry = z.infer<typeof propertyInquirySchema>;
export const insertPropertyInquirySchema = propertyInquirySchema.omit({ id: true, createdAt: true });
export type InsertPropertyInquiry = z.infer<typeof insertPropertyInquirySchema>;

// --- Favorite ---
export const favoriteSchema = z.object({
  id: z.number(),
  userId: z.number(),
  propertyId: z.number(),
  createdAt: z.date().optional()
});
export type Favorite = z.infer<typeof favoriteSchema>;
export const insertFavoriteSchema = favoriteSchema.omit({ id: true, createdAt: true });
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

// --- Banner ---
export const bannerSchema = z.object({
  id: z.number(),
  location: z.string(), // 'left' or 'right'
  imageUrl: z.string(),
  linkUrl: z.string().optional().nullable(),
  openNewWindow: z.boolean().default(false),
  displayOrder: z.number().default(0),
  createdAt: z.date().optional()
});
export type Banner = z.infer<typeof bannerSchema>;
export const insertBannerSchema = bannerSchema.omit({ id: true, createdAt: true });
export type InsertBanner = z.infer<typeof insertBannerSchema>;

// --- Notice ---
export const noticeSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  imageUrls: z.array(z.string()).optional().default([]),
  isPinned: z.boolean().default(false).optional(),
  authorId: z.number().optional().nullable(),
  viewCount: z.number().default(0).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});
export type Notice = z.infer<typeof noticeSchema>;
export const insertNoticeSchema = noticeSchema.omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export type InsertNotice = z.infer<typeof insertNoticeSchema>;

// --- Crawled Property ---
export const crawledPropertySchema = z.object({
  id: z.number(),
  atclNo: z.string(), // Naver Article ID
  atclNm: z.string(), // Title/Name
  rletTpNm: z.string(), // Real Estate Type Name (e.g. 토지)
  tradTpNm: z.string(), // Trade Type Name (e.g. 매매)
  flrInfo: z.string().optional().nullable(), // Floor Info
  prc: z.string().or(z.number()), // Price (Man Won or string)
  spc1: z.string().or(z.number()).optional().nullable(), // Area 1
  spc2: z.string().or(z.number()).optional().nullable(), // Area 2
  direction: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  imgUrl: z.string().optional().nullable(),
  rltrNm: z.string().optional().nullable(), // Realtor Name
  landType: z.string().optional().nullable(), // Land Category (지목)
  zoneType: z.string().optional().nullable(), // Zone Type (용도지역)
  crawledAt: z.date().optional()
});
export type CrawledProperty = z.infer<typeof crawledPropertySchema>;
export const insertCrawledPropertySchema = crawledPropertySchema.omit({ id: true, crawledAt: true });
export type InsertCrawledProperty = z.infer<typeof insertCrawledPropertySchema>;

// --- Newsletter Subscription ---
export const newsletterSubscriptionSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  createdAt: z.date().or(z.string()).optional()
});
export type NewsletterSubscription = z.infer<typeof newsletterSubscriptionSchema>;

export const insertNewsletterSubscriptionSchema = newsletterSubscriptionSchema.omit({ id: true, createdAt: true });
export type InsertNewsletterSubscription = z.infer<typeof insertNewsletterSubscriptionSchema>;
