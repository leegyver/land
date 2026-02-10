import {
  type Property, type InsertProperty,
  type Agent, type InsertAgent,
  type Inquiry, type InsertInquiry,
  type User, type InsertUser,
  type News, type InsertNews,
  type PropertyInquiry, type InsertPropertyInquiry,
  type Favorite, type InsertFavorite,
  type Banner, type InsertBanner
} from "@shared/schema";
import { db } from "./db";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

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

  // New methods for Urgent/Negotiable
  getUrgentProperties(limit?: number): Promise<Property[]>;
  getNegotiableProperties(limit?: number): Promise<Property[]>;
  togglePropertyUrgent(propertyId: number, isUrgent: boolean): Promise<boolean>;
  togglePropertyNegotiable(propertyId: number, isNegotiable: boolean): Promise<boolean>;
  updatePropertyUrgentOrder(propertyId: number, newOrder: number): Promise<boolean>;
  updatePropertyNegotiableOrder(propertyId: number, newOrder: number): Promise<boolean>;

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
  getNewsByTitle(title: string): Promise<News | undefined>; // Added for News Fetcher
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

  // Banner methods
  getBanners(location?: string): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  deleteBanner(id: number): Promise<boolean>;
  updateBannerOrder(id: number, newOrder: number): Promise<boolean>;

  // Init Data
  initializeData(): Promise<void>;
}

