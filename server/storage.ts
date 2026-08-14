import {
  type Property, type InsertProperty,
  type Agent, type InsertAgent,
  type Inquiry, type InsertInquiry,
  type User, type InsertUser,
  type News, type InsertNews,
  type PropertyInquiry, type InsertPropertyInquiry,
  type Favorite, type InsertFavorite,
  type Banner, type InsertBanner,
  type Notice, type InsertNotice,
  type CrawledProperty, type InsertCrawledProperty,
  type NewsletterSubscription, type InsertNewsletterSubscription,
  type Post, type InsertPost,
  type Comment as PostComment, type InsertComment as InsertPostComment,
  type Notification, type InsertNotification,
  type RealtorSubscription, type InsertRealtorSubscription,
  type AdminNotification, type InsertAdminNotification,
  type VisitLog, type InsertVisitLog,
  type SiteConfig, type InsertSiteConfig,
  type Popup, type InsertPopup
} from "@shared/schema";
import { db } from "./db";
import session from "express-session";
// @ts-ignore
import createSqliteStore from "better-sqlite3-session-store";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const SqliteStore = createSqliteStore(session);

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
  getLatestProperties(limit?: number): Promise<Property[]>;
  getPropertiesByOwner(ownerId: number): Promise<Property[]>;
  getPropertyByAtclNo(atclNo: string): Promise<Property | undefined>;
  searchInternalProperties(options: { isVisible?: boolean, district?: string | null, type?: string[] | null }): Promise<Property[]>;
  incrementPropertyViewCount(id: number): Promise<boolean>;

  // New methods for Urgent/Negotiable
  getUrgentProperties(limit?: number): Promise<Property[]>;
  getNegotiableProperties(limit?: number): Promise<Property[]>;
  togglePropertyUrgent(propertyId: number, isUrgent: boolean): Promise<boolean>;
  togglePropertyNegotiable(propertyId: number, isNegotiable: boolean): Promise<boolean>;
  updatePropertyUrgentOrder(propertyId: number, newOrder: number): Promise<boolean>;
  updatePropertyNegotiableOrder(propertyId: number, newOrder: number): Promise<boolean>;

  // Long-term Investment
  getLongTermProperties(limit?: number): Promise<Property[]>;
  togglePropertyLongTerm(propertyId: number, isLongTerm: boolean): Promise<boolean>;
  updatePropertyLongTermOrder(propertyId: number, newOrder: number): Promise<boolean>;

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
  updateUserRole(id: number, role: string, realtorInfo?: { businessName?: string; realtorName?: string; realtorPhone?: string; realtorPhoto?: string; realtorAddress?: string; realtorLicenseNo?: string }): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // News methods
  getNews(): Promise<News[]>;
  getLatestNews(limit?: number): Promise<News[]>;
  getNewsById(id: number): Promise<News | undefined>;
  getNewsByCategory(category: string): Promise<News[]>;
  getNewsByTitle(title: string): Promise<News | undefined>; // Added for News Fetcher
  createNews(news: InsertNews): Promise<News>;
  updateNews(id: number, news: Partial<InsertNews>): Promise<News | undefined>;
  deleteNews(id: number): Promise<boolean>;

  // Property Inquiry methods
  getPropertyInquiries(propertyId: number): Promise<PropertyInquiry[]>;
  getPropertyInquiry(id: number): Promise<PropertyInquiry | undefined>;
  createPropertyInquiry(inquiry: InsertPropertyInquiry): Promise<PropertyInquiry>;

  // Post (Community) methods
  getPosts(category?: string): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  incrementPostViewCount(id: number): Promise<boolean>;

  // Post Comments
  getPostComments(postId: number): Promise<PostComment[]>;
  createPostComment(comment: InsertPostComment): Promise<PostComment>;
  deletePostComment(id: number): Promise<boolean>;
  getPostComment(id: number): Promise<PostComment | undefined>;

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

  // Banner methods
  getBanners(location?: string): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: number, banner: Partial<InsertBanner>): Promise<Banner>;
  deleteBanner(id: number): Promise<boolean>;
  updateBannerOrder(id: number, newOrder: number): Promise<boolean>;

  // Popup methods
  getPopups(): Promise<Popup[]>;
  getActivePopups(): Promise<Popup[]>;
  getPopup(id: number): Promise<Popup | undefined>;
  createPopup(popup: InsertPopup): Promise<Popup>;
  updatePopup(id: number, popup: Partial<InsertPopup>): Promise<Popup | undefined>;
  deletePopup(id: number): Promise<boolean>;
  updatePopupOrder(id: number, newOrder: number): Promise<boolean>;


  // Notice methods
  getNotices(): Promise<Notice[]>;
  getNotice(id: number): Promise<Notice | undefined>;
  getPinnedNotice(): Promise<Notice | undefined>;
  createNotice(notice: InsertNotice): Promise<Notice>;
  updateNotice(id: number, notice: Partial<InsertNotice>): Promise<Notice | undefined>;
  deleteNotice(id: number): Promise<boolean>;
  incrementNoticeViewCount(id: number): Promise<void>;

  // Init Data
  initializeData(): Promise<void>;

  // Crawler methods
  createCrawledProperty(property: InsertCrawledProperty): Promise<CrawledProperty>;
  getCrawledProperties(): Promise<CrawledProperty[]>;
  getCrawledProperty(atclNo: string): Promise<CrawledProperty | undefined>;
  searchCrawledProperties(options: { district?: string | null, type?: string[] | null }): Promise<CrawledProperty[]>;
  clearCrawledProperties(): Promise<void>;

  // Realtor Subscription methods
  createRealtorSubscription(sub: InsertRealtorSubscription): Promise<RealtorSubscription>;
  getActiveRealtorSubscription(userId: number): Promise<RealtorSubscription | undefined>;

  // Newsletter methods
  createNewsletterSubscription(sub: InsertNewsletterSubscription): Promise<NewsletterSubscription>;
  deleteNewsletterSubscription(id: number): Promise<boolean>;
  getActiveNewsletterSubscribers(): Promise<NewsletterSubscription[]>;
  getWeeklyNewsletterData(): Promise<{ properties: Property[]; posts: Post[]; news: News[] }>;
  getMonthlyNewsletterData(): Promise<{ properties: Property[]; posts: Post[]; news: News[] }>;
  
  // Newsletter Logs
  insertNewsletterLog(log: Omit<import("@shared/schema").InsertNewsletterLog, "id" | "sentAt">): Promise<void>;
  getNewsletterLogs(limit?: number): Promise<import("@shared/schema").NewsletterLog[]>;

  // Notification methods
  getNotifications(limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;

  // Admin Notification methods
  getAdminNotifications(limit?: number): Promise<AdminNotification[]>;
  getUnreadAdminNotificationCount(): Promise<number>;
  createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification>;
  markAdminNotificationAsRead(id: number): Promise<boolean>;
  markAllAdminNotificationsAsRead(): Promise<boolean>;
  deleteAdminNotification(id: number): Promise<boolean>;

  // Visit Logs methods
  createVisitLog(log: InsertVisitLog): Promise<void>;
  getVisitStats(days: number): Promise<{ date: string; visitors: number; views: number }[]>;
  getPopularStats(): Promise<{
    properties: { id: number; title: string; views: number }[];
    posts: { id: number; title: string; views: number }[];
  }>;
  getOverviewStats(): Promise<{
    todayVisitors: number;
    totalVisitors: number;
    totalProperties: number;
    totalInquiries: number;
    todaySignups: number;
    totalUsers: number;
    realtorCount: number;
    normalUserCount: number;
    unreadInquiries: number;
    totalNewsletters: number;
  }>;

  getDetailedStats(): Promise<{
    propertyDistribution: { type: string; count: number }[];
    userRoleDistribution: { role: string; count: number }[];
    topReferrers: { referer: string; count: number }[];
    deviceDistribution: { device: string; count: number }[];
  }>;

  // Site Config methods
  getSiteConfig(key: string): Promise<string | undefined>;
  setSiteConfig(key: string, value: string): Promise<void>;
  getAllSiteConfigs(): Promise<SiteConfig[]>;
}

function extractKeywords(title: string): Set<string> {
  const stopWords = /강화군|강화도|강화|인천|부동산|뉴스|발견|비상|해안가|휴가철/g; // Added some common words to stop words but wait, '비상' was a good keyword!
  // Let's only remove truly generic words for our domain
  const genericWords = /강화군|강화도|강화|인천|부동산|뉴스/g;
  
  // Remove punctuation
  const cleanStr = title.replace(genericWords, '').replace(/[^가-힣a-zA-Z0-9\s]/g, ' ');
  const words = cleanStr.split(/\s+/).filter(w => w.length >= 2);
  
  // Create a set of keywords. We also create 2-char substrings from words to catch partial matches like "지뢰" from "목함지뢰" 
  // But exact word match is safer. Let's just return the words.
  return new Set(words);
}

function isDuplicateNews(news1: any, news2: any): boolean {
  // 1. Exact same image (and not a generic placeholder)
  if (news1.imageUrl && news2.imageUrl && news1.imageUrl === news2.imageUrl) {
    // If it's a very generic placeholder it might falsely match, but usually news images are specific.
    return true;
  }
  
  // 2. Keyword intersection
  const kw1 = extractKeywords(news1.title);
  const kw2 = extractKeywords(news2.title);
  
  let matchCount = 0;
  for (const w1 of Array.from(kw1)) {
    for (const w2 of Array.from(kw2)) {
      // If words are exactly same, or one is a significant substring of another (e.g. "목함지뢰" and "지뢰")
      if (w1 === w2 || (w1.length >= 3 && w2.includes(w1)) || (w2.length >= 3 && w1.includes(w2))) {
        matchCount++;
        break; // Count at most once per w1
      }
    }
  }
  
  // If they share 2 or more significant words, they are highly likely duplicates
  return matchCount >= 2;
}

function deduplicateNews(newsList: any[], limit: number = 5): any[] {
  const result: any[] = [];
  for (const news of newsList) {
    if (result.length >= limit) break;
    const isDuplicate = result.some(added => isDuplicateNews(added, news));
    if (!isDuplicate) {
      result.push(news);
    }
  }
  return result;
}

