import {
  type Property, type InsertProperty,
  type Agent, type InsertAgent,
  type Inquiry, type InsertInquiry,
  type User, type InsertUser,
  type News, type InsertNews,
  type PropertyInquiry, type InsertPropertyInquiry,
  type Favorite, type InsertFavorite
} from "@shared/schema";
import { db } from "./db";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import admin from 'firebase-admin';

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export interface IStorage {
  sessionStore: session.Store;

  // Property methods
  getProperties(): Promise<Property[]>;
  getAllProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  getFeaturedProperties(limit?: number): Promise<Property[]>;
  getPropertiesByType(type: string): Promise<Property[]>;
  getPropertiesByDistrict(district: string): Promise<Property[]>;
  getPropertiesByPriceRange(min: number, max: number): Promise<Property[]>;
  getPropertiesByAddresses(addresses: string[]): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  updatePropertyOrder(propertyId: number, newOrder: number): Promise<boolean>;
  togglePropertyVisibility(propertyId: number, isVisible: boolean): Promise<boolean>;
  togglePropertyFeatured(propertyId: number, featured: boolean): Promise<boolean>;

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
  getUnreadInquiries(): Promise<(PropertyInquiry & { authorUsername?: string; propertyTitle?: string })[]>;
  getUnreadInquiryCount(): Promise<number>;
  markInquiryAsRead(id: number): Promise<boolean>;
  markAllInquiriesAsRead(): Promise<boolean>;

  // Favorites methods
  getUserFavorites(userId: number): Promise<Favorite[]>;
  getFavoriteProperties(userId: number): Promise<Property[]>;
  isFavorite(userId: number, propertyId: number): Promise<boolean>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, propertyId: number): Promise<boolean>;

  // Init Data
  initializeData(): Promise<void>;
}

