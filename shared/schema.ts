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
  providerId: z.string().or(z.number()).optional().nullable()
});
export type User = z.infer<typeof userSchema>;
export const insertUserSchema = userSchema.pick({
  username: true,
  password: true,
  email: true,
  phone: true,
  role: true,
  provider: true,
  providerId: true
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