export class SQLiteStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new SqliteStore({
      client: db,
      expired: {
        clear: true,
        intervalMs: 900000 // 15min
      }
    });
    this.initializeTables();
    this.performMigrations();
  }

  private performMigrations() {
    try {
      console.log("Database migrations check starting...");
    } catch (error) {
      console.error("Migration check completed with some skipped items.");
    }
  }

  private initializeTables() {
    // Users
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        nickname TEXT,
        password TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        role TEXT DEFAULT 'user',
        provider TEXT,
        providerId TEXT,
        birthDate TEXT,
        birthTime TEXT,
        isLunar INTEGER DEFAULT 0,
        businessName TEXT,
        realtorName TEXT,
        realtorPhone TEXT,
        realtorPhoto TEXT,
        realtorAddress TEXT,
        realtorLicenseNo TEXT
      )
    `).run();

    try {
      const userCols = db.prepare('PRAGMA table_info(users)').all() as any[];
      const userMissing = [
        { name: 'realtorPhoto', type: 'TEXT' },
        { name: 'realtorAddress', type: 'TEXT' },
        { name: 'realtorLicenseNo', type: 'TEXT' },
        { name: 'nickname', type: 'TEXT' },
        { name: 'provider', type: 'TEXT' },
        { name: 'providerId', type: 'TEXT' },
        { name: 'birthDate', type: 'TEXT' },
        { name: 'birthTime', type: 'TEXT' },
        { name: 'isLunar', type: 'INTEGER DEFAULT 0' },
        { name: 'businessName', type: 'TEXT' },
        { name: 'realtorName', type: 'TEXT' },
        { name: 'realtorPhone', type: 'TEXT' },
        { name: 'isActive', type: 'INTEGER DEFAULT 1' },
        { name: 'isVerified', type: 'INTEGER DEFAULT 0' },
        { name: 'subscriptionTier', type: 'TEXT DEFAULT "free"' },
        { name: 'subscriptionExpiresAt', type: 'TEXT' },
      ];
      for (const col of userMissing) {
        if (!userCols.some(c => c.name === col.name)) {
          db.prepare(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`).run();
          console.log(`[Storage] Added ${col.name} column to users`);
        }
      }
    } catch (err) {
      console.error('[Storage] Migration error for users:', err);
    }

    // Properties
    db.prepare(`
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        price TEXT,
        address TEXT,
        district TEXT,
        size TEXT,
        bedrooms INTEGER,
        bathrooms INTEGER,
        imageUrl TEXT,
        imageUrls TEXT, -- JSON array
        featuredImageIndex INTEGER,
        agentId INTEGER,
        featured INTEGER DEFAULT 0, -- boolean
        displayOrder INTEGER DEFAULT 0,
        isUrgent INTEGER DEFAULT 0, -- boolean
        urgentOrder INTEGER DEFAULT 0,
        isNegotiable INTEGER DEFAULT 0, -- boolean
        negotiableOrder INTEGER DEFAULT 0,
        isLongTerm INTEGER DEFAULT 0, -- boolean
        longTermOrder INTEGER DEFAULT 0,
        isVisible INTEGER DEFAULT 1, -- boolean
        createdAt TEXT,
        updatedAt TEXT,
        buildingName TEXT,
        unitNumber TEXT,
        supplyArea TEXT,
        privateArea TEXT,
        areaSize TEXT,
        floor INTEGER,
        totalFloors INTEGER,
        direction TEXT,
        elevator INTEGER DEFAULT 0, -- boolean
        parking TEXT,
        heatingSystem TEXT,
        approvalDate TEXT,
        landType TEXT,
        zoneType TEXT,
        dealType TEXT, -- JSON array
        deposit TEXT,
        depositAmount TEXT,
        monthlyRent TEXT,
        maintenanceFee TEXT,
        ownerName TEXT,
        ownerPhone TEXT,
        tenantName TEXT,
        tenantPhone TEXT,
        clientName TEXT,
        clientPhone TEXT,
        specialNote TEXT,
        coListing INTEGER DEFAULT 0, -- boolean
        agentName TEXT,
        propertyDescription TEXT,
        privateNote TEXT,
        youtubeUrl TEXT,
        latitude REAL,
        longitude REAL,
        isSold INTEGER DEFAULT 0, -- boolean
        viewCount INTEGER DEFAULT 0,
        ownerId INTEGER,
        atclNo TEXT,
        source TEXT
      )
    `).run();

    // 2-1. Migration for new columns (latitude, longitude, etc.)
    try {
      const propCols = db.prepare('PRAGMA table_info(properties)').all() as any[];
      const propMissing = [
        { name: 'latitude', type: 'REAL' },
        { name: 'longitude', type: 'REAL' },
        { name: 'atclNo', type: 'TEXT' },
        { name: 'source', type: 'TEXT' },
        { name: 'featuredImageIndex', type: 'INTEGER' },
        { name: 'isUrgent', type: 'INTEGER DEFAULT 0' },
        { name: 'urgentOrder', type: 'INTEGER DEFAULT 0' },
        { name: 'isNegotiable', type: 'INTEGER DEFAULT 0' },
        { name: 'negotiableOrder', type: 'INTEGER DEFAULT 0' },
        { name: 'isLongTerm', type: 'INTEGER DEFAULT 0' },
        { name: 'longTermOrder', type: 'INTEGER DEFAULT 0' },
        { name: 'ownerId', type: 'INTEGER' },
        { name: 'viewCount', type: 'INTEGER DEFAULT 0' },
        { name: 'isSold', type: 'INTEGER DEFAULT 0' },
        { name: 'floorLevel', type: 'TEXT' }
      ];
      for (const col of propMissing) {
        if (!propCols.some(c => c.name === col.name)) {
          db.prepare(`ALTER TABLE properties ADD COLUMN ${col.name} ${col.type}`).run();
          console.log(`[Storage] Added ${col.name} column to properties`);
        }
      }
    } catch (err) {
      console.error('[Storage] Migration error for properties:', err);
    }

    // Agents
    db.prepare(`
      CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        position TEXT,
        photo TEXT,
        bio TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT
      )
    `).run();

    // Inquiries
    db.prepare(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        message TEXT,
        inquiryType TEXT,
        propertyId INTEGER,
        createdAt TEXT
      )
    `).run();

    // News
    db.prepare(`
      CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        summary TEXT,
        description TEXT,
        content TEXT,
        source TEXT,
        sourceUrl TEXT,
        url TEXT,
        imageUrl TEXT,
        category TEXT,
        isPinned INTEGER DEFAULT 0,
        createdAt TEXT
      )
    `).run();

    // Property Inquiries
    db.prepare(`
      CREATE TABLE IF NOT EXISTS propertyInquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        propertyId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        title TEXT,
        content TEXT,
        isReply INTEGER DEFAULT 0,
        parentId INTEGER,
        isReadByAdmin INTEGER DEFAULT 0,
        createdAt TEXT
      )
    `).run();

    // Favorites
    db.prepare(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        propertyId INTEGER NOT NULL,
        createdAt TEXT
      )
    `).run();

    // Banners
    db.prepare(`
      CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location TEXT NOT NULL, 
        imageUrl TEXT NOT NULL,
        linkUrl TEXT,
        openNewWindow INTEGER DEFAULT 0,
        displayOrder INTEGER DEFAULT 0,
        createdAt TEXT
      )
    `).run();

    // Notices
    db.prepare(`
      CREATE TABLE IF NOT EXISTS notices(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        imageUrls TEXT, -- JSON array
        isPinned INTEGER DEFAULT 0,
        authorId INTEGER,
        viewCount INTEGER DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT
      )
    `).run();

    try {
      const targetCols = db.prepare('PRAGMA table_info(notices)').all() as any[];
      const missingFields = [
        { name: 'imageUrls', type: 'TEXT' },
        { name: 'isPinned', type: 'INTEGER DEFAULT 0' },
        { name: 'authorId', type: 'INTEGER' },
        { name: 'viewCount', type: 'INTEGER DEFAULT 0' },
        { name: 'updatedAt', type: 'TEXT' }
      ];
      for (const col of missingFields) {
        if (!targetCols.some(c => c.name === col.name)) {
          db.prepare(`ALTER TABLE notices ADD COLUMN ${col.name} ${col.type}`).run();
          console.log(`[Storage] Added ${col.name} column to notices`);
        }
      }
    } catch (err) {
      console.error('[Storage] Migration error for notices:', err);
    }

    // Crawled Properties
    db.prepare(`
      CREATE TABLE IF NOT EXISTS crawled_properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        atclNo TEXT UNIQUE NOT NULL,
        atclNm TEXT,
        rletTpNm TEXT,
        tradTpNm TEXT,
        flrInfo TEXT,
        prc TEXT,
        spc1 TEXT,
        spc2 TEXT,
        direction TEXT,
        lat REAL,
        lng REAL,
        imgUrl TEXT,
        rltrNm TEXT,
        rentPrc TEXT,
        depositPrc TEXT,
        landType TEXT,
        zoneType TEXT,
        crawledAt TEXT
      )
    `).run();

    // Posts (Community)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        imageUrls TEXT, -- JSON array
        authorId INTEGER,
        viewCount INTEGER DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT
      )
    `).run();
    try { db.prepare("CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)").run(); } catch (e) { }

    // Realtor Subscriptions
    db.prepare(`
      CREATE TABLE IF NOT EXISTS realtor_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        planType TEXT NOT NULL,
        amount INTEGER NOT NULL,
        impUid TEXT,
        merchantUid TEXT,
        status TEXT DEFAULT 'active' NOT NULL,
        startDate TEXT,
        endDate TEXT,
        createdAt TEXT
      )
    `).run();

    // Newsletter Subscriptions
    db.prepare(`
      CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        isActive INTEGER DEFAULT 1
      )
    `).run();

    // Newsletter Logs
    db.prepare(`
      CREATE TABLE IF NOT EXISTS newsletter_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT NOT NULL,
        type TEXT NOT NULL,
        target TEXT NOT NULL,
        recipientCount INTEGER DEFAULT 0,
        success INTEGER DEFAULT 1,
        htmlContent TEXT NOT NULL,
        sentAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Notifications
    db.prepare(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info' NOT NULL,
        isRead INTEGER DEFAULT 0,
        linkUrl TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Admin Notifications
    db.prepare(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        relatedId INTEGER,
        title TEXT NOT NULL,
        content TEXT,
        isRead INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Visit Logs
    db.prepare(`
      CREATE TABLE IF NOT EXISTS visit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT,
        userAgent TEXT,
        path TEXT NOT NULL,
        referer TEXT,
        userId INTEGER,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Site Configs
    db.prepare(`
      CREATE TABLE IF NOT EXISTS site_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Popups
    db.prepare(`
      CREATE TABLE IF NOT EXISTS popups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        imageUrl TEXT,
        linkUrl TEXT,
        isActive INTEGER DEFAULT 1,
        displayOrder INTEGER DEFAULT 0,
        startDate TEXT,
        endDate TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  }

  // Types conversion helpers
  private toBoolean(val: number): boolean {
    return val === 1;
  }
  private toInt(val: boolean): number {
    return val ? 1 : 0;
  }
  private parseJSON(val: string): any {
    try { return JSON.parse(val); } catch { return []; }
  }

  private mapProperty(row: any): Property {
    if (!row) return row;
    return {
      ...row,
      imageUrls: this.parseJSON(row.imageUrls),
      dealType: this.parseJSON(row.dealType),
      featured: this.toBoolean(row.featured),
      isVisible: this.toBoolean(row.isVisible),
      isUrgent: this.toBoolean(row.isUrgent),
      isNegotiable: this.toBoolean(row.isNegotiable),
      isLongTerm: this.toBoolean(row.isLongTerm),
      elevator: this.toBoolean(row.elevator),
      coListing: this.toBoolean(row.coListing),
      isSold: this.toBoolean(row.isSold),
      // Keep as string to match schema.ts exactly, but provide Date if needed
      // If schema says text, these should ideally be strings
    };
  }

  private mapNotification(row: any): Notification {
    if (!row) return row;
    return {
      ...row,
      isRead: this.toBoolean(row.isRead),
      createdAt: new Date(row.createdAt)
    };
  }

  private mapUser(row: any): User {
    if (!row) return row;
    return {
      ...row,
      businessLicenseNo: row.realtorLicenseNo,
      isVerified: this.toBoolean(row.isVerified ?? 0),
      isLunar: this.toBoolean(row.isLunar),
      isActive: this.toBoolean(row.isActive)
    };
  }

  // --- Properties ---

  async getProperties(): Promise<Property[]> {
    const rows = db.prepare('SELECT * FROM properties WHERE isVisible = 1 ORDER BY displayOrder ASC, createdAt DESC').all() as any[];
    return rows.map(row => this.mapProperty(row));
  }

  async getAllProperties(): Promise<Property[]> {
    const rows = db.prepare('SELECT * FROM properties ORDER BY displayOrder ASC, createdAt DESC').all() as any[];
    return rows.map(row => this.mapProperty(row));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    return row ? this.mapProperty(row) : undefined;
  }

  async incrementPropertyViewCount(id: number): Promise<boolean> {
    const res = db.prepare('UPDATE properties SET viewCount = viewCount + 1 WHERE id = ?').run(id);
    return res.changes > 0;
  }

  async getFeaturedProperties(limit?: number): Promise<Property[]> {
    let query = 'SELECT * FROM properties WHERE featured = 1 AND isVisible = 1 ORDER BY displayOrder ASC, createdAt DESC';
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    const rows = db.prepare(query).all();
    return rows.map(row => this.mapProperty(row));
  }

  async getUrgentProperties(limit?: number): Promise<Property[]> {
    let query = 'SELECT * FROM properties WHERE isUrgent = 1 AND isVisible = 1 ORDER BY urgentOrder ASC, createdAt DESC';
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    const rows = db.prepare(query).all();
    return rows.map(row => this.mapProperty(row));
  }

  async getNegotiableProperties(limit?: number): Promise<Property[]> {
    let query = 'SELECT * FROM properties WHERE isNegotiable = 1 AND isVisible = 1 ORDER BY negotiableOrder ASC, createdAt DESC';
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    const rows = db.prepare(query).all();
    return rows.map(row => this.mapProperty(row));
  }

  async getLatestProperties(limit?: number): Promise<Property[]> {
    let query = 'SELECT * FROM properties WHERE isVisible = 1 ORDER BY createdAt DESC';
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    const rows = db.prepare(query).all();
    return rows.map(row => this.mapProperty(row));
  }

  async getPropertiesByOwner(ownerId: number): Promise<Property[]> {
    const rows = db.prepare('SELECT * FROM properties WHERE ownerId = ? ORDER BY createdAt DESC').all(ownerId);
    return rows.map(row => this.mapProperty(row));
  }

  async getPropertyByAtclNo(atclNo: string): Promise<Property | undefined> {
    const row = db.prepare('SELECT * FROM properties WHERE atclNo = ?').get(atclNo);
    return row ? this.mapProperty(row) : undefined;
  }

  async searchInternalProperties(options: { isVisible?: boolean, district?: string | null, type?: string[] | null }): Promise<Property[]> {
    let query = 'SELECT * FROM properties WHERE 1=1';
    const params: any[] = [];

    if (options.isVisible !== undefined) {
      query += ' AND isVisible = ?';
      params.push(options.isVisible ? 1 : 0);
    }

    if (options.district && options.district !== 'all') {
      query += ' AND district LIKE ?';
      params.push(`%${options.district}%`);
    }

    if (options.type && options.type.length > 0) {
      const placeholders = options.type.map(() => '?').join(',');
      query += ` AND type IN (${placeholders})`;
      params.push(...options.type);
    }

    query += ' ORDER BY displayOrder ASC, createdAt DESC';
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(row => this.mapProperty(row));
  }

  async getPropertiesByType(type: string): Promise<Property[]> {
    const rows = db.prepare('SELECT * FROM properties WHERE type = ? AND isVisible = 1 ORDER BY displayOrder ASC, createdAt DESC').all(type);
    return rows.map(row => this.mapProperty(row));
  }

  async getPropertiesByDistrict(district: string): Promise<Property[]> {
    const rows = db.prepare('SELECT * FROM properties WHERE district = ? AND isVisible = 1 ORDER BY displayOrder ASC, createdAt DESC').all(district);
    return rows.map(row => this.mapProperty(row));
  }

  async getPropertiesByPriceRange(min: number, max: number): Promise<Property[]> {
    // Note: price is string in schema. Assuming simple numeric check works if content is clean.
    // SQLite isn't great at comparing mixed strings/numbers, but we'll try CAST
    // Or just fetch and filter JS side since we limit rows anyway.
    const rows = db.prepare('SELECT * FROM properties WHERE isVisible = 1').all();
    return rows.map(row => this.mapProperty(row)).filter(p => {
      const val = Number(p.price || 0);
      return val >= min && val <= max;
    });
  }

  async getPropertiesByAddresses(addresses: string[]): Promise<Property[]> {
    if (addresses.length === 0) return [];
    const placeholders = addresses.map(() => '?').join(',');
    const rows = db.prepare(`SELECT * FROM properties WHERE address IN(${placeholders}) LIMIT 10`).all(addresses.slice(0, 10));
    return rows.map(row => this.mapProperty(row));
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO properties(
        title, description, type, price, address, district, size, bedrooms, bathrooms,
        imageUrl, imageUrls, agentId, featured, displayOrder, isUrgent, urgentOrder,
        isNegotiable, negotiableOrder, isLongTerm, longTermOrder, isVisible, createdAt, updatedAt,
        buildingName, unitNumber, supplyArea, privateArea, areaSize, floor, totalFloors, floorLevel,
        direction, elevator, parking, heatingSystem, approvalDate, landType, zoneType,
        dealType, deposit, depositAmount, monthlyRent, maintenanceFee, ownerName,
        ownerPhone, tenantName, tenantPhone, clientName, clientPhone, specialNote,
        coListing, agentName, propertyDescription, privateNote, youtubeUrl,
        latitude, longitude, isSold, viewCount, ownerId, atclNo, source
      ) VALUES(
        @title, @description, @type, @price, @address, @district, @size, @bedrooms, @bathrooms,
        @imageUrl, @imageUrls, @agentId, @featured, @displayOrder, @isUrgent, @urgentOrder,
        @isNegotiable, @negotiableOrder, @isLongTerm, @longTermOrder, @isVisible, @createdAt, @updatedAt,
        @buildingName, @unitNumber, @supplyArea, @privateArea, @areaSize, @floor, @totalFloors, @floorLevel,
        @direction, @elevator, @parking, @heatingSystem, @approvalDate, @landType, @zoneType,
        @dealType, @deposit, @depositAmount, @monthlyRent, @maintenanceFee, @ownerName,
        @ownerPhone, @tenantName, @tenantPhone, @clientName, @clientPhone, @specialNote,
        @coListing, @agentName, @propertyDescription, @privateNote, @youtubeUrl,
        @latitude, @longitude, @isSold, @viewCount, @ownerId, @atclNo, @source
      )
    `).run({
      ...property,
      imageUrls: JSON.stringify(property.imageUrls || []),
      dealType: JSON.stringify(property.dealType || []),
      featured: this.toInt(property.featured ?? false),
      displayOrder: property.displayOrder ?? 0,
      isUrgent: this.toInt(property.isUrgent ?? false),
      urgentOrder: property.urgentOrder ?? 0,
      isNegotiable: this.toInt(property.isNegotiable ?? false),
      negotiableOrder: property.negotiableOrder ?? 0,
      isLongTerm: this.toInt(property.isLongTerm ?? false),
      longTermOrder: property.longTermOrder ?? 0,
      isVisible: this.toInt(property.isVisible ?? true),
      elevator: this.toInt(property.elevator ?? false),
      coListing: this.toInt(property.coListing ?? false),
      isSold: this.toInt(property.isSold ?? false),
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
      // Handle optional undefineds
      buildingName: property.buildingName || null,
      unitNumber: property.unitNumber || null,
      supplyArea: property.supplyArea || null,
      privateArea: property.privateArea || null,
      areaSize: property.areaSize || null,
      floor: property.floor || null,
      totalFloors: property.totalFloors || null,
      floorLevel: property.floorLevel || null,
      direction: property.direction || null,
      parking: property.parking || null,
      heatingSystem: property.heatingSystem || null,
      approvalDate: property.approvalDate || null,
      landType: property.landType || null,
      zoneType: property.zoneType || null,
      deposit: property.deposit || null,
      depositAmount: property.depositAmount || null,
      monthlyRent: property.monthlyRent || null,
      maintenanceFee: property.maintenanceFee || null,
      ownerName: property.ownerName || null,
      ownerPhone: property.ownerPhone || null,
      tenantName: property.tenantName || null,
      tenantPhone: property.tenantPhone || null,
      clientName: property.clientName || null,
      clientPhone: property.clientPhone || null,
      specialNote: property.specialNote || null,
      agentName: property.agentName || null,
      propertyDescription: property.propertyDescription || null,
      privateNote: property.privateNote || null,
      youtubeUrl: property.youtubeUrl || null,
      latitude: property.latitude || null,
      longitude: property.longitude || null,
      ownerId: property.ownerId || null,
      atclNo: property.atclNo || null,
      source: property.source || null
    });

    return this.getProperty(result.lastInsertRowid as number) as Promise<Property>;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const existing = await this.getProperty(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any = { id };

    // 이미 처리된 키를 추적하여 중복 방지
    const processed = new Set<string>();

    const addField = (key: string, val: any) => {
      if (processed.has(key)) return; // 중복 방지
      processed.add(key);
      fields.push(`${key} = @${key}`);
      values[key] = val;
    };

    // boolean 필드: SQLite는 boolean을 지원하지 않으므로 0/1로 변환
    const booleanFields = ['featured', 'isVisible', 'isUrgent', 'isNegotiable', 'isLongTerm', 'elevator', 'coListing', 'isSold'];

    // 배열/JSON 필드: JSON.stringify 필요
    const jsonFields = ['imageUrls', 'dealType'];

    // property 객체의 모든 키를 순회하며 안전하게 처리
    for (const key of Object.keys(property)) {
      // @ts-ignore
      const val = property[key];
      if (val === undefined) continue;

      if (booleanFields.includes(key)) {
        // boolean → 0/1 정수로 변환
        addField(key, this.toInt(val ?? false));
      } else if (jsonFields.includes(key)) {
        // 배열/객체 → JSON 문자열로 변환
        addField(key, JSON.stringify(val));
      } else if (val === null) {
        addField(key, null);
      } else if (typeof val === 'object') {
        // 기타 객체는 JSON 문자열로 변환 (안전장치)
        addField(key, JSON.stringify(val));
      } else if (typeof val === 'boolean') {
        // 명시적으로 정의되지 않은 boolean도 안전하게 변환
        addField(key, this.toInt(val));
      } else {
        // string, number, bigint: SQLite에서 직접 바인딩 가능
        addField(key, val);
      }
    }

    // updatedAt 항상 갱신
    addField('updatedAt', now);

    if (fields.length === 0) return this.getProperty(id);

    const query = `UPDATE properties SET ${fields.join(', ')} WHERE id = @id`;
    db.prepare(query).run(values);

    return this.getProperty(id);
  }

  async deleteProperty(id: number): Promise<boolean> {
    const res = db.prepare('DELETE FROM properties WHERE id = ?').run(id);
    return res.changes > 0;
  }

  async updatePropertyOrder(propertyId: number, newOrder: number): Promise<boolean> {
    db.prepare('UPDATE properties SET displayOrder = ? WHERE id = ?').run(newOrder, propertyId);
    return true;
  }

  async togglePropertyVisibility(propertyId: number, isVisible: boolean): Promise<boolean> {
    db.prepare('UPDATE properties SET isVisible = ? WHERE id = ?').run(this.toInt(isVisible ?? true), propertyId);
    return true;
  }

  async togglePropertyFeatured(propertyId: number, featured: boolean): Promise<boolean> {
    db.prepare('UPDATE properties SET featured = ? WHERE id = ?').run(this.toInt(featured ?? false), propertyId);
    return true;
  }

  async togglePropertyUrgent(propertyId: number, isUrgent: boolean): Promise<boolean> {
    db.prepare('UPDATE properties SET isUrgent = ? WHERE id = ?').run(this.toInt(isUrgent ?? false), propertyId);
    return true;
  }

  async togglePropertyNegotiable(propertyId: number, isNegotiable: boolean): Promise<boolean> {
    db.prepare('UPDATE properties SET isNegotiable = ? WHERE id = ?').run(this.toInt(isNegotiable ?? false), propertyId);
    return true;
  }

  async updatePropertyUrgentOrder(propertyId: number, newOrder: number): Promise<boolean> {
    db.prepare('UPDATE properties SET urgentOrder = ? WHERE id = ?').run(newOrder, propertyId);
    return true;
  }

  async updatePropertyNegotiableOrder(propertyId: number, newOrder: number): Promise<boolean> {
    db.prepare('UPDATE properties SET negotiableOrder = ? WHERE id = ?').run(newOrder, propertyId);
    return true;
  }

  async getLongTermProperties(limit?: number): Promise<Property[]> {
    let query = 'SELECT * FROM properties WHERE isLongTerm = 1 AND isVisible = 1 ORDER BY longTermOrder ASC, createdAt DESC';
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    const rows = db.prepare(query).all();
    return rows.map(row => this.mapProperty(row));
  }

  async togglePropertyLongTerm(propertyId: number, isLongTerm: boolean): Promise<boolean> {
    db.prepare('UPDATE properties SET isLongTerm = ? WHERE id = ?').run(this.toInt(isLongTerm ?? false), propertyId);
    return true;
  }

  async updatePropertyLongTermOrder(propertyId: number, newOrder: number): Promise<boolean> {
    db.prepare('UPDATE properties SET longTermOrder = ? WHERE id = ?').run(newOrder, propertyId);
    return true;
  }

  // --- Agents ---
  async getAgents(): Promise<Agent[]> {
    const rows = db.prepare('SELECT * FROM agents WHERE isActive = 1 ORDER BY id').all();
    return rows as Agent[];
  }
  async getAgent(id: number): Promise<Agent | undefined> {
    return db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as Agent | undefined;
  }
  async createAgent(agent: InsertAgent): Promise<Agent> {
    const res = db.prepare(`
      INSERT INTO agents(name, email, phone, position, photo, bio, isActive, createdAt)
    VALUES(@name, @email, @phone, @position, @photo, @bio, @isActive, @createdAt)
    `).run({
      ...agent,
      isActive: this.toInt(agent.isActive ?? true),
      createdAt: new Date().toISOString()
    });
    return this.getAgent(res.lastInsertRowid as number) as Promise<Agent>;
  }
  async updateAgent(id: number, agent: Partial<InsertAgent>): Promise<Agent | undefined> {
    // Simplified update... see Property for full dynamic logic
    // For now assuming full object or key specific
    const fields = Object.keys(agent).map(k => `${k} = @${k} `).join(', ');
    if (!fields) return this.getAgent(id);
    db.prepare(`UPDATE agents SET ${fields} WHERE id = @id`).run({ ...agent, id });
    return this.getAgent(id);
  }
  async deleteAgent(id: number): Promise<boolean> {
    db.prepare('DELETE FROM agents WHERE id = ?').run(id);
    return true;
  }

  // --- Inquiries ---
  async getInquiries(): Promise<Inquiry[]> {
    return db.prepare('SELECT * FROM inquiries ORDER BY createdAt DESC').all() as Inquiry[];
  }
  async getInquiry(id: number): Promise<Inquiry | undefined> {
    return db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id) as Inquiry | undefined;
  }
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const res = db.prepare(`
       INSERT INTO inquiries(name, email, phone, message, inquiryType, propertyId, createdAt)
    VALUES(@name, @email, @phone, @message, @inquiryType, @propertyId, @createdAt)
      `).run({
      ...inquiry,
      propertyId: inquiry.propertyId || null,
      createdAt: new Date().toISOString()
    });
    return this.getInquiry(res.lastInsertRowid as number) as Promise<Inquiry>;
  }

  // --- Users ---
  async getUser(id: number): Promise<User | undefined> {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return row ? this.mapUser(row) : undefined;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    return row ? this.mapUser(row) : undefined;
  }
  async createUser(user: InsertUser): Promise<User> {
    const res = db.prepare(`
      INSERT INTO users(username, nickname, password, email, phone, role, provider, providerId, birthDate, birthTime, isLunar, businessName, realtorName, realtorPhone)
    VALUES(@username, @nickname, @password, @email, @phone, @role, @provider, @providerId, @birthDate, @birthTime, @isLunar, @businessName, @realtorName, @realtorPhone)
    `).run({
      username: user.username,
      nickname: user.nickname || null,
      password: user.password,
      email: user.email || null,
      phone: user.phone || null,
      role: user.role || 'user',
      provider: user.provider || null,
      providerId: user.providerId ? String(user.providerId) : null,
      birthDate: user.birthDate || null,
      birthTime: user.birthTime || null,
      isLunar: this.toInt(user.isLunar ?? false),
      businessName: user.businessName || null,
      realtorName: user.realtorName || null,
      realtorPhone: user.realtorPhone || null
    });
    return this.getUser(res.lastInsertRowid as number) as Promise<User>;
  }
  async getAllUsers(): Promise<User[]> {
    const rows = db.prepare('SELECT * FROM users').all();
    return rows.map(row => this.mapUser(row));
  }
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const dbUser: any = { ...user };
    
    // 보안: 허용된 컬럼명만 사용 (SQL 인젝션 방지)
    const ALLOWED_COLUMNS = [
      'username', 'nickname', 'password', 'email', 'phone', 'role',
      'provider', 'providerId', 'birthDate', 'birthTime', 'isLunar',
      'businessName', 'realtorName', 'realtorPhone', 'realtorAddress',
      'realtorPhoto', 'realtorLicenseNo', 'businessLicenseNo',
      'isVerified', 'isActive', 'subscriptionTier', 'subscriptionExpiresAt'
    ];
    
    // Map TypeScript keys to Database columns
    if ('businessLicenseNo' in dbUser) {
      dbUser.realtorLicenseNo = dbUser.businessLicenseNo;
      delete dbUser.businessLicenseNo;
    }
    
    if (dbUser.isVerified !== undefined) dbUser.isVerified = this.toInt(dbUser.isVerified);
    if (dbUser.isLunar !== undefined) dbUser.isLunar = this.toInt(dbUser.isLunar);
    if (dbUser.isActive !== undefined) dbUser.isActive = this.toInt(dbUser.isActive);

    // 보안: 허용되지 않은 키 제거
    for (const key of Object.keys(dbUser)) {
      if (!ALLOWED_COLUMNS.includes(key)) {
        delete dbUser[key];
      }
    }

    const fields = Object.keys(dbUser).map(k => `${k} = @${k}`).join(', ');
    if (!fields) return this.getUser(id);

    const params: any = { ...dbUser, id };
    db.prepare(`UPDATE users SET ${fields} WHERE id = @id`).run(params);
    return this.getUser(id);
  }
  async updateUserRole(id: number, role: string, realtorInfo?: { businessName?: string; realtorName?: string; realtorPhone?: string; realtorPhoto?: string; realtorAddress?: string; realtorLicenseNo?: string }): Promise<User | undefined> {
    const fields = ["role = @role"];
    const params: any = { id, role };

    if (realtorInfo) {
      if (realtorInfo.businessName !== undefined) { fields.push("businessName = @businessName"); params.businessName = realtorInfo.businessName; }
      if (realtorInfo.realtorName !== undefined) { fields.push("realtorName = @realtorName"); params.realtorName = realtorInfo.realtorName; }
      if (realtorInfo.realtorPhone !== undefined) { fields.push("realtorPhone = @realtorPhone"); params.realtorPhone = realtorInfo.realtorPhone; }
      if (realtorInfo.realtorPhoto !== undefined) { fields.push("realtorPhoto = @realtorPhoto"); params.realtorPhoto = realtorInfo.realtorPhoto; }
      if (realtorInfo.realtorAddress !== undefined) { fields.push("realtorAddress = @realtorAddress"); params.realtorAddress = realtorInfo.realtorAddress; }
      if (realtorInfo.realtorLicenseNo !== undefined) { fields.push("realtorLicenseNo = @realtorLicenseNo"); params.realtorLicenseNo = realtorInfo.realtorLicenseNo; }
    }

    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = @id`).run(params);
    return this.getUser(id);
  }

  async deleteUser(id: number): Promise<boolean> {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return true;
  }

  // --- News ---
  async getNews(): Promise<News[]> {
    return db.prepare('SELECT * FROM news ORDER BY createdAt DESC').all() as News[];
  }
  async getLatestNews(limit: number = 6): Promise<News[]> {
    return db.prepare('SELECT * FROM news ORDER BY createdAt DESC LIMIT ?').all(limit) as News[];
  }
  async getNewsById(id: number): Promise<News | undefined> {
    return db.prepare('SELECT * FROM news WHERE id = ?').get(id) as News | undefined;
  }
  async getNewsByCategory(category: string): Promise<News[]> {
    return db.prepare('SELECT * FROM news WHERE category = ? ORDER BY createdAt DESC').all(category) as News[];
  }

  // Implemented for News Fetcher
  async getNewsByTitle(title: string): Promise<News | undefined> {
    return db.prepare('SELECT * FROM news WHERE title = ?').get(title) as News | undefined;
  }

  async createNews(news: InsertNews): Promise<News> {
    const res = db.prepare(`
      INSERT INTO news(title, summary, description, content, source, sourceUrl, url, imageUrl, category, isPinned, createdAt)
    VALUES(@title, @summary, @description, @content, @source, @sourceUrl, @url, @imageUrl, @category, @isPinned, @createdAt)
    `).run({
      ...news,
      imageUrl: news.imageUrl || null,
      isPinned: this.toInt(news.isPinned ?? false),
      createdAt: new Date().toISOString()
    });
    return this.getNewsById(res.lastInsertRowid as number) as Promise<News>;
  }
  async updateNews(id: number, news: Partial<InsertNews>): Promise<News | undefined> {
    const fields = Object.keys(news).map(k => `${k} = @${k} `).join(', ');
    if (!fields) return this.getNewsById(id);
    db.prepare(`UPDATE news SET ${fields} WHERE id = @id`).run({ ...news, id });
    return this.getNewsById(id);
  }
  async deleteNews(id: number): Promise<boolean> {
    db.prepare('DELETE FROM news WHERE id = ?').run(id);
    return true;
  }

  // --- Property Inquiries ---
  async getPropertyInquiries(propertyId: number): Promise<PropertyInquiry[]> {
    const rows = db.prepare('SELECT * FROM propertyInquiries WHERE propertyId = ? ORDER BY createdAt DESC').all(propertyId) as any[];
    return rows.map(row => ({
      ...row,
      isReply: this.toBoolean(row.isReply),
      isReadByAdmin: this.toBoolean(row.isReadByAdmin)
    })) as PropertyInquiry[];
  }
  async getPropertyInquiry(id: number): Promise<PropertyInquiry | undefined> {
    const row = db.prepare('SELECT * FROM propertyInquiries WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return { ...row, isReply: this.toBoolean(row.isReply), isReadByAdmin: this.toBoolean(row.isReadByAdmin) } as PropertyInquiry;
  }
  async createPropertyInquiry(inquiry: InsertPropertyInquiry): Promise<PropertyInquiry> {
    const res = db.prepare(`
       INSERT INTO propertyInquiries(propertyId, userId, title, content, isReply, parentId, isReadByAdmin, createdAt)
    VALUES(@propertyId, @userId, @title, @content, @isReply, @parentId, @isReadByAdmin, @createdAt)
     `).run({
      ...inquiry,
      parentId: inquiry.parentId || null,
      isReply: this.toInt(inquiry.isReply ?? false),
      isReadByAdmin: 0,
      createdAt: new Date().toISOString()
    });
    return this.getPropertyInquiry(res.lastInsertRowid as number) as Promise<PropertyInquiry>;
  }
  async updatePropertyInquiry(id: number, inquiry: Partial<InsertPropertyInquiry>): Promise<PropertyInquiry | undefined> {
    // ... similar update ...
    const fields = Object.keys(inquiry).map(k => `${k} = @${k} `).join(', ');
    if (!fields) return this.getPropertyInquiry(id);

    // Handle boolean conv
    const params: any = { ...inquiry, id };
    if (inquiry.isReply !== undefined) params.isReply = this.toInt(inquiry.isReply);
    if (inquiry.isReadByAdmin !== undefined) params.isReadByAdmin = this.toInt(inquiry.isReadByAdmin);

    db.prepare(`UPDATE propertyInquiries SET ${fields} WHERE id = @id`).run(params);
    return this.getPropertyInquiry(id);
  }
  async deletePropertyInquiry(id: number): Promise<boolean> {
    db.prepare('DELETE FROM propertyInquiries WHERE id = ?').run(id);
    return true;
  }
  async getUnreadInquiries(): Promise<(PropertyInquiry & { authorUsername?: string; propertyTitle?: string })[]> {
    const rows: any[] = db.prepare('SELECT * FROM propertyInquiries WHERE isReadByAdmin = 0 ORDER BY createdAt DESC').all();

    // Join manually usually, but here we can just fetch.
    // Ideally use SQL JOIN: 
    // SELECT pi.*, u.username as authorUsername, p.title as propertyTitle 
    // FROM propertyInquiries pi 
    // LEFT JOIN users u ON pi.userId = u.id 
    // LEFT JOIN properties p ON pi.propertyId = p.id
    // WHERE pi.isReadByAdmin = 0

    const joined = db.prepare(`
      SELECT pi.*, u.username as authorUsername, p.title as propertyTitle 
      FROM propertyInquiries pi 
      LEFT JOIN users u ON pi.userId = u.id 
      LEFT JOIN properties p ON pi.propertyId = p.id
      WHERE pi.isReadByAdmin = 0
      ORDER BY pi.createdAt DESC
      `).all() as any[];

    return joined.map(row => ({
      ...row,
      isReply: this.toBoolean(row.isReply),
      isReadByAdmin: this.toBoolean(row.isReadByAdmin)
    })) as (PropertyInquiry & { authorUsername?: string; propertyTitle?: string })[];
  }

  async getUnreadInquiryCount(): Promise<number> {
    const res = db.prepare('SELECT COUNT(*) as count FROM propertyInquiries WHERE isReadByAdmin = 0').get() as { count: number };
    return res.count;
  }
  async markInquiryAsRead(id: number): Promise<boolean> {
    db.prepare('UPDATE propertyInquiries SET isReadByAdmin = 1 WHERE id = ?').run(id);
    return true;
  }
  async markAllInquiriesAsRead(): Promise<boolean> {
    db.prepare('UPDATE propertyInquiries SET isReadByAdmin = 1 WHERE isReadByAdmin = 0').run();
    return true;
  }

  // --- Favorites ---
  async getUserFavorites(userId: number): Promise<Favorite[]> {
    return db.prepare('SELECT * FROM favorites WHERE userId = ?').all(userId) as Favorite[];
  }
  async getFavoriteProperties(userId: number): Promise<Property[]> {
    const rows = db.prepare(`
       SELECT p.* FROM properties p
       JOIN favorites f ON p.id = f.propertyId
       WHERE f.userId = ?
      `).all(userId);
    return rows.map(row => this.mapProperty(row));
  }
  async isFavorite(userId: number, propertyId: number): Promise<boolean> {
    const res = db.prepare('SELECT 1 FROM favorites WHERE userId = ? AND propertyId = ?').get(userId, propertyId);
    return !!res;
  }
  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const res = db.prepare('INSERT INTO favorites (userId, propertyId, createdAt) VALUES (?, ?, ?)').run(
      favorite.userId, favorite.propertyId, new Date().toISOString()
    );
    return { id: res.lastInsertRowid as number, userId: favorite.userId, propertyId: favorite.propertyId, createdAt: new Date().toISOString() };
  }
  async removeFavorite(userId: number, propertyId: number): Promise<boolean> {
    db.prepare('DELETE FROM favorites WHERE userId = ? AND propertyId = ?').run(userId, propertyId);
    return true;
  }

  // --- Banner Methods ---
  async getBanners(location?: string): Promise<Banner[]> {
    let query = "SELECT * FROM banners";
    const params: any[] = [];

    if (location) {
      query += " WHERE location = ?";
      params.push(location);
    }

    query += " ORDER BY displayOrder ASC, createdAt DESC";

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(row => ({
      ...row,
      openNewWindow: this.toBoolean(row.openNewWindow),
      createdAt: new Date(row.createdAt)
    })) as Banner[];
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const result = db.prepare(`
      INSERT INTO banners(location, imageUrl, linkUrl, openNewWindow, displayOrder, createdAt)
    VALUES(?, ?, ?, ?, ?, ?)
      `).run(
      banner.location,
      banner.imageUrl,
      banner.linkUrl || null,
      this.toInt(banner.openNewWindow ?? false),
      banner.displayOrder || 0,
      new Date().toISOString()
    );

    // Fetch specifically to return correct types
    const newBanner = db.prepare("SELECT * FROM banners WHERE id = ?").get(result.lastInsertRowid) as any;
    return {
      ...newBanner,
      openNewWindow: this.toBoolean(newBanner.openNewWindow),
      createdAt: new Date(newBanner.createdAt)
    } as Banner;
  }

  async updateBanner(id: number, data: Partial<InsertBanner>): Promise<Banner> {
    const existing = db.prepare('SELECT * FROM banners WHERE id = ?').get(id) as any;
    if (!existing) throw new Error("Banner not found");

    const imageUrl = data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl;
    const linkUrl = data.linkUrl !== undefined ? data.linkUrl : existing.linkUrl;
    const openNewWindow = data.openNewWindow !== undefined ? this.toInt(data.openNewWindow) : existing.openNewWindow;
    const location = data.location !== undefined ? data.location : existing.location;
    const displayOrder = data.displayOrder !== undefined ? data.displayOrder : existing.displayOrder;

    db.prepare(`
      UPDATE banners 
      SET location = ?, imageUrl = ?, linkUrl = ?, openNewWindow = ?, displayOrder = ?
      WHERE id = ?
    `).run(location, imageUrl, linkUrl, openNewWindow, displayOrder, id);

    const updated = db.prepare("SELECT * FROM banners WHERE id = ?").get(id) as any;
    return {
      ...updated,
      openNewWindow: this.toBoolean(updated.openNewWindow),
      createdAt: new Date(updated.createdAt)
    } as Banner;
  }

  async deleteBanner(id: number): Promise<boolean> {
    const res = db.prepare('DELETE FROM banners WHERE id = ?').run(id);
    return res.changes > 0;
  }

  async updateBannerOrder(id: number, newOrder: number): Promise<boolean> {
    db.prepare('UPDATE banners SET displayOrder = ? WHERE id = ?').run(newOrder, id);
    return true;
  }

  // --- Notices ---
  async getNotices(): Promise<Notice[]> {
    const rows = db.prepare('SELECT * FROM notices ORDER BY isPinned DESC, createdAt DESC').all();
    return rows.map((row: any) => ({
      ...row,
      imageUrls: this.parseJSON(row.imageUrls),
      isPinned: this.toBoolean(row.isPinned),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    })) as Notice[];
  }

  async getNotice(id: number): Promise<Notice | undefined> {
    const row = db.prepare('SELECT * FROM notices WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      imageUrls: this.parseJSON(row.imageUrls),
      isPinned: this.toBoolean(row.isPinned),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    } as Notice;
  }

  async getPinnedNotice(): Promise<Notice | undefined> {
    const row = db.prepare('SELECT * FROM notices WHERE isPinned = 1 ORDER BY createdAt DESC LIMIT 1').get() as any;
    if (!row) return undefined;
    return {
      ...row,
      imageUrls: this.parseJSON(row.imageUrls),
      isPinned: this.toBoolean(row.isPinned),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    } as Notice;
  }

  async createNotice(notice: InsertNotice): Promise<Notice> {
    const now = new Date().toISOString();
    const res = db.prepare(`
      INSERT INTO notices(title, content, imageUrls, isPinned, authorId, viewCount, createdAt, updatedAt)
    VALUES(@title, @content, @imageUrls, @isPinned, @authorId, 0, @createdAt, @updatedAt)
    `).run({
      ...notice,
      imageUrls: JSON.stringify(notice.imageUrls || []),
      isPinned: this.toInt(notice.isPinned ?? false),
      createdAt: now,
      updatedAt: now
    });
    return this.getNotice(res.lastInsertRowid as number) as Promise<Notice>;
  }

  async updateNotice(id: number, notice: Partial<InsertNotice>): Promise<Notice | undefined> {
    const existing = await this.getNotice(id);
    if (!existing) return undefined;

    const fields = Object.keys(notice).map(k => `${k} = @${k} `).join(', ');
    if (!fields) return existing;

    const now = new Date().toISOString();
    let query = `UPDATE notices SET ${fields}, updatedAt = @updatedAt WHERE id = @id`;

    const params: any = { ...notice, id, updatedAt: now };
    if (notice.isPinned !== undefined) params.isPinned = this.toInt(notice.isPinned ?? false);
    if (notice.imageUrls !== undefined) params.imageUrls = JSON.stringify(notice.imageUrls);

    db.prepare(query).run(params);
    return this.getNotice(id);
  }

  async deleteNotice(id: number): Promise<boolean> {
    const res = db.prepare('DELETE FROM notices WHERE id = ?').run(id);
    return res.changes > 0;
  }

  async incrementNoticeViewCount(id: number): Promise<void> {
    db.prepare('UPDATE notices SET viewCount = viewCount + 1 WHERE id = ?').run(id);
  }

  async initializeData() {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count > 0) {
      console.log("Data already initialized.");
      return;
    }

    console.log("Initializing data...");

    await this.createUser({
      username: "admin",
      password: await hashPassword("adminpass"),
      role: "admin",
      email: "admin@example.com",
      phone: "010-0000-0000"
    });
    await this.createUser({
      username: "user",
      password: await hashPassword("userpass"),
      role: "user",
      email: "user@example.com",
      phone: "010-1111-1111"
    });

    await this.createAgent({
      name: "이가이버부동산",
      phone: "010-1234-5678",
      email: "eguyer@example.com",
      isActive: true,
      position: "공인중개사",
      bio: "정직과 신뢰의 이가이버 부동산입니다."
    });

    console.log("Basic data initialized.");
  }

  // --- Crawler ---
  async createCrawledProperty(property: InsertCrawledProperty): Promise<CrawledProperty> {
    const stmt = db.prepare(`
      INSERT INTO crawled_properties (
        atclNo, atclNm, rletTpNm, tradTpNm, flrInfo, prc, rentPrc, depositPrc, spc1, spc2, direction, lat, lng, imgUrl, rltrNm, landType, zoneType, crawledAt
      ) VALUES (
        @atclNo, @atclNm, @rletTpNm, @tradTpNm, @flrInfo, @prc, @rentPrc, @depositPrc, @spc1, @spc2, @direction, @lat, @lng, @imgUrl, @rltrNm, @landType, @zoneType, @crawledAt
      )
      ON CONFLICT(atclNo) DO UPDATE SET
        atclNm=excluded.atclNm,
        rletTpNm=excluded.rletTpNm,
        tradTpNm=excluded.tradTpNm,
        prc=excluded.prc,
        rentPrc=excluded.rentPrc,
        depositPrc=excluded.depositPrc,
        spc1=excluded.spc1,
        spc2=excluded.spc2,
        direction=excluded.direction,
        imgUrl=excluded.imgUrl,
        rltrNm=excluded.rltrNm,
        landType=excluded.landType,
        zoneType=excluded.zoneType,
        crawledAt=excluded.crawledAt
    `);

    // Convert numbers to text if needed, but sqlite handles types loosely.
    // Zod schema allows numbers for prc, spc1, spc2.
    // We'll pass as is, assuming better-sqlite3 handles it.

    const res = stmt.run({
      ...property,
      crawledAt: new Date().toISOString()
    });

    // If upsert happened, lastInsertRowid might not be the updated row if ID wasn't changed?
    // Actually sqlite upsert returns last insert rowid of the row.
    // But getting by atclNo matches safety.
    return db.prepare('SELECT * FROM crawled_properties WHERE atclNo = ?').get(property.atclNo) as CrawledProperty;
  }

  async getCrawledProperties(): Promise<CrawledProperty[]> {
    // 프론트엔드 지도에 모든 매물 마커를 표시하기 위해 LIMIT을 5000으로 상향
    const rows = db.prepare('SELECT * FROM crawled_properties ORDER BY crawledAt DESC LIMIT 5000').all() as CrawledProperty[];
    console.log(`[Storage] getCrawledProperties: ${rows.length} items (LIMIT 5000)`);
    return rows;
  }

  async searchCrawledProperties(options: { district?: string | null, type?: string[] | null }): Promise<CrawledProperty[]> {
    let query = 'SELECT * FROM crawled_properties WHERE 1=1';
    const params: any[] = [];

    if (options.district && options.district !== 'all') {
      const regionBounds: Record<string, { minLat: number, minLon: number, maxLat: number, maxLon: number }> = {
          "강화읍": { minLat: 37.720, minLon: 126.460, maxLat: 37.765, maxLon: 126.510 },
          "선원면": { minLat: 37.685, minLon: 126.460, maxLat: 37.740, maxLon: 126.540 },
          "길상면": { minLat: 37.590, minLon: 126.440, maxLat: 37.665, maxLon: 126.540 },
          "화도면": { minLat: 37.575, minLon: 126.350, maxLat: 37.660, maxLon: 126.460 },
          "불은면": { minLat: 37.660, minLon: 126.470, maxLat: 37.705, maxLon: 126.550 },
          "양도면": { minLat: 37.640, minLon: 126.370, maxLat: 37.710, maxLon: 126.480 },
          "내가면": { minLat: 37.695, minLon: 126.340, maxLat: 37.755, maxLon: 126.435 },
          "하점면": { minLat: 37.745, minLon: 126.370, maxLat: 37.820, maxLon: 126.465 },
          "송해면": { minLat: 37.755, minLon: 126.430, maxLat: 37.820, maxLon: 126.510 },
          "양사면": { minLat: 37.795, minLon: 126.380, maxLat: 37.860, maxLon: 126.480 },
          "교동면": { minLat: 37.750, minLon: 126.150, maxLat: 37.860, maxLon: 126.350 },
          "삼산면 (석모도)": { minLat: 37.640, minLon: 126.250, maxLat: 37.760, maxLon: 126.380 }
      };
      
      const bounds = regionBounds[options.district];
      if (bounds) {
        query += ' AND lat >= ? AND lat <= ? AND lng >= ? AND lng <= ?';
        params.push(bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon);
      } else {
        // Fallback for unknown districts
        query += ' AND (atclNm LIKE ? OR flrInfo LIKE ?)';
        params.push(`%${options.district}%`, `%${options.district}%`);
      }
    }

    if (options.type && options.type.length > 0) {
      const placeholders = options.type.map(() => '?').join(',');
      query += ` AND rletTpNm IN (${placeholders})`;
      params.push(...options.type);
    }

    query += ' ORDER BY crawledAt DESC LIMIT 5000';
    const rows = db.prepare(query).all(...params) as CrawledProperty[];
    console.log(`[Storage] searchCrawledProperties: ${rows.length} items found with SQL Push-down`);
    return rows;
  }

  async getCrawledProperty(atclNo: string): Promise<CrawledProperty | undefined> {
    return db.prepare('SELECT * FROM crawled_properties WHERE atclNo = ?').get(atclNo) as CrawledProperty | undefined;
  }

  async clearCrawledProperties(): Promise<void> {
    db.prepare('DELETE FROM crawled_properties').run();
  }

  // --- Post Comments ---
  async getPostComments(postId: number): Promise<PostComment[]> {
    return db.prepare("SELECT * FROM post_comments WHERE postId = ? ORDER BY createdAt ASC").all(postId) as PostComment[];
  }

  async createPostComment(comment: InsertPostComment): Promise<PostComment> {
    const defaultComment = {
      ...comment,
      imageUrl: comment.imageUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const stmt = db.prepare(`
      INSERT INTO post_comments (postId, authorId, parentId, content, imageUrl, createdAt, updatedAt)
      VALUES (@postId, @authorId, @parentId, @content, @imageUrl, @createdAt, @updatedAt)
    `);
    const info = stmt.run(defaultComment);
    return this.getPostComment(info.lastInsertRowid as number) as Promise<PostComment>;
  }

  async getPostComment(id: number): Promise<PostComment | undefined> {
    return db.prepare("SELECT * FROM post_comments WHERE id = ?").get(id) as PostComment | undefined;
  }

  async deletePostComment(id: number): Promise<boolean> {
    const info = db.prepare("DELETE FROM post_comments WHERE id = ?").run(id);
    return info.changes > 0;
  }

  // --- Newsletter ---
  async getNewsletterSubscriptions(): Promise<NewsletterSubscription[]> {
    const rows = db.prepare('SELECT * FROM newsletter_subscriptions ORDER BY createdAt DESC').all();
    return rows.map((row: any) => ({
      ...row,
      createdAt: new Date(row.createdAt as string)
    })) as NewsletterSubscription[];
  }

  async getNewsletterSubscriptionByEmail(email: string): Promise<NewsletterSubscription | undefined> {
    const row = db.prepare('SELECT * FROM newsletter_subscriptions WHERE email = ?').get(email) as any;
    if (!row) return undefined;
    return {
      ...row,
      createdAt: new Date(row.createdAt as string)
    } as NewsletterSubscription;
  }

  async createNewsletterSubscription(sub: InsertNewsletterSubscription): Promise<NewsletterSubscription> {
    const res = db.prepare(`
      INSERT INTO newsletter_subscriptions (email, createdAt)
      VALUES (@email, @createdAt)
    `).run({
      ...sub,
      createdAt: new Date().toISOString()
    });
    return this.getNewsletterSubscriptionByEmail(sub.email) as Promise<NewsletterSubscription>;
  }

  async deleteNewsletterSubscription(id: number): Promise<boolean> {
    const res = db.prepare('DELETE FROM newsletter_subscriptions WHERE id = ?').run(id);
    return res.changes > 0;
  }

  async getActiveNewsletterSubscribers(): Promise<NewsletterSubscription[]> {
    const rows = db.prepare('SELECT * FROM newsletter_subscriptions WHERE isActive = 1').all() as any[];
    return rows.map(r => ({
      ...r,
      isActive: Boolean(r.isActive)
    })) as NewsletterSubscription[];
  }

  async getWeeklyNewsletterData(): Promise<{ properties: Property[]; posts: Post[]; news: News[] }> {
    let properties = db.prepare(`
      SELECT * FROM properties
      WHERE date(createdAt, '+9 hours') >= date('now', '+9 hours', '-7 days')
      ORDER BY createdAt DESC
      LIMIT 5
    `).all() as any[];
    
    if (properties.length < 5) {
      const remaining = 5 - properties.length;
      const idsToExclude = properties.length > 0 ? properties.map(p => p.id).join(',') : '';
      const excludeClause = idsToExclude ? `WHERE id NOT IN (${idsToExclude})` : '';
      
      const additionalProperties = db.prepare(`
        SELECT * FROM properties 
        ${excludeClause}
        ORDER BY viewCount DESC 
        LIMIT ?
      `).all(remaining) as any[];
      
      properties = [...properties, ...additionalProperties];
    }

    let posts = db.prepare(`
      SELECT p.*, COALESCE(p.authorName, u.nickname, u.username, '관리자') as authorName
      FROM posts p
      LEFT JOIN users u ON p.authorId = u.id
      WHERE date(p.createdAt, '+9 hours') >= date('now', '+9 hours', '-7 days')
        AND p.category IN ('qa', 'architecture', 'stories')
      ORDER BY p.viewCount DESC
      LIMIT 5
    `).all() as any[];
    if (posts.length === 0) {
      posts = db.prepare(`
        SELECT p.*, COALESCE(p.authorName, u.nickname, u.username, '관리자') as authorName
        FROM posts p
        LEFT JOIN users u ON p.authorId = u.id
        WHERE p.category IN ('qa', 'architecture', 'stories')
        ORDER BY p.viewCount DESC 
        LIMIT 5
      `).all();
    }

    let newsRaw = db.prepare(`
      SELECT * FROM news
      WHERE date(createdAt, '+9 hours') >= date('now', '+9 hours', '-7 days')
        AND (title LIKE '%강화군%' OR content LIKE '%강화군%')
        AND category LIKE '%부동산%'
      ORDER BY viewCount DESC
      LIMIT 30
    `).all() as any[];
    if (newsRaw.length < 30) {
      const remaining = 30 - newsRaw.length;
      const idsToExclude = newsRaw.length > 0 ? newsRaw.map(n => n.id).join(',') : '';
      const excludeClause = idsToExclude ? `AND id NOT IN (${idsToExclude})` : '';
      
      const additionalNews = db.prepare(`
        SELECT * FROM news 
        WHERE (title LIKE '%강화군%' OR content LIKE '%강화군%')
          AND category LIKE '%부동산%'
          ${excludeClause}
        ORDER BY viewCount DESC 
        LIMIT ?
      `).all(remaining) as any[];
      
      newsRaw = [...newsRaw, ...additionalNews];
    }
    const news = deduplicateNews(newsRaw, 5);

    return { properties: properties as Property[], posts: posts as Post[], news: news as News[] };
  }

  async getMonthlyNewsletterData(): Promise<{ properties: Property[]; posts: Post[]; news: News[] }> {
    let properties = db.prepare(`
      SELECT * FROM properties
      WHERE date(createdAt, '+9 hours') >= date('now', '+9 hours', '-1 month')
      ORDER BY viewCount DESC
      LIMIT 5
    `).all() as any[];
    
    if (properties.length < 5) {
      const remaining = 5 - properties.length;
      const idsToExclude = properties.length > 0 ? properties.map(p => p.id).join(',') : '';
      const excludeClause = idsToExclude ? `WHERE id NOT IN (${idsToExclude})` : '';
      
      const additionalProperties = db.prepare(`
        SELECT * FROM properties 
        ${excludeClause}
        ORDER BY viewCount DESC 
        LIMIT ?
      `).all(remaining) as any[];
      
      properties = [...properties, ...additionalProperties];
    }

    let posts = db.prepare(`
      SELECT p.*, COALESCE(p.authorName, u.nickname, u.username, '관리자') as authorName
      FROM posts p
      LEFT JOIN users u ON p.authorId = u.id
      WHERE date(p.createdAt, '+9 hours') >= date('now', '+9 hours', '-1 month')
        AND p.category IN ('qa', 'architecture', 'stories')
      ORDER BY p.viewCount DESC
      LIMIT 5
    `).all() as any[];
    if (posts.length === 0) {
      posts = db.prepare(`
        SELECT p.*, COALESCE(p.authorName, u.nickname, u.username, '관리자') as authorName
        FROM posts p
        LEFT JOIN users u ON p.authorId = u.id
        WHERE p.category IN ('qa', 'architecture', 'stories')
        ORDER BY p.viewCount DESC 
        LIMIT 5
      `).all();
    }

    let newsRaw = db.prepare(`
      SELECT * FROM news
      WHERE date(createdAt, '+9 hours') >= date('now', '+9 hours', '-1 month')
        AND (title LIKE '%강화군%' OR content LIKE '%강화군%')
        AND category LIKE '%부동산%'
      ORDER BY viewCount DESC
      LIMIT 30
    `).all() as any[];
    if (newsRaw.length < 30) {
      const remaining = 30 - newsRaw.length;
      const idsToExclude = newsRaw.length > 0 ? newsRaw.map(n => n.id).join(',') : '';
      const excludeClause = idsToExclude ? `AND id NOT IN (${idsToExclude})` : '';
      
      const additionalNews = db.prepare(`
        SELECT * FROM news 
        WHERE (title LIKE '%강화군%' OR content LIKE '%강화군%')
          AND category LIKE '%부동산%'
          ${excludeClause}
        ORDER BY viewCount DESC 
        LIMIT ?
      `).all(remaining) as any[];
      
      newsRaw = [...newsRaw, ...additionalNews];
    }
    const news = deduplicateNews(newsRaw, 5);

    return { properties: properties as Property[], posts: posts as Post[], news: news as News[] };
  }

  async insertNewsletterLog(log: Omit<import("@shared/schema").InsertNewsletterLog, "id" | "sentAt">): Promise<void> {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO newsletter_logs(subject, type, target, recipientCount, success, htmlContent, sentAt)
      VALUES(@subject, @type, @target, @recipientCount, @success, @htmlContent, @sentAt)
    `).run({
      subject: log.subject,
      type: log.type,
      target: log.target,
      recipientCount: log.recipientCount || 0,
      success: this.toInt(log.success ?? true),
      htmlContent: log.htmlContent,
      sentAt: now
    });
  }

  async getNewsletterLogs(limit: number = 50): Promise<import("@shared/schema").NewsletterLog[]> {
    const rows = db.prepare('SELECT * FROM newsletter_logs ORDER BY sentAt DESC LIMIT ?').all(limit) as any[];
    return rows.map(row => ({
      ...row,
      success: this.toBoolean(row.success)
    }));
  }

  // --- Posts (Community) ---
  async getPosts(category?: string): Promise<Post[]> {
    let query = 'SELECT * FROM posts';
    const params: any[] = [];
    if (category && category !== 'all') {
      query += ' WHERE category = ?';
      params.push(category);
    }
    query += ' ORDER BY isPinned DESC, createdAt DESC';
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(row => ({
      ...row,
      imageUrls: JSON.parse(row.imageUrls || '[]'),
      createdAt: new Date(row.createdAt),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined
    }));
  }

  async getPost(id: number): Promise<Post | undefined> {
    const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      imageUrls: JSON.parse(row.imageUrls || '[]'),
      createdAt: new Date(row.createdAt),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined
    };
  }

  async createPost(post: InsertPost): Promise<Post> {
    const now = new Date().toISOString();
    const res = db.prepare(`
      INSERT INTO posts (category, title, content, imageUrls, authorId, viewCount, createdAt, updatedAt)
      VALUES (@category, @title, @content, @imageUrls, @authorId, 0, @createdAt, @updatedAt)
    `).run({
      ...post,
      imageUrls: JSON.stringify(post.imageUrls || []),
      createdAt: now,
      updatedAt: now
    });
    return this.getPost(Number(res.lastInsertRowid)) as Promise<Post>;
  }

  async updatePost(id: number, post: Partial<InsertPost>): Promise<Post | undefined> {
    const existing = await this.getPost(id);
    if (!existing) return undefined;

    const updatedAt = new Date().toISOString();
    const sets: string[] = [];
    const params: any = { id, updatedAt };

    if (post.category !== undefined) { sets.push('category = @category'); params.category = post.category; }
    if (post.title !== undefined) { sets.push('title = @title'); params.title = post.title; }
    if (post.content !== undefined) { sets.push('content = @content'); params.content = post.content; }
    if (post.imageUrls !== undefined) { sets.push('imageUrls = @imageUrls'); params.imageUrls = JSON.stringify(post.imageUrls); }
    if (post.authorId !== undefined) { sets.push('authorId = @authorId'); params.authorId = post.authorId; }

    if (sets.length === 0) return existing;

    db.prepare(`
      UPDATE posts SET ${sets.join(', ')}, updatedAt = @updatedAt WHERE id = @id
    `).run(params);

    return this.getPost(id);
  }

  async deletePost(id: number): Promise<boolean> {
    const res = db.prepare('DELETE FROM posts WHERE id = ?').run(id);
    return res.changes > 0;
  }

  async incrementPostViewCount(id: number): Promise<boolean> {
    const res = db.prepare('UPDATE posts SET viewCount = viewCount + 1 WHERE id = ?').run(id);
    return res.changes > 0;
  }

  // --- Notifications ---
  async getNotifications(limit: number = 50): Promise<Notification[]> {
    const rows = db.prepare('SELECT * FROM notifications ORDER BY createdAt DESC LIMIT ?').all(limit);
    return rows.map(row => this.mapNotification(row));
  }

  async getUnreadNotificationCount(): Promise<number> {
    const res = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE isRead = 0').get() as { count: number };
    return res.count;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const res = db.prepare(`
      INSERT INTO notifications (type, title, content, isRead, linkUrl, createdAt)
      VALUES (@type, @title, @content, @isRead, @linkUrl, @createdAt)
    `).run({
      ...notification,
      isRead: this.toInt(notification.isRead ?? false),
      createdAt: new Date().toISOString()
    });
    const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(res.lastInsertRowid);
    return this.mapNotification(row);
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const res = db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ?').run(id);
    return res.changes > 0;
  }

  async markAllNotificationsAsRead(): Promise<boolean> {
    db.prepare('UPDATE notifications SET isRead = 1 WHERE isRead = 0').run();
    return true;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const res = db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
    return res.changes > 0;
  }

  // --- Realtor Subscriptions ---
  async getActiveRealtorSubscription(userId: number): Promise<RealtorSubscription | undefined> {
    return db.prepare("SELECT * FROM realtor_subscriptions WHERE userId = ? AND status = 'active' ORDER BY endDate DESC LIMIT 1").get(userId) as RealtorSubscription | undefined;
  }

  async createRealtorSubscription(sub: InsertRealtorSubscription): Promise<RealtorSubscription> {
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO realtor_subscriptions (userId, planType, amount, impUid, merchantUid, status, startDate, endDate, createdAt)
      VALUES (@userId, @planType, @amount, @impUid, @merchantUid, @status, @startDate, @endDate, @createdAt)
    `).run({
      ...sub,
      impUid: sub.impUid || null,
      merchantUid: sub.merchantUid || null,
      status: sub.status || 'active',
      startDate: sub.startDate || now,
      endDate: sub.endDate || now,
      createdAt: now
    });
    
    return db.prepare('SELECT * FROM realtor_subscriptions WHERE id = ?').get(result.lastInsertRowid) as RealtorSubscription;
  }

  // --- Admin Notifications ---
  
  private mapAdminNotification(row: any): AdminNotification {
    if (!row) return row;
    return {
      ...row,
      isRead: this.toBoolean(row.isRead)
    };
  }

  async getAdminNotifications(limit?: number): Promise<AdminNotification[]> {
    let query = 'SELECT * FROM admin_notifications ORDER BY createdAt DESC';
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    const rows = db.prepare(query).all();
    return rows.map(row => this.mapAdminNotification(row));
  }

  async getUnreadAdminNotificationCount(): Promise<number> {
    const row = db.prepare('SELECT COUNT(*) as count FROM admin_notifications WHERE isRead = 0').get() as { count: number };
    return row.count;
  }

  async createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification> {
    const createdAt = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO admin_notifications (type, relatedId, title, content, isRead, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      notification.type,
      notification.relatedId || null,
      notification.title,
      notification.content || null,
      notification.isRead ? 1 : 0,
      createdAt
    );
    const id = result.lastInsertRowid as number;
    return this.mapAdminNotification(db.prepare('SELECT * FROM admin_notifications WHERE id = ?').get(id));
  }

  async markAdminNotificationAsRead(id: number): Promise<boolean> {
    const result = db.prepare('UPDATE admin_notifications SET isRead = 1 WHERE id = ?').run(id);
    return result.changes > 0;
  }

  async markAllAdminNotificationsAsRead(): Promise<boolean> {
    const result = db.prepare('UPDATE admin_notifications SET isRead = 1 WHERE isRead = 0').run();
    return result.changes > 0;
  }

  async deleteAdminNotification(id: number): Promise<boolean> {
    const result = db.prepare('DELETE FROM admin_notifications WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // --- Visit Logs ---

  async createVisitLog(log: InsertVisitLog): Promise<void> {
    db.prepare(`
      INSERT INTO visit_logs (ip, userAgent, path, referer, keyword, userId)
      VALUES (@ip, @userAgent, @path, @referer, @keyword, @userId)
    `).run({
      ip: log.ip || null,
      userAgent: log.userAgent || null,
      path: log.path,
      referer: log.referer || null,
      keyword: log.keyword || null,
      userId: log.userId || null,
    });
  }

  async getVisitStats(days: number): Promise<{ date: string; visitors: number; views: number }[]> {
    const rows = db.prepare(`
      WITH RECURSIVE dates(date) AS (
        SELECT date('now', '+9 hours', '-' || (? - 1) || ' days')
        UNION ALL
        SELECT date(date, '+1 day') FROM dates WHERE date < date('now', '+9 hours')
      )
      SELECT 
        d.date,
        COUNT(DISTINCT v.ip) as visitors,
        COUNT(v.id) as views
      FROM dates d
      LEFT JOIN visit_logs v ON date(v.createdAt, '+9 hours') = d.date
      GROUP BY d.date
      ORDER BY d.date ASC
    `).all(days) as any[];

    return rows.map(r => ({
      date: r.date,
      visitors: r.visitors,
      views: r.views
    }));
  }

  async getPopularStats(): Promise<{
    properties: { id: number; title: string; views: number }[];
    posts: { id: number; title: string; views: number }[];
  }> {
    let properties = db.prepare(`
      SELECT p.id, p.title, COUNT(v.id) as views 
      FROM properties p
      JOIN visit_logs v ON v.path IN ('/properties/' || p.id, '/api/properties/' || p.id)
      WHERE v.createdAt >= datetime('now', '-7 days')
      GROUP BY p.id
      ORDER BY views DESC 
      LIMIT 5
    `).all() as any[];

    if (properties.length === 0) {
      properties = db.prepare(`
        SELECT id, title, viewCount as views 
        FROM properties 
        ORDER BY viewCount DESC 
        LIMIT 5
      `).all() as any[];
    }

    let posts = db.prepare(`
      SELECT p.id, p.title, COUNT(v.id) as views 
      FROM posts p
      JOIN visit_logs v ON v.path IN ('/community/' || p.id, '/api/posts/' || p.id, '/posts/' || p.id)
      WHERE v.createdAt >= datetime('now', '-7 days')
      GROUP BY p.id
      ORDER BY views DESC 
      LIMIT 5
    `).all() as any[];

    if (posts.length === 0) {
      posts = db.prepare(`
        SELECT id, title, viewCount as views 
        FROM posts 
        ORDER BY viewCount DESC 
        LIMIT 5
      `).all() as any[];
    }

    return { properties, posts };
  }

  async getTopKeywords(limit: number = 10): Promise<{ keyword: string; count: number }[]> {
    const rows = db.prepare(`
      SELECT keyword, COUNT(*) as count
      FROM visit_logs
      WHERE keyword IS NOT NULL AND keyword != ''
      GROUP BY keyword
      ORDER BY count DESC
      LIMIT ?
    `).all(limit) as any[];

    return rows.map(r => ({
      keyword: r.keyword,
      count: r.count
    }));
  }

  async getOverviewStats(): Promise<{
    todayVisitors: number;
    totalVisitors: number;
    totalProperties: number;
    totalInquiries: number;
    todaySignups: number;
    totalUsers: number;
    realtorCount: number;
    normalUserCount: number;
    unreadInquiries: number;
    totalNewsletters: number;
  }> {
    const todayVisitors = db.prepare(`
      SELECT COUNT(DISTINCT ip) as count 
      FROM visit_logs 
      WHERE date(createdAt, '+9 hours') = date('now', '+9 hours')
    `).get() as any;

    const totalVisitors = db.prepare(`
      SELECT COUNT(DISTINCT ip) as count 
      FROM visit_logs
    `).get() as any;

    const totalProperties = db.prepare(`
      SELECT COUNT(*) as count FROM properties
    `).get() as any;

    const totalInquiries = db.prepare(`
      SELECT COUNT(*) as count FROM inquiries
    `).get() as any;

    const todaySignups = db.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE date(createdAt, '+9 hours') = date('now', '+9 hours')
    `).get() as any;

    const totalUsers = db.prepare(`
      SELECT COUNT(*) as count FROM users
    `).get() as any;

    const realtorCount = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'realtor'
    `).get() as any;

    const normalUserCount = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'user'
    `).get() as any;

    const unreadInquiries = db.prepare(`
      SELECT COUNT(*) as count FROM propertyInquiries WHERE isReadByAdmin = 0
    `).get() as any;

    const totalNewsletters = db.prepare(`
      SELECT COUNT(*) as count FROM newsletter_subscriptions
    `).get() as any;

    return {
      todayVisitors: todayVisitors.count,
      totalVisitors: totalVisitors.count,
      totalProperties: totalProperties.count,
      totalInquiries: totalInquiries.count,
      todaySignups: todaySignups.count,
      totalUsers: totalUsers.count,
      realtorCount: realtorCount.count,
      normalUserCount: normalUserCount.count,
      unreadInquiries: unreadInquiries.count,
      totalNewsletters: totalNewsletters.count
    };
  }

  async getDetailedStats(): Promise<{
    propertyDistribution: { type: string; count: number }[];
    userRoleDistribution: { role: string; count: number }[];
    topReferrers: { referer: string; count: number }[];
    deviceDistribution: { device: string; count: number }[];
  }> {
    const propertyDistribution = db.prepare(`
      SELECT type, COUNT(*) as count FROM properties GROUP BY type
    `).all() as any[];

    const userRoleDistribution = db.prepare(`
      SELECT role, COUNT(*) as count FROM users GROUP BY role
    `).all() as any[];

    const topReferrers = db.prepare(`
      SELECT 
        CASE 
          WHEN referer IS NULL OR referer = '' THEN 'Direct'
          WHEN referer LIKE '%google%' THEN 'Google'
          WHEN referer LIKE '%naver%' THEN 'Naver'
          WHEN referer LIKE '%daum%' OR referer LIKE '%kakao%' THEN 'Daum/Kakao'
          ELSE 'Other'
        END as source,
        COUNT(*) as count 
      FROM visit_logs 
      GROUP BY source 
      ORDER BY count DESC 
      LIMIT 5
    `).all() as any[];

    const deviceDistribution = db.prepare(`
      SELECT 
        CASE 
          WHEN userAgent LIKE '%Mobi%' THEN 'Mobile'
          ELSE 'Desktop'
        END as device,
        COUNT(*) as count 
      FROM visit_logs 
      GROUP BY device
    `).all() as any[];

    return {
      propertyDistribution: propertyDistribution.map(r => ({ type: r.type, count: r.count })),
      userRoleDistribution: userRoleDistribution.map(r => ({ role: r.role, count: r.count })),
      topReferrers: topReferrers.map(r => ({ referer: r.source, count: r.count })),
      deviceDistribution: deviceDistribution.map(r => ({ device: r.device, count: r.count }))
    };
  }

  // --- Site Configs ---

  async getSiteConfig(key: string): Promise<string | undefined> {
    const row = db.prepare('SELECT value FROM site_configs WHERE key = ?').get(key) as any;
    return row ? row.value : undefined;
  }

  async setSiteConfig(key: string, value: string): Promise<void> {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO site_configs (key, value, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updatedAt = excluded.updatedAt
    `).run(key, value, now);
  }

  async getAllSiteConfigs(): Promise<SiteConfig[]> {
    return db.prepare('SELECT * FROM site_configs').all() as SiteConfig[];
  }

  // --- Popups ---

  private mapPopup(row: any): Popup {
    if (!row) return row;
    return {
      ...row,
      isActive: this.toBoolean(row.isActive)
    };
  }

  async getPopups(): Promise<Popup[]> {
    const rows = db.prepare('SELECT * FROM popups ORDER BY displayOrder ASC, createdAt DESC').all() as any[];
    return rows.map(r => this.mapPopup(r));
  }

  async getActivePopups(): Promise<Popup[]> {
    const now = new Date().toISOString();
    // Only return popups where isActive = 1 and (startDate/endDate are null or within range)
    const query = `
      SELECT * FROM popups 
      WHERE isActive = 1 
      AND (startDate IS NULL OR startDate = '' OR startDate <= ?)
      AND (endDate IS NULL OR endDate = '' OR endDate >= ?)
      ORDER BY displayOrder ASC, createdAt DESC
    `;
    const rows = db.prepare(query).all(now, now) as any[];
    return rows.map(r => this.mapPopup(r));
  }

  async getPopup(id: number): Promise<Popup | undefined> {
    const row = db.prepare('SELECT * FROM popups WHERE id = ?').get(id);
    return row ? this.mapPopup(row) : undefined;
  }

  async createPopup(popup: InsertPopup): Promise<Popup> {
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO popups (title, content, imageUrl, linkUrl, isActive, displayOrder, startDate, endDate, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      popup.title,
      popup.content || null,
      popup.imageUrl || null,
      popup.linkUrl || null,
      popup.isActive !== false ? 1 : 0,
      popup.displayOrder || 0,
      popup.startDate || null,
      popup.endDate || null,
      now
    );
    return this.getPopup(result.lastInsertRowid as number) as Promise<Popup>;
  }

  async updatePopup(id: number, popup: Partial<InsertPopup>): Promise<Popup | undefined> {
    const current = await this.getPopup(id);
    if (!current) return undefined;

    const isActiveVal = popup.isActive !== undefined ? (popup.isActive ? 1 : 0) : current.isActive ? 1 : 0;

    db.prepare(`
      UPDATE popups
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          imageUrl = COALESCE(?, imageUrl),
          linkUrl = COALESCE(?, linkUrl),
          isActive = ?,
          displayOrder = COALESCE(?, displayOrder),
          startDate = COALESCE(?, startDate),
          endDate = COALESCE(?, endDate)
      WHERE id = ?
    `).run(
      popup.title !== undefined ? popup.title : null,
      popup.content !== undefined ? popup.content : null,
      popup.imageUrl !== undefined ? popup.imageUrl : null,
      popup.linkUrl !== undefined ? popup.linkUrl : null,
      isActiveVal,
      popup.displayOrder !== undefined ? popup.displayOrder : null,
      popup.startDate !== undefined ? popup.startDate : null,
      popup.endDate !== undefined ? popup.endDate : null,
      id
    );

    return this.getPopup(id);
  }

  async deletePopup(id: number): Promise<boolean> {
    const result = db.prepare('DELETE FROM popups WHERE id = ?').run(id);
    return result.changes > 0;
  }

  async updatePopupOrder(id: number, newOrder: number): Promise<boolean> {
    const result = db.prepare('UPDATE popups SET displayOrder = ? WHERE id = ?').run(newOrder, id);
    return result.changes > 0;
  }
}

export const storage = new SQLiteStorage();