export class FirebaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  private async getNextId(collectionName: string): Promise<number> {
    const docRef = db.collection('counters').doc(collectionName);
    try {
      const doc = await docRef.get();
      if (!doc.exists) {
        await docRef.set({ count: 1 });
        return 1;
      }
      await docRef.update({ count: admin.firestore.FieldValue.increment(1) });
      const updated = await docRef.get();
      return updated.data()?.count || 1;
    } catch (e) {
      console.error(`Failed to generate ID for ${collectionName}:`, e);
      return Date.now();
    }
  }

  // Properties
  async getProperties(): Promise<Property[]> {
    try {
      const snapshot = await db.collection('properties')
        .where('isVisible', '==', true)
        .get();

      const properties = snapshot.docs.map(doc => doc.data() as Property);
      // In-memory sort: displayOrder asc, then createdAt desc
      return properties.sort((a, b) => {
        const orderDiff = (a.displayOrder || 0) - (b.displayOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
    } catch (e) {
      console.error("getProperties error:", e);
      return [];
    }
  }

  async getAllProperties(): Promise<Property[]> {
    try {
      const snapshot = await db.collection('properties').get();
      const properties = snapshot.docs.map(doc => doc.data() as Property);
      return properties.sort((a, b) => {
        const orderDiff = (a.displayOrder || 0) - (b.displayOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
    } catch (e) {
      console.error("getAllProperties error:", e);
      return [];
    }
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const snapshot = await db.collection('properties').where('id', '==', id).limit(1).get();
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as Property;
  }

  async getFeaturedProperties(limit: number = 20): Promise<Property[]> {
    try {
      // 복합 쿼리 인덱스 필요성을 줄이기 위해 단순 필터만 사용
      const snapshot = await db.collection('properties')
        .where('featured', '==', true)
        .where('isVisible', '==', true)
        .get();

      const properties = snapshot.docs.map(doc => doc.data() as Property);
      return properties.sort((a, b) => {
        const orderDiff = (a.displayOrder || 0) - (b.displayOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }).slice(0, limit);
    } catch (e) {
      console.error("getFeaturedProperties error:", e);
      return [];
    }
  }

  async getPropertiesByType(type: string): Promise<Property[]> {
    try {
      const snapshot = await db.collection('properties')
        .where('type', '==', type)
        .where('isVisible', '==', true)
        .get();

      const properties = snapshot.docs.map(doc => doc.data() as Property);
      return properties.sort((a, b) => {
        const orderDiff = (a.displayOrder || 0) - (b.displayOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
    } catch (e) {
      console.error("getPropertiesByType error:", e);
      return [];
    }
  }

  async getPropertiesByDistrict(district: string): Promise<Property[]> {
    try {
      const snapshot = await db.collection('properties')
        .where('district', '==', district)
        .where('isVisible', '==', true)
        .get();

      const properties = snapshot.docs.map(doc => doc.data() as Property);
      return properties.sort((a, b) => {
        const orderDiff = (a.displayOrder || 0) - (b.displayOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
    } catch (e) {
      console.error("getPropertiesByDistrict error:", e);
      return [];
    }
  }

  async getPropertiesByPriceRange(min: number, max: number): Promise<Property[]> {
    // Note: price is stored as string in schema, but for range query correct type is needed.
    // Assuming consistency in storage (string), string comparison might not be numeric.
    // For proper range, better to fetch all (or filtered by visibility) and filter in memory if dataset is small.
    const snapshot = await db.collection('properties')
      .where('isVisible', '==', true)
      .get();

    const props = snapshot.docs.map(doc => doc.data() as Property);
    return props.filter(p => {
      const val = Number(p.price || 0);
      return val >= min && val <= max;
    }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getPropertiesByAddresses(addresses: string[]): Promise<Property[]> {
    if (!addresses.length) return [];
    const snapshot = await db.collection('properties')
      .where('address', 'in', addresses.slice(0, 10)) // Limit for 'in' query
      .get();
    return snapshot.docs.map(doc => doc.data() as Property);
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const id = await this.getNextId('properties');
    const newProperty = {
      ...property,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrls: property.imageUrls || [],
      isVisible: property.isVisible ?? true,
      featured: property.featured ?? false,
      displayOrder: property.displayOrder ?? 0,
      isSold: property.isSold ?? false,
      viewCount: 0
    };

    // Convert to plain object just in case
    const plainObj = JSON.parse(JSON.stringify(newProperty));
    // Firestore stores Dates as Timestamps, client expects Strings or Dates. 
    // Usually client handles serialization. 

    await db.collection('properties').doc(id.toString()).set(plainObj);
    return newProperty as unknown as Property;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const docRef = db.collection('properties').doc(id.toString());
    const doc = await docRef.get();
    if (!doc.exists) return undefined;

    const updateData = { ...property, updatedAt: new Date() };
    await docRef.update(JSON.parse(JSON.stringify(updateData))); // Remove undefined

    const updated = await docRef.get();
    return updated.data() as Property;
  }

  async deleteProperty(id: number): Promise<boolean> {
    await db.collection('properties').doc(id.toString()).delete();
    return true;
  }

  async updatePropertyOrder(propertyId: number, newOrder: number): Promise<boolean> {
    await db.collection('properties').doc(propertyId.toString()).update({ displayOrder: newOrder });
    return true;
  }
  async togglePropertyVisibility(propertyId: number, isVisible: boolean): Promise<boolean> {
    await db.collection('properties').doc(propertyId.toString()).update({ isVisible });
    return true;
  }
  async togglePropertyFeatured(propertyId: number, featured: boolean): Promise<boolean> {
    await db.collection('properties').doc(propertyId.toString()).update({ featured });
    return true;
  }

  // Agents
  async getAgents(): Promise<Agent[]> {
    const snapshot = await db.collection('agents').where('isActive', '==', true).orderBy('id').get();
    return snapshot.docs.map(d => d.data() as Agent);
  }
  async getAgent(id: number): Promise<Agent | undefined> {
    const doc = await db.collection('agents').doc(id.toString()).get();
    return doc.exists ? doc.data() as Agent : undefined;
  }
  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = await this.getNextId('agents');
    const newAgent = { ...agent, id, createdAt: new Date() };
    await db.collection('agents').doc(id.toString()).set(JSON.parse(JSON.stringify(newAgent)));
    return newAgent as unknown as Agent;
  }
  async updateAgent(id: number, agent: Partial<InsertAgent>): Promise<Agent | undefined> {
    const ref = db.collection('agents').doc(id.toString());
    await ref.update(JSON.parse(JSON.stringify(agent)));
    const doc = await ref.get();
    return doc.exists ? doc.data() as Agent : undefined;
  }
  async deleteAgent(id: number): Promise<boolean> {
    await db.collection('agents').doc(id.toString()).delete();
    return true;
  }

  // Inquiries
  async getInquiries(): Promise<Inquiry[]> {
    const snapshot = await db.collection('inquiries').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(d => d.data() as Inquiry);
  }
  async getInquiry(id: number): Promise<Inquiry | undefined> {
    const doc = await db.collection('inquiries').doc(id.toString()).get();
    return doc.data() as Inquiry;
  }
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const id = await this.getNextId('inquiries');
    const newInquiry = { ...inquiry, id, createdAt: new Date() };
    await db.collection('inquiries').doc(id.toString()).set(JSON.parse(JSON.stringify(newInquiry)));
    return newInquiry as unknown as Inquiry;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const doc = await db.collection('users').doc(id.toString()).get();
    return doc.data() as User;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await db.collection('users').where('username', '==', username).limit(1).get();
    if (snapshot.empty) return undefined;
    return snapshot.docs[0].data() as User;
  }
  async createUser(user: InsertUser): Promise<User> {
    const id = await this.getNextId('users');
    const newUser = { ...user, id, role: user.role || 'user' };
    await db.collection('users').doc(id.toString()).set(newUser);
    return newUser as unknown as User;
  }
  async getAllUsers(): Promise<User[]> {
    const s = await db.collection('users').get();
    return s.docs.map(d => d.data() as User);
  }
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const ref = db.collection('users').doc(id.toString());
    await ref.update(JSON.parse(JSON.stringify(user)));
    const doc = await ref.get();
    return doc.data() as User;
  }
  async deleteUser(id: number): Promise<boolean> {
    await db.collection('users').doc(id.toString()).delete();
    return true;
  }

  // News
  async getNews(): Promise<News[]> {
    const s = await db.collection('news').orderBy('createdAt', 'desc').get();
    return s.docs.map(d => d.data() as News);
  }
  async getLatestNews(limit: number = 6): Promise<News[]> {
    const s = await db.collection('news').orderBy('createdAt', 'desc').limit(limit).get();
    return s.docs.map(d => d.data() as News);
  }
  async getNewsById(id: number): Promise<News | undefined> {
    const d = await db.collection('news').doc(id.toString()).get();
    return d.data() as News;
  }
  async getNewsByCategory(category: string): Promise<News[]> {
    const s = await db.collection('news').where('category', '==', category).orderBy('createdAt', 'desc').get();
    return s.docs.map(d => d.data() as News);
  }
  async createNews(newsItem: InsertNews): Promise<News> {
    const id = await this.getNextId('news');
    const newItem = { ...newsItem, id, createdAt: new Date() };
    await db.collection('news').doc(id.toString()).set(JSON.parse(JSON.stringify(newItem)));
    return newItem as unknown as News;
  }
  async updateNews(id: number, newsItem: Partial<InsertNews>): Promise<News | undefined> {
    const ref = db.collection('news').doc(id.toString());
    await ref.update(JSON.parse(JSON.stringify(newsItem)));
    const d = await ref.get();
    return d.data() as News;
  }
  async deleteNews(id: number): Promise<boolean> {
    await db.collection('news').doc(id.toString()).delete();
    return true;
  }

  // Property Inquiries
  async getPropertyInquiries(propertyId: number): Promise<(PropertyInquiry & { authorUsername?: string })[]> {
    const snapshot = await db.collection('propertyInquiries')
      .where('propertyId', '==', propertyId)
      .orderBy('createdAt', 'desc')
      .get();

    const inquiries = snapshot.docs.map(d => d.data() as PropertyInquiry);
    const results = await Promise.all(inquiries.map(async (inq) => {
      const u = await this.getUser(inq.userId);
      return { ...inq, authorUsername: u?.username };
    }));
    return results;
  }
  async getPropertyInquiry(id: number): Promise<PropertyInquiry | undefined> {
    const d = await db.collection('propertyInquiries').doc(id.toString()).get();
    return d.data() as PropertyInquiry;
  }
  async createPropertyInquiry(inquiry: InsertPropertyInquiry): Promise<PropertyInquiry> {
    const id = await this.getNextId('propertyInquiries');
    const newInq = { ...inquiry, id, createdAt: new Date(), isReadByAdmin: false };
    await db.collection('propertyInquiries').doc(id.toString()).set(JSON.parse(JSON.stringify(newInq)));
    return newInq as unknown as PropertyInquiry;
  }
  async updatePropertyInquiry(id: number, inquiry: Partial<InsertPropertyInquiry>): Promise<PropertyInquiry | undefined> {
    const ref = db.collection('propertyInquiries').doc(id.toString());
    await ref.update(JSON.parse(JSON.stringify(inquiry)));
    const d = await ref.get();
    return d.data() as PropertyInquiry;
  }
  async deletePropertyInquiry(id: number): Promise<boolean> {
    await db.collection('propertyInquiries').doc(id.toString()).delete();
    return true;
  }

  async getUnreadInquiries(): Promise<(PropertyInquiry & { authorUsername?: string; propertyTitle?: string })[]> {
    const s = await db.collection('propertyInquiries').where('isReadByAdmin', '==', false).orderBy('createdAt', 'desc').get();
    const inqs = s.docs.map(d => d.data() as PropertyInquiry);

    return await Promise.all(inqs.map(async i => {
      const u = await this.getUser(i.userId);
      const p = await this.getProperty(i.propertyId);
      return { ...i, authorUsername: u?.username, propertyTitle: p?.title };
    }));
  }

  async getUnreadInquiryCount(): Promise<number> {
    const s = await db.collection('propertyInquiries').where('isReadByAdmin', '==', false).count().get();
    return s.data().count;
  }

  async markInquiryAsRead(id: number): Promise<boolean> {
    await db.collection('propertyInquiries').doc(id.toString()).update({ isReadByAdmin: true });
    return true;
  }

  async markAllInquiriesAsRead(): Promise<boolean> {
    const s = await db.collection('propertyInquiries').where('isReadByAdmin', '==', false).get();
    if (s.empty) return true;
    const batch = db.batch();
    s.docs.forEach(d => batch.update(d.ref, { isReadByAdmin: true }));
    await batch.commit();
    return true;
  }

  // Favorites
  async getUserFavorites(userId: number): Promise<Favorite[]> {
    const s = await db.collection('favorites').where('userId', '==', userId).get();
    return s.docs.map(d => d.data() as Favorite);
  }

  async getFavoriteProperties(userId: number): Promise<Property[]> {
    const favs = await this.getUserFavorites(userId);
    const props = await Promise.all(favs.map(f => this.getProperty(f.propertyId)));
    return props.filter((p): p is Property => !!p);
  }

  async isFavorite(userId: number, propertyId: number): Promise<boolean> {
    const s = await db.collection('favorites')
      .where('userId', '==', userId)
      .where('propertyId', '==', propertyId)
      .limit(1)
      .get();
    return !s.empty;
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const id = await this.getNextId('favorites');
    const newFav = { ...favorite, id, createdAt: new Date() };
    await db.collection('favorites').doc(id.toString()).set(JSON.parse(JSON.stringify(newFav)));
    return newFav as unknown as Favorite;
  }

  async removeFavorite(userId: number, propertyId: number): Promise<boolean> {
    const s = await db.collection('favorites')
      .where('userId', '==', userId)
      .where('propertyId', '==', propertyId)
      .get();

    const batch = db.batch();
    s.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return true;
  }

  async initializeData(): Promise<void> {
    const adminUser = await this.getUserByUsername("admin");
    if (!adminUser) {
      console.log("Initializing data...");

      await this.createUser({
        username: "admin",
        password: await hashPassword("adminpass"),
        role: "admin"
      });
      await this.createUser({
        username: "user",
        password: await hashPassword("userpass"),
        role: "user"
      });

      await this.createAgent({
        name: "이가이버부동산",
        phone: "010-1234-5678",
        email: "eguyer@example.com",
        isActive: true
      });

      console.log("Basic data initialized.");
      // Note: Initial properties and news are skipped to save tokens. 
      // User can add them manually or we can add them in a separate step.
    }
  }
}

export const storage = new FirebaseStorage();