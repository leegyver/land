import { 
  properties, type Property, type InsertProperty,
  agents, type Agent, type InsertAgent,
  inquiries, type Inquiry, type InsertInquiry,
  users, type User, type InsertUser,
  news, type News, type InsertNews,
  propertyInquiries, type PropertyInquiry, type InsertPropertyInquiry,
  favorites, type Favorite, type InsertFavorite,
  newsletterSubscriptions, type NewsletterSubscription, type InsertNewsletterSubscription,
  crawledProperties, type CrawledProperty, type InsertCrawledProperty
} from "../shared/schema";
import { db, sqlite } from "./db";
import { eq, desc, asc, and, gte, lte, inArray } from "drizzle-orm";
import session from "express-session";
// @ts-ignore
import createSqliteStore from "better-sqlite3-session-store";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

const SqliteStore = createSqliteStore(session);

export interface IStorage {
  // Session Store
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

  // Favorites methods
  getUserFavorites(userId: number): Promise<Favorite[]>;
  getFavoriteProperties(userId: number): Promise<Property[]>;
  isFavorite(userId: number, propertyId: number): Promise<boolean>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, propertyId: number): Promise<boolean>;

  // Newsletter methods
  createNewsletterSubscription(subscription: InsertNewsletterSubscription): Promise<NewsletterSubscription>;
  getNewsletterSubscriptions(): Promise<NewsletterSubscription[]>;
  getNewsletterSubscriptionByEmail(email: string): Promise<NewsletterSubscription | undefined>;
  deleteNewsletterSubscription(id: number): Promise<boolean>;

  // Crawler methods
  createCrawledProperty(property: InsertCrawledProperty): Promise<CrawledProperty>;
  getCrawledProperties(): Promise<CrawledProperty[]>;
  getCrawledProperty(atclNo: string): Promise<CrawledProperty | undefined>;
  clearCrawledProperties(): Promise<void>;

  // Init Data
  initializeData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new SqliteStore({
      client: sqlite,
      expired: {
        clear: true,
        intervalMs: 900000 // 15 minutes
      }
    });
  }

  // Property methods
  async getProperties(): Promise<Property[]> {
    const results = await db.select()
      .from(properties)
      .where(eq(properties.isVisible, true))
      .orderBy(asc(properties.displayOrder), desc(properties.createdAt));

    return results.map(property => ({
      ...property,
      imageUrls: typeof property.imageUrls === 'string' ? JSON.parse(property.imageUrls) : (property.imageUrls || [])
    }));
  }

  async getAllProperties(): Promise<Property[]> {
    const results = await db.select()
      .from(properties)
      .orderBy(asc(properties.displayOrder), desc(properties.createdAt));

    return results.map(property => ({
      ...property,
      imageUrls: typeof property.imageUrls === 'string' ? JSON.parse(property.imageUrls) : (property.imageUrls || [])
    }));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const result = await db.select().from(properties).where(eq(properties.id, id));

    if (!result[0]) return undefined;

    return {
      ...result[0],
      imageUrls: typeof result[0].imageUrls === 'string' ? JSON.parse(result[0].imageUrls) : (result[0].imageUrls || [])
    };
  }

  async getFeaturedProperties(limit: number = 20): Promise<Property[]> {
    const results = await db.select()
      .from(properties)
      .where(and(eq(properties.featured, true), eq(properties.isVisible, true)))
      .orderBy(asc(properties.displayOrder), desc(properties.createdAt))
      .limit(limit);

    return results.map(property => ({
      ...property,
      imageUrls: typeof property.imageUrls === 'string' ? JSON.parse(property.imageUrls) : (property.imageUrls || [])
    }));
  }

  async getPropertiesByType(type: string): Promise<Property[]> {
    const results = await db.select()
      .from(properties)
      .where(and(eq(properties.type, type), eq(properties.isVisible, true)))
      .orderBy(asc(properties.displayOrder), desc(properties.createdAt));

    return results.map(property => ({
      ...property,
      imageUrls: typeof property.imageUrls === 'string' ? JSON.parse(property.imageUrls) : (property.imageUrls || [])
    }));
  }

  async getPropertiesByDistrict(district: string): Promise<Property[]> {
    const results = await db.select()
      .from(properties)
      .where(and(eq(properties.district, district), eq(properties.isVisible, true)))
      .orderBy(asc(properties.displayOrder), desc(properties.createdAt));

    return results.map(property => ({
      ...property,
      imageUrls: typeof property.imageUrls === 'string' ? JSON.parse(property.imageUrls) : (property.imageUrls || [])
    }));
  }

  async getPropertiesByPriceRange(min: number, max: number): Promise<Property[]> {
    const results = await db.select()
      .from(properties)
      .where(
        and(
          gte(properties.price, min.toString()),
          lte(properties.price, max.toString()),
          eq(properties.isVisible, true)
        )
      )
      .orderBy(asc(properties.displayOrder), desc(properties.createdAt));

    return results.map(property => ({
      ...property,
      imageUrls: typeof property.imageUrls === 'string' ? JSON.parse(property.imageUrls) : (property.imageUrls || [])
    }));
  }

  async getPropertiesByAddresses(addresses: string[]): Promise<Property[]> {
    if (addresses.length === 0) return [];
    const results = await db.select()
      .from(properties)
      .where(inArray(properties.address, addresses));
    return results.map(property => ({
      ...property,
      imageUrls: typeof property.imageUrls === 'string' ? JSON.parse(property.imageUrls) : (property.imageUrls || [])
    }));
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const propertyWithDefaultValues = {
      ...property,
      imageUrls: JSON.stringify(property.imageUrls || []),
      createdAt: new Date().toISOString()
    };

    const [result] = await db.insert(properties)
      .values(propertyWithDefaultValues)
      .returning();

    return {
      ...result,
      imageUrls: typeof result.imageUrls === 'string' ? JSON.parse(result.imageUrls) : (result.imageUrls || [])
    };
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const updateData: any = { ...property };
    if (property.imageUrls) {
      updateData.imageUrls = JSON.stringify(property.imageUrls);
    }

    const [result] = await db.update(properties)
      .set(updateData)
      .where(eq(properties.id, id))
      .returning();

    if (!result) return undefined;
    return {
      ...result,
      imageUrls: typeof result.imageUrls === 'string' ? JSON.parse(result.imageUrls) : (result.imageUrls || [])
    } as Property;
  }

  async deleteProperty(id: number): Promise<boolean> {
    const result = await db.delete(properties)
      .where(eq(properties.id, id))
      .returning();

    return result.length > 0;
  }

  async updatePropertyOrder(propertyId: number, newOrder: number): Promise<boolean> {
    const result = await db.update(properties)
      .set({ displayOrder: newOrder })
      .where(eq(properties.id, propertyId))
      .returning();

    return result.length > 0;
  }

  async togglePropertyVisibility(propertyId: number, isVisible: boolean): Promise<boolean> {
    const result = await db.update(properties)
      .set({ isVisible })
      .where(eq(properties.id, propertyId))
      .returning();

    return result.length > 0;
  }

  async togglePropertyFeatured(propertyId: number, featured: boolean): Promise<boolean> {
    const result = await db.update(properties)
      .set({ featured })
      .where(eq(properties.id, propertyId))
      .returning();

    return result.length > 0;
  }

  // Agent methods
  async getAgents(): Promise<Agent[]> {
    return await db.select().from(agents).where(eq(agents.isActive, true)).orderBy(asc(agents.id));
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    const result = await db.select().from(agents).where(eq(agents.id, id));
    return result[0];
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [result] = await db.insert(agents)
      .values({
        ...agent,
        createdAt: new Date().toISOString()
      })
      .returning();

    return result;
  }

  async updateAgent(id: number, agent: Partial<InsertAgent>): Promise<Agent | undefined> {
    const [result] = await db.update(agents)
      .set(agent)
      .where(eq(agents.id, id))
      .returning();

    return result;
  }

  async deleteAgent(id: number): Promise<boolean> {
    const result = await db.delete(agents)
      .where(eq(agents.id, id))
      .returning();

    return result.length > 0;
  }

  // Inquiry methods
  async getInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  }

  async getInquiry(id: number): Promise<Inquiry | undefined> {
    const result = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return result[0];
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [result] = await db.insert(inquiries)
      .values({
        ...inquiry,
        createdAt: new Date().toISOString()
      })
      .returning();

    return result;
  }

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
    const [result] = await db.insert(users)
      .values({
        ...insertUser,
        role: insertUser.role || "user",
        createdAt: new Date().toISOString()
      })
      .returning();

    return result;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [result] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();

    return result;
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
      const [result] = await db.insert(news)
        .values({
          ...newsItem,
          createdAt: new Date().toISOString()
        })
        .returning();

      return result;
    } catch (error) {
      console.error("Error creating news:", error);
      throw error;
    }
  }

  async updateNews(id: number, newsItem: Partial<InsertNews>): Promise<News | undefined> {
    try {
      const [result] = await db.update(news)
        .set(newsItem)
        .where(eq(news.id, id))
        .returning();

      return result;
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
    const adminUser = await this.getUserByUsername("admin");
    if (!adminUser) {
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
    }
  }

  // Property Inquiry methods
  async getPropertyInquiries(propertyId: number): Promise<(PropertyInquiry & { authorUsername?: string })[]> {
    try {
      const result = await db
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
      return result as (PropertyInquiry & { authorUsername?: string })[];
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
        .values({
          ...inquiry,
          createdAt: new Date().toISOString()
        })
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
      await db
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

      return results.map(property => ({
        ...property,
        imageUrls: typeof property.imageUrls === 'string' ? JSON.parse(property.imageUrls) : (property.imageUrls || [])
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
      const existing = await this.isFavorite(favorite.userId, favorite.propertyId);
      if (existing) {
        throw new Error("이미 관심 매물로 등록되어 있습니다.");
      }

      const [result] = await db.insert(favorites)
        .values({
          ...favorite,
          createdAt: new Date().toISOString()
        })
        .returning();

      return result;
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

  // 미읽은 문의글 관련 메서드
  async getUnreadInquiries(): Promise<PropertyInquiry[]> {
    try {
      return sqlite.prepare(
        "SELECT * FROM property_inquiries WHERE isReadByAdmin = 0 OR isReadByAdmin IS NULL ORDER BY createdAt DESC"
      ).all() as PropertyInquiry[];
    } catch { return []; }
  }

  async getUnreadInquiryCount(): Promise<number> {
    try {
      const row = sqlite.prepare(
        "SELECT COUNT(*) as c FROM property_inquiries WHERE isReadByAdmin = 0 OR isReadByAdmin IS NULL"
      ).get() as any;
      return row?.c || 0;
    } catch { return 0; }
  }

  async markInquiryAsRead(id: number): Promise<boolean> {
    try {
      sqlite.prepare("UPDATE property_inquiries SET isReadByAdmin = 1 WHERE id = ?").run(id);
      return true;
    } catch { return false; }
  }

  async markAllInquiriesAsRead(): Promise<boolean> {
    try {
      sqlite.prepare("UPDATE property_inquiries SET isReadByAdmin = 1 WHERE isReadByAdmin = 0 OR isReadByAdmin IS NULL").run();
      return true;
    } catch { return false; }
  }

  // Newsletter methods
  async createNewsletterSubscription(subscription: InsertNewsletterSubscription): Promise<NewsletterSubscription> {
    const [result] = await db.insert(newsletterSubscriptions)
      .values({
        ...subscription,
        createdAt: new Date().toISOString()
      })
      .returning();
    return result;
  }

  async getNewsletterSubscriptions(): Promise<NewsletterSubscription[]> {
    return db.select()
      .from(newsletterSubscriptions)
      .orderBy(desc(newsletterSubscriptions.createdAt));
  }

  async getNewsletterSubscriptionByEmail(email: string): Promise<NewsletterSubscription | undefined> {
    const [subscription] = await db.select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, email));
    return subscription;
  }

  async deleteNewsletterSubscription(id: number): Promise<boolean> {
    const result = await db.delete(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.id, id))
      .returning();
    return result.length > 0;
  }

  // Crawler methods
  async createCrawledProperty(property: InsertCrawledProperty): Promise<CrawledProperty> {
    const [existing] = await db.select().from(crawledProperties).where(eq(crawledProperties.atclNo, property.atclNo));
    
    if (existing) {
      const [updated] = await db.update(crawledProperties)
        .set({
          ...property,
          crawledAt: new Date().toISOString()
        })
        .where(eq(crawledProperties.atclNo, property.atclNo))
        .returning();
      return updated;
    }

    const [inserted] = await db.insert(crawledProperties)
      .values({
        ...property,
        crawledAt: new Date().toISOString()
      })
      .returning();
    return inserted;
  }

  async getCrawledProperties(): Promise<CrawledProperty[]> {
    return db.select()
      .from(crawledProperties)
      .orderBy(desc(crawledProperties.crawledAt))
      .limit(1000);
  }

  async getCrawledProperty(atclNo: string): Promise<CrawledProperty | undefined> {
    const [result] = await db.select()
      .from(crawledProperties)
      .where(eq(crawledProperties.atclNo, atclNo));
    return result;
  }

  async clearCrawledProperties(): Promise<void> {
    await db.delete(crawledProperties);
  }
}

export const storage = new DatabaseStorage();