export class SQLiteStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
    this.initializeTables();
    this.performMigrations();
  }

  private performMigrations() {
    try {
      // Add isUrgent column
      try { db.prepare("ALTER TABLE properties ADD COLUMN isUrgent INTEGER DEFAULT 0").run(); } catch (e) { }

      // Add urgentOrder column
      try { db.prepare("ALTER TABLE properties ADD COLUMN urgentOrder INTEGER DEFAULT 0").run(); } catch (e) { }

      // Add isNegotiable column
      try { db.prepare("ALTER TABLE properties ADD COLUMN isNegotiable INTEGER DEFAULT 0").run(); } catch (e) { }

      // Add negotiableOrder column
      try { db.prepare("ALTER TABLE properties ADD COLUMN negotiableOrder INTEGER DEFAULT 0").run(); } catch (e) { }

      // Add isVisible column (if missing)
      try { db.prepare("ALTER TABLE properties ADD COLUMN isVisible INTEGER DEFAULT 1").run(); } catch (e) { }

      // Add birthDate column
      try { db.prepare("ALTER TABLE users ADD COLUMN birthDate TEXT").run(); } catch (e) { }

      // Add birthTime column
      try { db.prepare("ALTER TABLE users ADD COLUMN birthTime TEXT").run(); } catch (e) { }

      // Add isLunar column
      try { db.prepare("ALTER TABLE users ADD COLUMN isLunar INTEGER DEFAULT 0").run(); } catch (e) { }

      // Create banners table if not exists (in case initializeTables didn't catch it for some reason or specifically for migration flow)
      db.prepare(`
        CREATE TABLE IF NOT EXISTS banners (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          location TEXT NOT NULL, 
          imageUrl TEXT NOT NULL,
          linkUrl TEXT,
          openNewWindow INTEGER DEFAULT 0,
          displayOrder INTEGER DEFAULT 0,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      console.log("Database migrations performed.");
    } catch (error) {
      console.error("Migration error:", error);
    }
  }

  private initializeTables() {
    // Users
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        role TEXT DEFAULT 'user',
        provider TEXT,
        providerId TEXT,
        birthDate TEXT,
        birthTime TEXT,
        isLunar INTEGER DEFAULT 0
      )
    `).run();

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
        isSold INTEGER DEFAULT 0, -- boolean
        viewCount INTEGER DEFAULT 0
      )
    `).run();

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
      elevator: this.toBoolean(row.elevator),
      coListing: this.toBoolean(row.coListing),
      isSold: this.toBoolean(row.isSold),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  private mapUser(row: any): User {
    if (!row) return row;
    return {
      ...row,
      isLunar: this.toBoolean(row.isLunar)
    };
  }

  // --- Properties ---

  async getProperties(): Promise<Property[]> {
    const rows = db.prepare('SELECT * FROM properties WHERE isVisible = 1 ORDER BY displayOrder ASC, createdAt DESC').all();
    return rows.map(row => this.mapProperty(row));
  }

  async getAllProperties(): Promise<Property[]> {
    const rows = db.prepare('SELECT * FROM properties ORDER BY displayOrder ASC, createdAt DESC').all();
    return rows.map(row => this.mapProperty(row));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    return row ? this.mapProperty(row) : undefined;
  }

  async getFeaturedProperties(limit: number = 4): Promise<Property[]> {
    const rows = db.prepare(`SELECT * FROM properties WHERE featured = 1 AND isVisible = 1 ORDER BY displayOrder ASC, createdAt DESC LIMIT ?`).all(limit);
    return rows.map(row => this.mapProperty(row));
  }

  async getUrgentProperties(limit: number = 4): Promise<Property[]> {
    const rows = db.prepare(`SELECT * FROM properties WHERE isUrgent = 1 AND isVisible = 1 ORDER BY urgentOrder ASC, createdAt DESC LIMIT ?`).all(limit);
    return rows.map(row => this.mapProperty(row));
  }

  async getNegotiableProperties(limit: number = 4): Promise<Property[]> {
    const rows = db.prepare(`SELECT * FROM properties WHERE isNegotiable = 1 AND isVisible = 1 ORDER BY negotiableOrder ASC, createdAt DESC LIMIT ?`).all(limit);
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
    const rows = db.prepare(`SELECT * FROM properties WHERE address IN (${placeholders}) LIMIT 10`).all(addresses.slice(0, 10));
    return rows.map(row => this.mapProperty(row));
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO properties (
        title, description, type, price, address, district, size, bedrooms, bathrooms,
        imageUrl, imageUrls, agentId, featured, displayOrder, isUrgent, urgentOrder,
        isNegotiable, negotiableOrder, isVisible, createdAt, updatedAt,
        buildingName, unitNumber, supplyArea, privateArea, areaSize, floor, totalFloors,
        direction, elevator, parking, heatingSystem, approvalDate, landType, zoneType,
        dealType, deposit, depositAmount, monthlyRent, maintenanceFee, ownerName,
        ownerPhone, tenantName, tenantPhone, clientName, clientPhone, specialNote,
        coListing, agentName, propertyDescription, privateNote, youtubeUrl, isSold, viewCount
      ) VALUES (
        @title, @description, @type, @price, @address, @district, @size, @bedrooms, @bathrooms,
        @imageUrl, @imageUrls, @agentId, @featured, @displayOrder, @isUrgent, @urgentOrder,
        @isNegotiable, @negotiableOrder, @isVisible, @createdAt, @updatedAt,
        @buildingName, @unitNumber, @supplyArea, @privateArea, @areaSize, @floor, @totalFloors,
        @direction, @elevator, @parking, @heatingSystem, @approvalDate, @landType, @zoneType,
        @dealType, @deposit, @depositAmount, @monthlyRent, @maintenanceFee, @ownerName,
        @ownerPhone, @tenantName, @tenantPhone, @clientName, @clientPhone, @specialNote,
        @coListing, @agentName, @propertyDescription, @privateNote, @youtubeUrl, @isSold, @viewCount
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
      youtubeUrl: property.youtubeUrl || null
    });

    return this.getProperty(result.lastInsertRowid as number) as Promise<Property>;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const existing = await this.getProperty(id);
    if (!existing) return undefined;

    const updates = { ...existing, ...property };
    const now = new Date().toISOString();

    // Construct dynamic UPDATE query
    // Simplified: Just update generic fields that are usually touched. 
    // Ideally we iterate keys, but static query is safer.
    // For now, full update with all fields is verbose. 
    // Let's rely on specific update methods for flags, and general method for editing.
    // Actually better-sqlite3 handles named parameters well.

    const fields: string[] = [];
    const values: any = { id };

    // Helper to add field if present in property object
    const addIfPresent = (key: keyof InsertProperty | 'createdAt' | 'updatedAt' | 'featured' | 'isVisible' | 'displayOrder' | 'isUrgent' | 'urgentOrder' | 'isNegotiable' | 'negotiableOrder' | 'isSold' | 'viewCount', val: any) => {
      fields.push(`${key} = @${key}`);
      values[key] = val;
    };

    // We merge with existing so all fields are available, but we only want to set what changed to avoid overwriting with old constraints if we had them. 
    // Actually we can just update what's passed + updatedAt.

    // Manual mapping for special fields
    if (property.title !== undefined) addIfPresent('title', property.title);
    if (property.description !== undefined) addIfPresent('description', property.description);
    if (property.type !== undefined) addIfPresent('type', property.type);
    if (property.price !== undefined) addIfPresent('price', property.price);
    if (property.address !== undefined) addIfPresent('address', property.address);
    if (property.district !== undefined) addIfPresent('district', property.district);
    if (property.size !== undefined) addIfPresent('size', property.size);
    if (property.bedrooms !== undefined) addIfPresent('bedrooms', property.bedrooms);
    if (property.bathrooms !== undefined) addIfPresent('bathrooms', property.bathrooms);
    if (property.imageUrl !== undefined) addIfPresent('imageUrl', property.imageUrl);
    if (property.imageUrls !== undefined) addIfPresent('imageUrls', JSON.stringify(property.imageUrls));
    if (property.agentId !== undefined) addIfPresent('agentId', property.agentId);
    if (property.featured !== undefined) addIfPresent('featured', this.toInt(property.featured ?? false));
    if (property.displayOrder !== undefined) addIfPresent('displayOrder', property.displayOrder);
    if (property.isUrgent !== undefined) addIfPresent('isUrgent', this.toInt(property.isUrgent ?? false));
    if (property.urgentOrder !== undefined) addIfPresent('urgentOrder', property.urgentOrder);
    if (property.isNegotiable !== undefined) addIfPresent('isNegotiable', this.toInt(property.isNegotiable ?? false));
    if (property.negotiableOrder !== undefined) addIfPresent('negotiableOrder', property.negotiableOrder);
    if (property.isVisible !== undefined) addIfPresent('isVisible', this.toInt(property.isVisible ?? true));

    // ... all other fields ...
    // For brevity in this fix, I'll update commonly used fields. 
    // Users can edit most fields. 
    // A robust implementation would loop.
    for (const key of Object.keys(property)) {
      if (key === 'imageUrls' || key === 'dealType') continue; // Handled separately or skipped
      if (key === 'featured' || key === 'isVisible' || key === 'isUrgent' || key === 'isNegotiable' || key === 'elevator' || key === 'coListing' || key === 'isSold') continue; // Handled
      // @ts-ignore
      if (property[key] !== undefined) addIfPresent(key, property[key]);
    }

    if (property.dealType !== undefined) addIfPresent('dealType', JSON.stringify(property.dealType));
    if (property.elevator !== undefined) addIfPresent('elevator', this.toInt(property.elevator ?? false));
    if (property.coListing !== undefined) addIfPresent('coListing', this.toInt(property.coListing ?? false));
    if (property.isSold !== undefined) addIfPresent('isSold', this.toInt(property.isSold ?? false));

    addIfPresent('updatedAt', now);

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
      INSERT INTO agents (name, email, phone, position, photo, bio, isActive, createdAt)
      VALUES (@name, @email, @phone, @position, @photo, @bio, @isActive, @createdAt)
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
    const fields = Object.keys(agent).map(k => `${k} = @${k}`).join(', ');
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
       INSERT INTO inquiries (name, email, phone, message, inquiryType, propertyId, createdAt)
       VALUES (@name, @email, @phone, @message, @inquiryType, @propertyId, @createdAt)
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
      INSERT INTO users (username, password, email, phone, role, provider, providerId, birthDate, birthTime, isLunar)
      VALUES (@username, @password, @email, @phone, @role, @provider, @providerId, @birthDate, @birthTime, @isLunar)
    `).run({
      username: user.username,
      password: user.password,
      email: user.email || null,
      phone: user.phone || null,
      role: user.role || 'user',
      provider: user.provider || null,
      providerId: user.providerId ? String(user.providerId) : null,
      birthDate: user.birthDate || null,
      birthTime: user.birthTime || null,
      isLunar: this.toInt(user.isLunar ?? false)
    });
    return this.getUser(res.lastInsertRowid as number) as Promise<User>;
  }
  async getAllUsers(): Promise<User[]> {
    const rows = db.prepare('SELECT * FROM users').all();
    return rows.map(row => this.mapUser(row));
  }
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const fields = Object.keys(user).map(k => `${k} = @${k}`).join(', ');
    if (!fields) return this.getUser(id);

    const params: any = { ...user, id };
    if (user.isLunar !== undefined) params.isLunar = this.toInt(user.isLunar ?? false);

    db.prepare(`UPDATE users SET ${fields} WHERE id = @id`).run(params);
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
      INSERT INTO news (title, summary, description, content, source, sourceUrl, url, imageUrl, category, isPinned, createdAt)
      VALUES (@title, @summary, @description, @content, @source, @sourceUrl, @url, @imageUrl, @category, @isPinned, @createdAt)
    `).run({
      ...news,
      imageUrl: news.imageUrl || null,
      isPinned: this.toInt(news.isPinned ?? false),
      createdAt: new Date().toISOString()
    });
    return this.getNewsById(res.lastInsertRowid as number) as Promise<News>;
  }
  async updateNews(id: number, news: Partial<InsertNews>): Promise<News | undefined> {
    const fields = Object.keys(news).map(k => `${k} = @${k}`).join(', ');
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
       INSERT INTO propertyInquiries (propertyId, userId, title, content, isReply, parentId, isReadByAdmin, createdAt)
       VALUES (@propertyId, @userId, @title, @content, @isReply, @parentId, @isReadByAdmin, @createdAt)
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
    const fields = Object.keys(inquiry).map(k => `${k} = @${k}`).join(', ');
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
    return { id: res.lastInsertRowid as number, userId: favorite.userId, propertyId: favorite.propertyId, createdAt: new Date() };
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
      INSERT INTO banners (location, imageUrl, linkUrl, openNewWindow, displayOrder, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      banner.location,
      banner.imageUrl,
      banner.linkUrl || null,
      this.toInt(banner.openNewWindow),
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

  async deleteBanner(id: number): Promise<boolean> {
    const result = db.prepare("DELETE FROM banners WHERE id = ?").run(id);
    return result.changes > 0;
  }

  async updateBannerOrder(id: number, newOrder: number): Promise<boolean> {
    const result = db.prepare("UPDATE banners SET displayOrder = ? WHERE id = ?").run(newOrder, id);
    return result.changes > 0;
  }

  // --- Init ---
  async initializeData(): Promise<void> {
    const adminUser = await this.getUserByUsername("admin");
    if (!adminUser) {
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
  }
}

export const storage = new SQLiteStorage();