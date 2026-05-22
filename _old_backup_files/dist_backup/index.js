var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/db.ts
import Database from "better-sqlite3";
import path from "path";
var dbPath, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    dbPath = path.join(process.cwd(), "database.sqlite");
    console.log(`[DB] Connecting to SQLite at: ${dbPath}`);
    db = new Database(dbPath, {
      verbose: console.log
    });
    process.on("exit", () => db.close());
    process.on("SIGHUP", () => process.exit(128 + 1));
    process.on("SIGINT", () => process.exit(128 + 2));
    process.on("SIGTERM", () => process.exit(128 + 15));
  }
});

// server/storage.ts
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
var scryptAsync, MemoryStore, SQLiteStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_db();
    scryptAsync = promisify(scrypt);
    MemoryStore = createMemoryStore(session);
    SQLiteStorage = class {
      sessionStore;
      constructor() {
        this.sessionStore = new MemoryStore({
          checkPeriod: 864e5
        });
        this.initializeTables();
        this.performMigrations();
      }
      performMigrations() {
        try {
          try {
            db.prepare("ALTER TABLE properties ADD COLUMN isUrgent INTEGER DEFAULT 0").run();
          } catch (e) {
          }
          try {
            db.prepare("ALTER TABLE properties ADD COLUMN urgentOrder INTEGER DEFAULT 0").run();
          } catch (e) {
          }
          try {
            db.prepare("ALTER TABLE properties ADD COLUMN isNegotiable INTEGER DEFAULT 0").run();
          } catch (e) {
          }
          try {
            db.prepare("ALTER TABLE properties ADD COLUMN negotiableOrder INTEGER DEFAULT 0").run();
          } catch (e) {
          }
          try {
            db.prepare("ALTER TABLE properties ADD COLUMN isVisible INTEGER DEFAULT 1").run();
          } catch (e) {
          }
          try {
            db.prepare("ALTER TABLE users ADD COLUMN birthDate TEXT").run();
          } catch (e) {
          }
          try {
            db.prepare("ALTER TABLE users ADD COLUMN birthTime TEXT").run();
          } catch (e) {
          }
          try {
            db.prepare("ALTER TABLE users ADD COLUMN isLunar INTEGER DEFAULT 0").run();
          } catch (e) {
          }
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
      initializeTables() {
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
        db.prepare(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        propertyId INTEGER NOT NULL,
        createdAt TEXT
      )
    `).run();
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
      toBoolean(val) {
        return val === 1;
      }
      toInt(val) {
        return val ? 1 : 0;
      }
      parseJSON(val) {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      mapProperty(row) {
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
      mapUser(row) {
        if (!row) return row;
        return {
          ...row,
          isLunar: this.toBoolean(row.isLunar)
        };
      }
      // --- Properties ---
      async getProperties() {
        const rows = db.prepare("SELECT * FROM properties WHERE isVisible = 1 ORDER BY displayOrder ASC, createdAt DESC").all();
        return rows.map((row) => this.mapProperty(row));
      }
      async getAllProperties() {
        const rows = db.prepare("SELECT * FROM properties ORDER BY displayOrder ASC, createdAt DESC").all();
        return rows.map((row) => this.mapProperty(row));
      }
      async getProperty(id) {
        const row = db.prepare("SELECT * FROM properties WHERE id = ?").get(id);
        return row ? this.mapProperty(row) : void 0;
      }
      async getFeaturedProperties(limit = 4) {
        const rows = db.prepare(`SELECT * FROM properties WHERE featured = 1 AND isVisible = 1 ORDER BY displayOrder ASC, createdAt DESC LIMIT ?`).all(limit);
        return rows.map((row) => this.mapProperty(row));
      }
      async getUrgentProperties(limit = 4) {
        const rows = db.prepare(`SELECT * FROM properties WHERE isUrgent = 1 AND isVisible = 1 ORDER BY urgentOrder ASC, createdAt DESC LIMIT ?`).all(limit);
        return rows.map((row) => this.mapProperty(row));
      }
      async getNegotiableProperties(limit = 4) {
        const rows = db.prepare(`SELECT * FROM properties WHERE isNegotiable = 1 AND isVisible = 1 ORDER BY negotiableOrder ASC, createdAt DESC LIMIT ?`).all(limit);
        return rows.map((row) => this.mapProperty(row));
      }
      async getPropertiesByType(type) {
        const rows = db.prepare("SELECT * FROM properties WHERE type = ? AND isVisible = 1 ORDER BY displayOrder ASC, createdAt DESC").all(type);
        return rows.map((row) => this.mapProperty(row));
      }
      async getPropertiesByDistrict(district) {
        const rows = db.prepare("SELECT * FROM properties WHERE district = ? AND isVisible = 1 ORDER BY displayOrder ASC, createdAt DESC").all(district);
        return rows.map((row) => this.mapProperty(row));
      }
      async getPropertiesByPriceRange(min, max) {
        const rows = db.prepare("SELECT * FROM properties WHERE isVisible = 1").all();
        return rows.map((row) => this.mapProperty(row)).filter((p) => {
          const val = Number(p.price || 0);
          return val >= min && val <= max;
        });
      }
      async getPropertiesByAddresses(addresses) {
        if (addresses.length === 0) return [];
        const placeholders = addresses.map(() => "?").join(",");
        const rows = db.prepare(`SELECT * FROM properties WHERE address IN (${placeholders}) LIMIT 10`).all(addresses.slice(0, 10));
        return rows.map((row) => this.mapProperty(row));
      }
      async createProperty(property) {
        const now = (/* @__PURE__ */ new Date()).toISOString();
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
        return this.getProperty(result.lastInsertRowid);
      }
      async updateProperty(id, property) {
        const existing = await this.getProperty(id);
        if (!existing) return void 0;
        const updates = { ...existing, ...property };
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const fields = [];
        const values = { id };
        const addIfPresent = (key, val) => {
          fields.push(`${key} = @${key}`);
          values[key] = val;
        };
        if (property.title !== void 0) addIfPresent("title", property.title);
        if (property.description !== void 0) addIfPresent("description", property.description);
        if (property.type !== void 0) addIfPresent("type", property.type);
        if (property.price !== void 0) addIfPresent("price", property.price);
        if (property.address !== void 0) addIfPresent("address", property.address);
        if (property.district !== void 0) addIfPresent("district", property.district);
        if (property.size !== void 0) addIfPresent("size", property.size);
        if (property.bedrooms !== void 0) addIfPresent("bedrooms", property.bedrooms);
        if (property.bathrooms !== void 0) addIfPresent("bathrooms", property.bathrooms);
        if (property.imageUrl !== void 0) addIfPresent("imageUrl", property.imageUrl);
        if (property.imageUrls !== void 0) addIfPresent("imageUrls", JSON.stringify(property.imageUrls));
        if (property.agentId !== void 0) addIfPresent("agentId", property.agentId);
        if (property.featured !== void 0) addIfPresent("featured", this.toInt(property.featured ?? false));
        if (property.displayOrder !== void 0) addIfPresent("displayOrder", property.displayOrder);
        if (property.isUrgent !== void 0) addIfPresent("isUrgent", this.toInt(property.isUrgent ?? false));
        if (property.urgentOrder !== void 0) addIfPresent("urgentOrder", property.urgentOrder);
        if (property.isNegotiable !== void 0) addIfPresent("isNegotiable", this.toInt(property.isNegotiable ?? false));
        if (property.negotiableOrder !== void 0) addIfPresent("negotiableOrder", property.negotiableOrder);
        if (property.isVisible !== void 0) addIfPresent("isVisible", this.toInt(property.isVisible ?? true));
        for (const key of Object.keys(property)) {
          if (key === "imageUrls" || key === "dealType") continue;
          if (key === "featured" || key === "isVisible" || key === "isUrgent" || key === "isNegotiable" || key === "elevator" || key === "coListing" || key === "isSold") continue;
          if (property[key] !== void 0) addIfPresent(key, property[key]);
        }
        if (property.dealType !== void 0) addIfPresent("dealType", JSON.stringify(property.dealType));
        if (property.elevator !== void 0) addIfPresent("elevator", this.toInt(property.elevator ?? false));
        if (property.coListing !== void 0) addIfPresent("coListing", this.toInt(property.coListing ?? false));
        if (property.isSold !== void 0) addIfPresent("isSold", this.toInt(property.isSold ?? false));
        addIfPresent("updatedAt", now);
        if (fields.length === 0) return this.getProperty(id);
        const query = `UPDATE properties SET ${fields.join(", ")} WHERE id = @id`;
        db.prepare(query).run(values);
        return this.getProperty(id);
      }
      async deleteProperty(id) {
        const res = db.prepare("DELETE FROM properties WHERE id = ?").run(id);
        return res.changes > 0;
      }
      async updatePropertyOrder(propertyId, newOrder) {
        db.prepare("UPDATE properties SET displayOrder = ? WHERE id = ?").run(newOrder, propertyId);
        return true;
      }
      async togglePropertyVisibility(propertyId, isVisible) {
        db.prepare("UPDATE properties SET isVisible = ? WHERE id = ?").run(this.toInt(isVisible ?? true), propertyId);
        return true;
      }
      async togglePropertyFeatured(propertyId, featured) {
        db.prepare("UPDATE properties SET featured = ? WHERE id = ?").run(this.toInt(featured ?? false), propertyId);
        return true;
      }
      async togglePropertyUrgent(propertyId, isUrgent) {
        db.prepare("UPDATE properties SET isUrgent = ? WHERE id = ?").run(this.toInt(isUrgent ?? false), propertyId);
        return true;
      }
      async togglePropertyNegotiable(propertyId, isNegotiable) {
        db.prepare("UPDATE properties SET isNegotiable = ? WHERE id = ?").run(this.toInt(isNegotiable ?? false), propertyId);
        return true;
      }
      async updatePropertyUrgentOrder(propertyId, newOrder) {
        db.prepare("UPDATE properties SET urgentOrder = ? WHERE id = ?").run(newOrder, propertyId);
        return true;
      }
      async updatePropertyNegotiableOrder(propertyId, newOrder) {
        db.prepare("UPDATE properties SET negotiableOrder = ? WHERE id = ?").run(newOrder, propertyId);
        return true;
      }
      // --- Agents ---
      async getAgents() {
        const rows = db.prepare("SELECT * FROM agents WHERE isActive = 1 ORDER BY id").all();
        return rows;
      }
      async getAgent(id) {
        return db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
      }
      async createAgent(agent) {
        const res = db.prepare(`
      INSERT INTO agents (name, email, phone, position, photo, bio, isActive, createdAt)
      VALUES (@name, @email, @phone, @position, @photo, @bio, @isActive, @createdAt)
    `).run({
          ...agent,
          isActive: this.toInt(agent.isActive ?? true),
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        return this.getAgent(res.lastInsertRowid);
      }
      async updateAgent(id, agent) {
        const fields = Object.keys(agent).map((k) => `${k} = @${k}`).join(", ");
        if (!fields) return this.getAgent(id);
        db.prepare(`UPDATE agents SET ${fields} WHERE id = @id`).run({ ...agent, id });
        return this.getAgent(id);
      }
      async deleteAgent(id) {
        db.prepare("DELETE FROM agents WHERE id = ?").run(id);
        return true;
      }
      // --- Inquiries ---
      async getInquiries() {
        return db.prepare("SELECT * FROM inquiries ORDER BY createdAt DESC").all();
      }
      async getInquiry(id) {
        return db.prepare("SELECT * FROM inquiries WHERE id = ?").get(id);
      }
      async createInquiry(inquiry) {
        const res = db.prepare(`
       INSERT INTO inquiries (name, email, phone, message, inquiryType, propertyId, createdAt)
       VALUES (@name, @email, @phone, @message, @inquiryType, @propertyId, @createdAt)
     `).run({
          ...inquiry,
          propertyId: inquiry.propertyId || null,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        return this.getInquiry(res.lastInsertRowid);
      }
      // --- Users ---
      async getUser(id) {
        const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
        return row ? this.mapUser(row) : void 0;
      }
      async getUserByUsername(username) {
        const row = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
        return row ? this.mapUser(row) : void 0;
      }
      async createUser(user) {
        const res = db.prepare(`
      INSERT INTO users (username, password, email, phone, role, provider, providerId, birthDate, birthTime, isLunar)
      VALUES (@username, @password, @email, @phone, @role, @provider, @providerId, @birthDate, @birthTime, @isLunar)
    `).run({
          username: user.username,
          password: user.password,
          email: user.email || null,
          phone: user.phone || null,
          role: user.role || "user",
          provider: user.provider || null,
          providerId: user.providerId ? String(user.providerId) : null,
          birthDate: user.birthDate || null,
          birthTime: user.birthTime || null,
          isLunar: this.toInt(user.isLunar ?? false)
        });
        return this.getUser(res.lastInsertRowid);
      }
      async getAllUsers() {
        const rows = db.prepare("SELECT * FROM users").all();
        return rows.map((row) => this.mapUser(row));
      }
      async updateUser(id, user) {
        const fields = Object.keys(user).map((k) => `${k} = @${k}`).join(", ");
        if (!fields) return this.getUser(id);
        const params = { ...user, id };
        if (user.isLunar !== void 0) params.isLunar = this.toInt(user.isLunar ?? false);
        db.prepare(`UPDATE users SET ${fields} WHERE id = @id`).run(params);
        return this.getUser(id);
      }
      async deleteUser(id) {
        db.prepare("DELETE FROM users WHERE id = ?").run(id);
        return true;
      }
      // --- News ---
      async getNews() {
        return db.prepare("SELECT * FROM news ORDER BY createdAt DESC").all();
      }
      async getLatestNews(limit = 6) {
        return db.prepare("SELECT * FROM news ORDER BY createdAt DESC LIMIT ?").all(limit);
      }
      async getNewsById(id) {
        return db.prepare("SELECT * FROM news WHERE id = ?").get(id);
      }
      async getNewsByCategory(category) {
        return db.prepare("SELECT * FROM news WHERE category = ? ORDER BY createdAt DESC").all(category);
      }
      // Implemented for News Fetcher
      async getNewsByTitle(title) {
        return db.prepare("SELECT * FROM news WHERE title = ?").get(title);
      }
      async createNews(news) {
        const res = db.prepare(`
      INSERT INTO news (title, summary, description, content, source, sourceUrl, url, imageUrl, category, isPinned, createdAt)
      VALUES (@title, @summary, @description, @content, @source, @sourceUrl, @url, @imageUrl, @category, @isPinned, @createdAt)
    `).run({
          ...news,
          imageUrl: news.imageUrl || null,
          isPinned: this.toInt(news.isPinned ?? false),
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        return this.getNewsById(res.lastInsertRowid);
      }
      async updateNews(id, news) {
        const fields = Object.keys(news).map((k) => `${k} = @${k}`).join(", ");
        if (!fields) return this.getNewsById(id);
        db.prepare(`UPDATE news SET ${fields} WHERE id = @id`).run({ ...news, id });
        return this.getNewsById(id);
      }
      async deleteNews(id) {
        db.prepare("DELETE FROM news WHERE id = ?").run(id);
        return true;
      }
      // --- Property Inquiries ---
      async getPropertyInquiries(propertyId) {
        const rows = db.prepare("SELECT * FROM propertyInquiries WHERE propertyId = ? ORDER BY createdAt DESC").all(propertyId);
        return rows.map((row) => ({
          ...row,
          isReply: this.toBoolean(row.isReply),
          isReadByAdmin: this.toBoolean(row.isReadByAdmin)
        }));
      }
      async getPropertyInquiry(id) {
        const row = db.prepare("SELECT * FROM propertyInquiries WHERE id = ?").get(id);
        if (!row) return void 0;
        return { ...row, isReply: this.toBoolean(row.isReply), isReadByAdmin: this.toBoolean(row.isReadByAdmin) };
      }
      async createPropertyInquiry(inquiry) {
        const res = db.prepare(`
       INSERT INTO propertyInquiries (propertyId, userId, title, content, isReply, parentId, isReadByAdmin, createdAt)
       VALUES (@propertyId, @userId, @title, @content, @isReply, @parentId, @isReadByAdmin, @createdAt)
     `).run({
          ...inquiry,
          parentId: inquiry.parentId || null,
          isReply: this.toInt(inquiry.isReply ?? false),
          isReadByAdmin: 0,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        return this.getPropertyInquiry(res.lastInsertRowid);
      }
      async updatePropertyInquiry(id, inquiry) {
        const fields = Object.keys(inquiry).map((k) => `${k} = @${k}`).join(", ");
        if (!fields) return this.getPropertyInquiry(id);
        const params = { ...inquiry, id };
        if (inquiry.isReply !== void 0) params.isReply = this.toInt(inquiry.isReply);
        if (inquiry.isReadByAdmin !== void 0) params.isReadByAdmin = this.toInt(inquiry.isReadByAdmin);
        db.prepare(`UPDATE propertyInquiries SET ${fields} WHERE id = @id`).run(params);
        return this.getPropertyInquiry(id);
      }
      async deletePropertyInquiry(id) {
        db.prepare("DELETE FROM propertyInquiries WHERE id = ?").run(id);
        return true;
      }
      async getUnreadInquiries() {
        const rows = db.prepare("SELECT * FROM propertyInquiries WHERE isReadByAdmin = 0 ORDER BY createdAt DESC").all();
        const joined = db.prepare(`
      SELECT pi.*, u.username as authorUsername, p.title as propertyTitle 
      FROM propertyInquiries pi 
      LEFT JOIN users u ON pi.userId = u.id 
      LEFT JOIN properties p ON pi.propertyId = p.id
      WHERE pi.isReadByAdmin = 0
      ORDER BY pi.createdAt DESC
    `).all();
        return joined.map((row) => ({
          ...row,
          isReply: this.toBoolean(row.isReply),
          isReadByAdmin: this.toBoolean(row.isReadByAdmin)
        }));
      }
      async getUnreadInquiryCount() {
        const res = db.prepare("SELECT COUNT(*) as count FROM propertyInquiries WHERE isReadByAdmin = 0").get();
        return res.count;
      }
      async markInquiryAsRead(id) {
        db.prepare("UPDATE propertyInquiries SET isReadByAdmin = 1 WHERE id = ?").run(id);
        return true;
      }
      async markAllInquiriesAsRead() {
        db.prepare("UPDATE propertyInquiries SET isReadByAdmin = 1 WHERE isReadByAdmin = 0").run();
        return true;
      }
      // --- Favorites ---
      async getUserFavorites(userId) {
        return db.prepare("SELECT * FROM favorites WHERE userId = ?").all(userId);
      }
      async getFavoriteProperties(userId) {
        const rows = db.prepare(`
       SELECT p.* FROM properties p
       JOIN favorites f ON p.id = f.propertyId
       WHERE f.userId = ?
     `).all(userId);
        return rows.map((row) => this.mapProperty(row));
      }
      async isFavorite(userId, propertyId) {
        const res = db.prepare("SELECT 1 FROM favorites WHERE userId = ? AND propertyId = ?").get(userId, propertyId);
        return !!res;
      }
      async addFavorite(favorite) {
        const res = db.prepare("INSERT INTO favorites (userId, propertyId, createdAt) VALUES (?, ?, ?)").run(
          favorite.userId,
          favorite.propertyId,
          (/* @__PURE__ */ new Date()).toISOString()
        );
        return { id: res.lastInsertRowid, userId: favorite.userId, propertyId: favorite.propertyId, createdAt: /* @__PURE__ */ new Date() };
      }
      async removeFavorite(userId, propertyId) {
        db.prepare("DELETE FROM favorites WHERE userId = ? AND propertyId = ?").run(userId, propertyId);
        return true;
      }
      // --- Banner Methods ---
      async getBanners(location) {
        let query = "SELECT * FROM banners";
        const params = [];
        if (location) {
          query += " WHERE location = ?";
          params.push(location);
        }
        query += " ORDER BY displayOrder ASC, createdAt DESC";
        const rows = db.prepare(query).all(...params);
        return rows.map((row) => ({
          ...row,
          openNewWindow: this.toBoolean(row.openNewWindow),
          createdAt: new Date(row.createdAt)
        }));
      }
      async createBanner(banner) {
        const result = db.prepare(`
      INSERT INTO banners (location, imageUrl, linkUrl, openNewWindow, displayOrder, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
          banner.location,
          banner.imageUrl,
          banner.linkUrl || null,
          this.toInt(banner.openNewWindow),
          banner.displayOrder || 0,
          (/* @__PURE__ */ new Date()).toISOString()
        );
        const newBanner = db.prepare("SELECT * FROM banners WHERE id = ?").get(result.lastInsertRowid);
        return {
          ...newBanner,
          openNewWindow: this.toBoolean(newBanner.openNewWindow),
          createdAt: new Date(newBanner.createdAt)
        };
      }
      async deleteBanner(id) {
        const result = db.prepare("DELETE FROM banners WHERE id = ?").run(id);
        return result.changes > 0;
      }
      async updateBannerOrder(id, newOrder) {
        const result = db.prepare("UPDATE banners SET displayOrder = ? WHERE id = ?").run(newOrder, id);
        return result.changes > 0;
      }
      // --- Init ---
      async initializeData() {
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
            name: "\uC774\uAC00\uC774\uBC84\uBD80\uB3D9\uC0B0",
            phone: "010-1234-5678",
            email: "eguyer@example.com",
            isActive: true,
            position: "\uACF5\uC778\uC911\uAC1C\uC0AC",
            bio: "\uC815\uC9C1\uACFC \uC2E0\uB8B0\uC758 \uC774\uAC00\uC774\uBC84 \uBD80\uB3D9\uC0B0\uC785\uB2C8\uB2E4."
          });
          console.log("Basic data initialized.");
        }
      }
    };
    storage = new SQLiteStorage();
  }
});

// server/blog-fetcher.ts
var blog_fetcher_exports = {};
__export(blog_fetcher_exports, {
  blogCache: () => blogCache,
  fetchBlogPosts: () => fetchBlogPosts,
  fetchBlogPostsByCategory: () => fetchBlogPostsByCategory,
  getLatestBlogPosts: () => getLatestBlogPosts
});
import fetch5 from "node-fetch";
import * as cheerio2 from "cheerio";
async function fetchBlogPostsByCategory(blogId, categoryNo, limit = 5) {
  try {
    console.log(`\uB124\uC774\uBC84 \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8 \uC694\uCCAD: blogId=${blogId}, categoryNo=${categoryNo}`);
    const pcUrl = categoryNo === "0" ? `https://blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=0&parentCategoryNo=11` : `https://blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=${categoryNo}`;
    const mobileUrl = categoryNo === "0" ? `https://m.blog.naver.com/${blogId}?categoryNo=0&parentCategoryNo=11` : `https://m.blog.naver.com/${blogId}?categoryNo=${categoryNo}`;
    let response = await fetch5(pcUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
      throw new Error(`\uBE14\uB85C\uADF8 \uB370\uC774\uD130 \uC694\uCCAD \uC2E4\uD328: ${response.status} ${response.statusText}`);
    }
    let html = await response.text();
    let $ = cheerio2.load(html);
    let posts = [];
    const postElements = $(".post_item, .lst_item, .se-post-item, .se_post_item, .blog2_post, .blog2_series, .post, .link-post, .list_item");
    if (postElements.length > 0) {
      console.log(`PC \uBC84\uC804 \uD30C\uC2F1: ${postElements.length}\uAC1C \uC694\uC18C \uCC3E\uC74C`);
      postElements.each((i, element) => {
        if (i >= limit) return;
        try {
          const $el = $(element);
          let postId = "";
          const href = $el.find("a").attr("href") || "";
          const logNoMatch = href.match(/logNo=(\d+)/) || href.match(/(\d{10,})$/);
          if (logNoMatch && logNoMatch[1]) {
            postId = logNoMatch[1];
          } else {
            postId = $el.attr("data-post-no") || $el.attr("data-entry-id") || `post-${Date.now()}-${i}`;
          }
          let title = "";
          const titleSelectors = [
            ".title_text",
            ".se-title-text",
            ".se_title_text",
            ".title",
            ".tit",
            ".se-module-text",
            ".se_module_text",
            ".link_title",
            ".pcol1",
            ".ell"
          ];
          for (const selector of titleSelectors) {
            const titleEl = $el.find(selector);
            if (titleEl.length > 0) {
              title = titleEl.first().text().trim();
              if (title) break;
            }
          }
          if (!title) {
            return;
          }
          if (title.includes("\n")) {
            title = title.split("\n")[0].trim();
          }
          if (title.includes("??")) {
            title = title.split("??")[0].trim() + "?";
          } else if (title.includes("? ")) {
            title = title.split("? ")[0].trim() + "?";
          }
          if (title.includes("..")) {
            title = title.split("..")[0].trim();
          }
          const patterns = [
            "\uAC15\uD654\uB3C4 \uBD80\uB3D9\uC0B0",
            "\uBD80\uB3D9\uC0B0",
            "\uACF5\uC778\uC911\uAC1C\uC0AC",
            "\uC911\uAC1C\uC0AC",
            "\uB9E4\uBB3C"
          ];
          for (const pattern of patterns) {
            const index = title.indexOf(pattern);
            if (index > 10) {
              title = title.substring(0, index).trim();
              break;
            }
          }
          if (title.length > 30) {
            title = title.substring(0, 30) + "...";
          }
          const link = `https://blog.naver.com/${blogId}/${postId}`;
          let thumbnail = "";
          const imgSelectors = [
            ".post_thumb img",
            ".se-thumbnail img",
            ".se_thumbnail img",
            ".img_thumb img",
            ".blog2_thumb img",
            ".photo_wrap img",
            ".se-image-resource",
            ".img img",
            ".thumb img",
            "img.img"
          ];
          for (const selector of imgSelectors) {
            const imgEl = $el.find(selector);
            if (imgEl.length > 0) {
              thumbnail = imgEl.first().attr("src") || imgEl.first().attr("data-lazy-src") || "";
              if (thumbnail) break;
            }
          }
          if (!thumbnail) {
            thumbnail = "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png";
          }
          let publishedAt = "";
          const dateSelectors = [
            ".date",
            ".se-date",
            ".se_date",
            ".blog2_date",
            ".time",
            ".date_post",
            ".date_time",
            ".post_date"
          ];
          for (const selector of dateSelectors) {
            const dateEl = $el.find(selector);
            if (dateEl.length > 0) {
              publishedAt = dateEl.first().text().trim();
              if (publishedAt) break;
            }
          }
          if (!publishedAt) {
            const today = /* @__PURE__ */ new Date();
            publishedAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
          } else {
            publishedAt = publishedAt.replace(/(\d{4})[년\-\/](\d{1,2})[월\-\/](\d{1,2})[일]?/g, "$1.$2.$3");
            if (!/^\d{4}\.\d{1,2}\.\d{1,2}/.test(publishedAt)) {
              const today = /* @__PURE__ */ new Date();
              publishedAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
            }
          }
          let summary = "";
          const summarySelectors = [
            ".post_content",
            ".se-text",
            ".se_text",
            ".post_text",
            ".text",
            ".se-module-text",
            ".text_passage",
            ".se-text-paragraph"
          ];
          for (const selector of summarySelectors) {
            const summaryEl = $el.find(selector);
            if (summaryEl.length > 0) {
              summary = summaryEl.first().text().trim();
              if (summary) {
                summary = summary.length > 100 ? summary.substring(0, 100) + "..." : summary;
                break;
              }
            }
          }
          posts.push({
            id: postId,
            title,
            link,
            thumbnail,
            publishedAt,
            category: CATEGORY_NAMES[categoryNo] || `\uCE74\uD14C\uACE0\uB9AC ${categoryNo}`,
            summary
          });
        } catch (err) {
          console.error(`\uD3EC\uC2A4\uD2B8 \uD30C\uC2F1 \uC624\uB958 (\uC778\uB371\uC2A4 ${i}):`, err);
        }
      });
    }
    if (posts.length === 0) {
      console.log("PC \uBC84\uC804 \uD30C\uC2F1 \uC2E4\uD328, \uBAA8\uBC14\uC77C \uBC84\uC804 \uC2DC\uB3C4");
      try {
        response = await fetch5(mobileUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
          }
        });
        html = await response.text();
        $ = cheerio2.load(html);
        const mobilePostElements = $("._itemSection, .list_item, .se_post, .post_item, .se_card, .post, .postlist");
        console.log(`\uBAA8\uBC14\uC77C \uBC84\uC804 \uD30C\uC2F1: ${mobilePostElements.length}\uAC1C \uC694\uC18C \uCC3E\uC74C`);
        mobilePostElements.each((i, element) => {
          if (i >= limit) return;
          try {
            const $el = $(element);
            let postId = "";
            const href = $el.find("a").attr("href") || "";
            const logNoMatch = href.match(/logNo=(\d+)/) || href.match(/(\d{10,})$/);
            if (logNoMatch && logNoMatch[1]) {
              postId = logNoMatch[1];
            } else {
              postId = `mobile-post-${Date.now()}-${i}`;
            }
            let title = "";
            const mobileTitleSelectors = [
              ".se_title",
              ".tit_feed",
              "._itemTitleContainer",
              "._feedTitle",
              ".se-title-text",
              ".title_link",
              ".title",
              ".link_title",
              ".ell"
            ];
            for (const selector of mobileTitleSelectors) {
              const titleEl = $el.find(selector);
              if (titleEl.length > 0) {
                title = titleEl.first().text().trim();
                if (title) break;
              }
            }
            if (!title) return;
            if (title.includes("\n")) {
              title = title.split("\n")[0].trim();
            } else if (title.includes("..")) {
              title = title.split("..")[0].trim();
            }
            if (title.length > 50) {
              title = title.substring(0, 50) + "...";
            }
            const link = `https://blog.naver.com/${blogId}/${postId}`;
            let thumbnail = "";
            const mobileImgSelectors = [
              "._thumbnail img",
              ".img_thumb img",
              ".img img",
              ".multi_img",
              ".se-thumbnail-image",
              ".img_area img"
            ];
            for (const selector of mobileImgSelectors) {
              const imgEl = $el.find(selector);
              if (imgEl.length > 0) {
                thumbnail = imgEl.first().attr("src") || imgEl.first().attr("data-src") || "";
                if (thumbnail) break;
              }
            }
            if (!thumbnail) {
              thumbnail = "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png";
            }
            let publishedAt = "";
            const mobileDateSelectors = [
              ".date_post",
              ".date_time",
              ".info_post time",
              ".date",
              ".date_info",
              ".pub_time"
            ];
            for (const selector of mobileDateSelectors) {
              const dateEl = $el.find(selector);
              if (dateEl.length > 0) {
                publishedAt = dateEl.first().text().trim();
                if (publishedAt) break;
              }
            }
            if (!publishedAt) {
              const today = /* @__PURE__ */ new Date();
              publishedAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
            } else {
              publishedAt = publishedAt.replace(/(\d{4})[년\-\/](\d{1,2})[월\-\/](\d{1,2})[일]?/g, "$1.$2.$3");
              if (!/^\d{4}\.\d{1,2}\.\d{1,2}/.test(publishedAt)) {
                const today = /* @__PURE__ */ new Date();
                publishedAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
              }
            }
            let summary = "";
            const mobileSummarySelectors = [
              ".se_textarea",
              ".text_passage",
              ".post_text",
              ".se-text-paragraph",
              ".text",
              ".post_ct"
            ];
            for (const selector of mobileSummarySelectors) {
              const summaryEl = $el.find(selector);
              if (summaryEl.length > 0) {
                summary = summaryEl.first().text().trim();
                if (summary) {
                  summary = summary.length > 100 ? summary.substring(0, 100) + "..." : summary;
                  break;
                }
              }
            }
            posts.push({
              id: postId,
              title,
              link,
              thumbnail,
              publishedAt,
              category: CATEGORY_NAMES[categoryNo] || `\uCE74\uD14C\uACE0\uB9AC ${categoryNo}`,
              summary
            });
          } catch (err) {
            console.error(`\uBAA8\uBC14\uC77C \uD3EC\uC2A4\uD2B8 \uD30C\uC2F1 \uC624\uB958 (\uC778\uB371\uC2A4 ${i}):`, err);
          }
        });
      } catch (err) {
        console.error("\uBAA8\uBC14\uC77C \uBC84\uC804 \uC694\uCCAD \uC624\uB958:", err);
      }
    }
    console.log(`\uB124\uC774\uBC84 \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8 ${posts.length}\uAC1C \uCD94\uCD9C \uC131\uACF5, \uCE74\uD14C\uACE0\uB9AC: ${CATEGORY_NAMES[categoryNo] || categoryNo}`);
    return posts;
  } catch (error) {
    console.error("\uB124\uC774\uBC84 \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
    return [];
  }
}
async function fetchBlogPosts(blogId = "9551304", categoryNos = ["0", "35", "36", "37"], limit = 5) {
  try {
    const postsPromises = categoryNos.map(
      (categoryNo) => fetchBlogPostsByCategory(blogId, categoryNo, limit)
    );
    const postsArrays = await Promise.all(postsPromises);
    const allPosts = postsArrays.flat();
    const uniquePostIds = /* @__PURE__ */ new Set();
    const filteredPosts = allPosts.filter((post) => {
      const isValid = post.title !== "\uC544\uC9C1 \uC791\uC131\uB41C \uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." && !post.id.startsWith("post-") && post.title.trim() !== "";
      if (isValid) {
        if (uniquePostIds.has(post.id)) {
          return false;
        }
        uniquePostIds.add(post.id);
        return true;
      }
      return false;
    });
    filteredPosts.sort((a, b) => {
      return b.publishedAt.localeCompare(a.publishedAt);
    });
    if (filteredPosts.length === 0) {
      console.log("\uBE14\uB85C\uADF8 \uB370\uC774\uD130 \uCD94\uCD9C \uC2E4\uD328, \uD14C\uC2A4\uD2B8 \uB370\uC774\uD130 \uC0AC\uC6A9");
      return [
        {
          id: "223869409800",
          title: "\uB0B4\uAC00 \uC774\uC81C ai\uC5D0 \uC785\uBB38\uC744 \uD55C\uAC83\uC778\uAC00?",
          link: "https://blog.naver.com/9551304/223869409800",
          thumbnail: "https://blogthumb.pstatic.net/MjAyNTA1MThfMjA4/MDAxNzQ3NTM5MjIwOTkx.lt3Zk9kp5c-9NjDHAkg6fRixgyAn3PXizR1B9E9PbbAg.bRkW0jYC2bSuLuF5hYWBat0dId9T90SJTTMkdUflQg4g.PNG/%3F%8A%A4%3F%81%AC%EB%A6%B0%EC%83%B7_2025-05-17_163709.png",
          publishedAt: "2025.05.19",
          category: "\uBE14\uB85C\uADF8 \uCD5C\uC2E0\uAE00",
          summary: "ai\uC5D0 \uB300\uD55C \uB098\uC758 \uC0DD\uAC01\uACFC \uACBD\uD5D8"
        },
        {
          id: "223809018523",
          title: "\uC870\uC2EC \uB610 \uC870\uC2EC",
          link: "https://blog.naver.com/9551304/223809018523",
          thumbnail: "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png",
          publishedAt: "2025.05.19",
          category: "\uC138\uC0C1\uC774\uC57C\uAE30",
          summary: "\uC77C\uC0C1\uC5D0\uC11C\uC758 \uC548\uC804\uACFC \uC8FC\uC758\uC0AC\uD56D"
        },
        {
          id: "222502515110",
          title: "\uBCFC\uC74C\uB3C4\uB9AC \uAC1C\uBC1C\uC6A9 \uB0AE\uC740\uC784\uC57C 18500\uD3C9",
          link: "https://blog.naver.com/9551304/222502515110",
          thumbnail: "https://blogthumb.pstatic.net/MjAyMTA5MTFfMjk3/MDAxNjMxMzQ2MjIxNjcy.P0bbr5dpaMbgjTxhAhcf69a983bg0oAffyx5Ly6ODzcg.FkEWdogH6Hz8zavcOQmyo-bYVXbQVBzSL9ANkMQ8JdUg.JPEG.9551304/Untitled-1.jpg",
          publishedAt: "2021.09.11",
          category: "\uC77C\uC0C1\uB2E4\uBC18\uC0AC",
          summary: "\uAC15\uD654\uB3C4 \uBD80\uB3D9\uC0B0 \uB9E4\uBB3C \uC18C\uAC1C"
        }
      ];
    }
    return filteredPosts.slice(0, limit);
  } catch (error) {
    console.error("\uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
    return [];
  }
}
async function extractPostImage(blogId, postId) {
  try {
    const mobileUrl = `https://m.blog.naver.com/${blogId}/${postId}`;
    console.log(`\uD3EC\uC2A4\uD2B8 \uC774\uBBF8\uC9C0 \uCD94\uCD9C \uC2DC\uB3C4 (\uBAA8\uBC14\uC77C): ${mobileUrl}`);
    const mobileResponse = await fetch5(mobileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
      }
    });
    const mobileHtml = await mobileResponse.text();
    const $ = cheerio2.load(mobileHtml);
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) {
      console.log(`\uBAA8\uBC14\uC77C \uBC84\uC804 OpenGraph \uC774\uBBF8\uC9C0 \uBC1C\uACAC: ${ogImage}`);
      return ogImage;
    }
    const iframeUrl = $("#mainFrame").attr("src");
    if (iframeUrl) {
      const iframeImage = await extractImageFromIframe(iframeUrl);
      if (iframeImage) {
        console.log(`iframe\uC5D0\uC11C \uC774\uBBF8\uC9C0 \uBC1C\uACAC: ${iframeImage}`);
        return iframeImage;
      }
    }
    const thumbSelectors = [
      ".se-thumbnail-image",
      ".se-image-resource",
      ".se_thumbnail",
      ".se_image",
      ".img_box img",
      ".post-thumbnail",
      ".post_image"
    ];
    for (const selector of thumbSelectors) {
      const imgEl = $(selector);
      if (imgEl.length > 0) {
        const src = imgEl.attr("src") || imgEl.attr("data-src");
        if (src) {
          console.log(`\uBAA8\uBC14\uC77C \uBC84\uC804 \uC774\uBBF8\uC9C0 \uC694\uC18C \uBC1C\uACAC: ${src}`);
          return src;
        }
      }
    }
    console.log("\uBAA8\uBC14\uC77C \uBC84\uC804\uC5D0\uC11C \uC774\uBBF8\uC9C0\uB97C \uCC3E\uC9C0 \uBABB\uD568, PC \uBC84\uC804 \uC2DC\uB3C4");
    return await extractPostImageFromFullUrl(`https://blog.naver.com/${blogId}/${postId}`);
  } catch (error) {
    console.error(`\uD3EC\uC2A4\uD2B8 \uC774\uBBF8\uC9C0 \uCD94\uCD9C \uC624\uB958 (${blogId}/${postId}):`, error);
    return "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png";
  }
}
async function extractImageFromIframe(iframeSrc) {
  try {
    const fullIframeUrl = iframeSrc.startsWith("http") ? iframeSrc : `https://blog.naver.com${iframeSrc}`;
    const response = await fetch5(fullIframeUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
      }
    });
    const html = await response.text();
    const $ = cheerio2.load(html);
    const imgSelectors = [
      ".se-thumbnail-image",
      ".se-image-resource",
      ".se_thumbnail",
      ".se_image",
      ".img_box img",
      ".post-thumbnail",
      ".post_image",
      ".se-main-container img"
    ];
    for (const selector of imgSelectors) {
      const imgEl = $(selector);
      if (imgEl.length > 0) {
        const src = imgEl.attr("src") || imgEl.attr("data-src");
        if (src) return src;
      }
    }
    return "";
  } catch (error) {
    console.error("iframe \uC774\uBBF8\uC9C0 \uCD94\uCD9C \uC624\uB958:", error);
    return "";
  }
}
async function extractPostImageFromFullUrl(fullUrl) {
  try {
    console.log(`\uC804\uCCB4 URL\uB85C \uC774\uBBF8\uC9C0 \uCD94\uCD9C \uC2DC\uB3C4: ${fullUrl}`);
    const response = await fetch5(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
      }
    });
    const html = await response.text();
    const $ = cheerio2.load(html);
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) {
      console.log(`PC \uBC84\uC804 OpenGraph \uC774\uBBF8\uC9C0 \uBC1C\uACAC: ${ogImage}`);
      return ogImage;
    }
    const imgSelectors = [
      ".se-thumbnail-image",
      ".se-image-resource",
      ".se_thumbnail",
      ".se_image",
      ".img_box img",
      ".post-thumbnail",
      ".post_image",
      ".se-main-container img",
      ".thumb img",
      ".representative-thumbnail img"
    ];
    for (const selector of imgSelectors) {
      const imgEl = $(selector);
      if (imgEl.length > 0) {
        const src = imgEl.attr("src") || imgEl.attr("data-src");
        if (src) {
          console.log(`PC \uBC84\uC804 \uC774\uBBF8\uC9C0 \uC694\uC18C \uBC1C\uACAC: ${src}`);
          return src;
        }
      }
    }
    console.log("\uC774\uBBF8\uC9C0\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uAE30\uBCF8 \uC774\uBBF8\uC9C0 \uBC18\uD658");
    return "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png";
  } catch (error) {
    console.error("PC \uBC84\uC804 \uC774\uBBF8\uC9C0 \uCD94\uCD9C \uC624\uB958:", error);
    return "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png";
  }
}
function getFallbackImageByCategory(category) {
  const categoryImages = {
    "\uC77C\uC0C1\uB2E4\uBC18\uC0AC": "https://postfiles.pstatic.net/MjAyNTA1MTVfMjE4/MDAxNzQ3Mjc1ODY1MTQy.ycdYfrR63FHN9GS7EzNgMu2Kiy_CldX6Zk5szOrYuVUg.yx_nZEPj7PKpEVhwuW8UuTHKQw9d8Xou7rIu0zOVEeAg.PNG/daily-life.png?type=w580",
    "\uC138\uC0C1\uC774\uC57C\uAE30": "https://postfiles.pstatic.net/MjAyNTA1MTVfNTYg/MDAxNzQ3Mjc1ODY1MTQz.1lTZM1oxLQlxw3nNcyeHvV3CpxrVwZQMg_cN2GlWBJMg.-Bi6JK8-rEdQYK07Y9aE5Y9Zrjra9ZDu8KlUbTsAWJEg.PNG/world-stories.png?type=w580",
    "\uBE14\uB85C\uADF8 \uCD5C\uC2E0\uAE00": "https://postfiles.pstatic.net/MjAyNTA1MTVfNDUg/MDAxNzQ3Mjc1ODY1MTQ0.UeOGoBn6MVN_OMFGlUCqbqI6Hkbli5oeNv5Kza2Fmrcg.3uFFdpI2JVQGBVnYNjGvcFGc1TmOqTtlHqGC5h54O7gg.PNG/latest-posts.png?type=w580",
    "\uBAA8\uB4E0 \uAE00": "https://postfiles.pstatic.net/MjAyNTA1MTVfMTAz/MDAxNzQ3Mjc1ODY1MTQ1._yBnSpkXK6yEVDkgOhJxdrvfL_tqlOjCCDYxUiJVGrAg.DmWJzgF54RkjPkfuS1QsELMdLQwT9gAZ_aMX6fU-HCMg.PNG/all-posts.png?type=w580"
  };
  console.log(`\uCE74\uD14C\uACE0\uB9AC \uAE30\uBC18 \uB300\uCCB4 \uC774\uBBF8\uC9C0 \uC0AC\uC6A9: ${category} -> ${categoryImages[category] || "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png"}`);
  return categoryImages[category] || "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png";
}
async function enrichPostsWithImages(posts) {
  const enrichedPosts = [...posts];
  for (let i = 0; i < enrichedPosts.length; i++) {
    const post = enrichedPosts[i];
    if (!post.thumbnail || post.thumbnail === "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png" || post.thumbnail.includes("blog_profile_thumbnail")) {
      try {
        const urlParts = post.link.split("/");
        const blogId = urlParts[urlParts.length - 2];
        const postId = urlParts[urlParts.length - 1];
        const extractedImage = await extractPostImage(blogId, postId);
        if (extractedImage && extractedImage !== "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png") {
          enrichedPosts[i].thumbnail = extractedImage;
        } else {
          enrichedPosts[i].thumbnail = getFallbackImageByCategory(post.category);
        }
      } catch (error) {
        console.error(`\uD3EC\uC2A4\uD2B8 \uC774\uBBF8\uC9C0 \uAC15\uD654 \uC2E4\uD328 (${post.id}):`, error);
        enrichedPosts[i].thumbnail = getFallbackImageByCategory(post.category);
      }
    }
  }
  return enrichedPosts;
}
async function getLatestBlogPosts(blogId = "9551304", categoryNos = ["35", "36", "37"], limit = 3) {
  const cacheKey = `${blogId}_${categoryNos.sort().join("_")}_${limit}`;
  const now = Date.now();
  if (blogCache[cacheKey] && blogCache[cacheKey].expires > now) {
    console.log(`\uCE90\uC2DC\uB41C \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8 \uC815\uBCF4 \uBC18\uD658 (\uD0A4: ${cacheKey})`);
    return blogCache[cacheKey].posts;
  }
  console.log(`\uBE14\uB85C\uADF8 \uB370\uC774\uD130 \uC0C8\uB85C \uC694\uCCAD (\uD0A4: ${cacheKey})`);
  const allPosts = [];
  for (const categoryNo of categoryNos) {
    try {
      const categoryPosts = await fetchBlogPostsByCategory(blogId, categoryNo, limit * 5);
      if (categoryPosts && categoryPosts.length > 0) {
        console.log(`\uCE74\uD14C\uACE0\uB9AC ${categoryNo}\uC5D0\uC11C ${categoryPosts.length}\uAC1C \uD3EC\uC2A4\uD2B8 \uAC00\uC838\uC634`);
        allPosts.push(...categoryPosts);
      }
    } catch (e) {
      console.error(`\uCE74\uD14C\uACE0\uB9AC ${categoryNo} \uD3EC\uC2A4\uD2B8 \uAC00\uC838\uC624\uAE30 \uC2E4\uD328:`, e);
    }
  }
  console.log(`\uCD1D ${allPosts.length}\uAC1C \uD3EC\uC2A4\uD2B8 \uC218\uC9D1\uB428 (\uC911\uBCF5/\uD544\uD130\uB9C1 \uC804)`);
  const validPosts = allPosts.filter(
    (post) => post && post.title && post.title.trim() !== "" && post.title !== "\uC544\uC9C1 \uC791\uC131\uB41C \uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." && !post.id.startsWith("post-")
  );
  const postsWithDates = validPosts.map((post) => {
    let date;
    try {
      const [year, month, day] = post.publishedAt.split(".");
      if (year && month && day) {
        const y = parseInt(year, 10);
        const m = parseInt(month, 10) - 1;
        const d = parseInt(day, 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y >= 2e3 && y <= 2025 && // 현실적인 연도 범위 체크
        m >= 0 && m < 12 && d >= 1 && d <= 31) {
          date = new Date(y, m, d);
        } else {
          date = /* @__PURE__ */ new Date();
          console.log(`\uB0A0\uC9DC \uBC94\uC704 \uC624\uB958: ${post.publishedAt}, ID: ${post.id}`);
        }
      } else {
        date = /* @__PURE__ */ new Date();
        console.log(`\uB0A0\uC9DC \uD615\uC2DD \uC624\uB958: ${post.publishedAt}, ID: ${post.id}`);
      }
    } catch (e) {
      date = /* @__PURE__ */ new Date();
      console.log(`\uB0A0\uC9DC \uD30C\uC2F1 \uC2E4\uD328: ${post.publishedAt}, ID: ${post.id}`);
    }
    const postIdNum = parseInt(post.id, 10);
    if (!isNaN(postIdNum) && postIdNum < 2e8) {
      date = new Date(2020, 0, 1);
      console.log(`\uC624\uB798\uB41C \uD3EC\uC2A4\uD2B8 \uAC10\uC9C0: ID ${post.id}\uB294 2021\uB144 \uC774\uC804 \uAC8C\uC2DC\uBB3C\uB85C \uCD94\uC815`);
    }
    return {
      ...post,
      parsedDate: date
    };
  });
  const uniqueIdMap = /* @__PURE__ */ new Map();
  for (const post of postsWithDates) {
    if (uniqueIdMap.has(post.id)) {
      const existing = uniqueIdMap.get(post.id);
      if (post.parsedDate > existing.parsedDate) {
        uniqueIdMap.set(post.id, post);
      }
    } else {
      uniqueIdMap.set(post.id, post);
    }
  }
  let sortedPosts = Array.from(uniqueIdMap.values()).sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
  console.log(`\uC911\uBCF5 \uC81C\uAC70 \uD6C4 ${sortedPosts.length}\uAC1C\uC758 \uC720\uD6A8\uD55C \uD3EC\uC2A4\uD2B8 \uCC3E\uC74C`);
  sortedPosts = sortedPosts.slice(0, limit);
  sortedPosts.forEach((post, index) => {
    const dateStr = post.parsedDate.toISOString().split("T")[0];
    console.log(`[${index + 1}] \uB0A0\uC9DC: ${dateStr}, ID: ${post.id}, \uC81C\uBAA9: ${post.title.substring(0, 30)}${post.title.length > 30 ? "..." : ""}`);
  });
  console.log(`\uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8 \uC774\uBBF8\uC9C0 \uC815\uBCF4 \uAC15\uD654 \uC911... (${sortedPosts.length}\uAC1C)`);
  const finalPosts = sortedPosts.map(({ parsedDate, ...post }) => post);
  const enrichedPosts = await enrichPostsWithImages(finalPosts);
  if (enrichedPosts.length > 0) {
    blogCache[cacheKey] = {
      posts: enrichedPosts,
      expires: now + CACHE_TTL
    };
    console.log(`${enrichedPosts.length}\uAC1C\uC758 \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8\uB97C \uCE90\uC2DC\uC5D0 \uC800\uC7A5 (${CACHE_TTL / (60 * 1e3)}\uBD84)`);
  }
  return enrichedPosts;
}
var CATEGORY_NAMES, blogCache, CACHE_TTL;
var init_blog_fetcher = __esm({
  "server/blog-fetcher.ts"() {
    "use strict";
    CATEGORY_NAMES = {
      "35": "\uB098\uC758 \uCDE8\uBBF8\uC0DD\uD65C",
      "36": "\uC138\uC0C1\uC774\uC57C\uAE30",
      "37": "\uBD80\uB3D9\uC0B0\uC815\uBCF4"
    };
    blogCache = {};
    CACHE_TTL = 1 * 60 * 1e3;
  }
});

// server/seeder.ts
var seeder_exports = {};
__export(seeder_exports, {
  seedInitialData: () => seedInitialData
});
import { scrypt as scrypt3, randomBytes as randomBytes3 } from "crypto";
import { promisify as promisify3 } from "util";
async function hashPassword3(password) {
  const salt = randomBytes3(16).toString("hex");
  const buf = await scryptAsync3(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function seedInitialData() {
  try {
    console.log("Starting DB seeding check...");
    const adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      console.log("Creating default admin user...");
      const hashedPassword = await hashPassword3("admin123");
      await storage.createUser({
        username: "admin",
        password: hashedPassword,
        email: "admin@example.com",
        role: "admin",
        phone: "010-1234-5678"
      });
      console.log("Default admin created: admin / admin123");
    } else {
      console.log("Admin user already exists.");
    }
    const properties = await storage.getProperties();
    if (properties.length === 0) {
      console.log("No properties found. Seeding sample properties...");
      for (const prop of sampleProperties) {
        await storage.createProperty(prop);
      }
      console.log(`Seeded ${sampleProperties.length} sample properties.`);
    } else {
      console.log(`Database already has ${properties.length} properties.`);
    }
    console.log("DB seeding check completed.");
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
}
var scryptAsync3, sampleProperties;
var init_seeder = __esm({
  "server/seeder.ts"() {
    "use strict";
    init_storage();
    scryptAsync3 = promisify3(scrypt3);
    sampleProperties = [
      {
        title: "\uAC15\uD654\uB3C4 \uC804\uB9DD \uC88B\uC740 \uC804\uC6D0\uC8FC\uD0DD",
        description: "\uB0A8\uD5A5\uC73C\uB85C \uD587\uC0B4\uC774 \uC798 \uB4E4\uACE0 \uBC14\uB2E4\uAC00 \uBCF4\uC774\uB294 \uBA4B\uC9C4 \uC804\uC6D0\uC8FC\uD0DD\uC785\uB2C8\uB2E4. \uB113\uC740 \uB9C8\uB2F9\uACFC \uD143\uBC2D\uC774 \uC788\uC5B4 \uC804\uC6D0\uC0DD\uD65C\uD558\uAE30 \uB531 \uC88B\uC2B5\uB2C8\uB2E4.",
        type: "\uC804\uC6D0\uC8FC\uD0DD",
        price: "450000000",
        address: "\uC778\uCC9C\uAD11\uC5ED\uC2DC \uAC15\uD654\uAD70 \uD654\uB3C4\uBA74",
        district: "\uD654\uB3C4\uBA74",
        size: "150",
        bedrooms: 3,
        bathrooms: 2,
        imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        imageUrls: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1600596542815-2a4d9fdd4070?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        ],
        agentId: 1,
        featured: true,
        displayOrder: 1,
        isVisible: true,
        dealType: ["\uB9E4\uB9E4"],
        supplyArea: "180",
        privateArea: "150",
        totalFloors: 2,
        floor: 1,
        heatingSystem: "LPG",
        parking: "2\uB300",
        buildingName: "\uD574\uC624\uB984\uB9C8\uC744",
        approvalDate: "2023-05-20",
        landType: "\uB300\uC9C0",
        zoneType: "\uACC4\uD68D\uAD00\uB9AC\uC9C0\uC5ED"
      },
      {
        title: "\uAE38\uC0C1\uBA74 \uC870\uC6A9\uD55C \uCD0C\uC9D1 \uAE09\uB9E4",
        description: "\uB9AC\uBAA8\uB378\uB9C1\uC774 \uC870\uAE08 \uD544\uC694\uD558\uC9C0\uB9CC \uBF08\uB300\uAC00 \uD2BC\uD2BC\uD55C \uAD6C\uC625\uC785\uB2C8\uB2E4. \uB9C8\uC744 \uC785\uAD6C\uC5D0 \uC704\uCE58\uD558\uC5EC \uC811\uADFC\uC131\uC774 \uC88B\uACE0 \uAC00\uACA9\uC774 \uC800\uB834\uD569\uB2C8\uB2E4.",
        type: "\uAD6C\uC625/\uB18D\uAC00\uC8FC\uD0DD",
        price: "180000000",
        address: "\uC778\uCC9C\uAD11\uC5ED\uC2DC \uAC15\uD654\uAD70 \uAE38\uC0C1\uBA74",
        district: "\uAE38\uC0C1\uBA74",
        size: "85",
        bedrooms: 2,
        bathrooms: 1,
        imageUrl: "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        imageUrls: ["https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        agentId: 1,
        featured: false,
        displayOrder: 2,
        isVisible: true,
        dealType: ["\uB9E4\uB9E4"],
        supplyArea: "90",
        privateArea: "85",
        totalFloors: 1,
        floor: 1,
        heatingSystem: "\uAE30\uB984\uBCF4\uC77C\uB7EC",
        parking: "1\uB300",
        landType: "\uB300\uC9C0",
        zoneType: "\uC0DD\uC0B0\uAD00\uB9AC\uC9C0\uC5ED"
      },
      {
        title: "\uC591\uB3C4\uBA74 \uB113\uC740 \uD1A0\uC9C0 \uB9E4\uB9E4",
        description: "4\uCC28\uC120 \uB3C4\uB85C\uC5D0 \uC778\uC811\uD55C \uB113\uC740 \uD1A0\uC9C0\uC785\uB2C8\uB2E4. \uCE74\uD398\uB098 \uD39C\uC158 \uBD80\uC9C0\uB85C \uC544\uC8FC \uC801\uD569\uD569\uB2C8\uB2E4.",
        type: "\uD1A0\uC9C0/\uC784\uC57C",
        price: "850000000",
        address: "\uC778\uCC9C\uAD11\uC5ED\uC2DC \uAC15\uD654\uAD70 \uC591\uB3C4\uBA74",
        district: "\uC591\uB3C4\uBA74",
        size: "3300",
        bedrooms: 0,
        bathrooms: 0,
        imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        imageUrls: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        agentId: 1,
        featured: true,
        displayOrder: 3,
        isVisible: true,
        dealType: ["\uB9E4\uB9E4"],
        landType: "\uC804",
        zoneType: "\uBCF4\uC804\uAD00\uB9AC\uC9C0\uC5ED"
      }
    ];
  }
});

// server/index.ts
import "dotenv/config";
import express3 from "express";
import path5 from "path";

// server/routes.ts
init_storage();
import { createServer } from "http";
import { z as z2 } from "zod";
import multer from "multer";
import fs3 from "fs";
import path4 from "path";
import express2 from "express";
import { Jimp } from "jimp";

// shared/schema.ts
import { z } from "zod";
var propertySchema = z.object({
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
  viewCount: z.number().default(0).optional()
});
var insertPropertySchema = propertySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  // Form data preprocessing
  price: z.union([z.string(), z.number()]).optional().transform((val) => val === "" || val === void 0 || val === null ? "0" : String(val))
});
var agentSchema = z.object({
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
var insertAgentSchema = agentSchema.omit({ id: true, createdAt: true });
var inquirySchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  message: z.string(),
  inquiryType: z.string(),
  propertyId: z.number().optional().nullable(),
  createdAt: z.date().optional()
});
var insertInquirySchema = inquirySchema.omit({ id: true, createdAt: true });
var userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().default("user").optional(),
  provider: z.string().optional().nullable(),
  providerId: z.string().or(z.number()).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  // YYYY-MM-DD
  birthTime: z.string().optional().nullable(),
  // HH:MM
  isLunar: z.boolean().default(false).optional()
  // Added: Lunar Calendar flag
});
var insertUserSchema = userSchema.pick({
  username: true,
  password: true,
  email: true,
  phone: true,
  role: true,
  provider: true,
  providerId: true,
  birthDate: true,
  birthTime: true,
  isLunar: true
  // Added
});
var newsSchema = z.object({
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
var insertNewsSchema = newsSchema.omit({ id: true, createdAt: true });
var propertyInquirySchema = z.object({
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
var insertPropertyInquirySchema = propertyInquirySchema.omit({ id: true, createdAt: true });
var favoriteSchema = z.object({
  id: z.number(),
  userId: z.number(),
  propertyId: z.number(),
  createdAt: z.date().optional()
});
var insertFavoriteSchema = favoriteSchema.omit({ id: true, createdAt: true });
var bannerSchema = z.object({
  id: z.number(),
  location: z.string(),
  // 'left' or 'right'
  imageUrl: z.string(),
  linkUrl: z.string().optional().nullable(),
  openNewWindow: z.boolean().default(false),
  displayOrder: z.number().default(0),
  createdAt: z.date().optional()
});
var insertBannerSchema = bannerSchema.omit({ id: true, createdAt: true });

// server/cache.ts
var MemoryCache = class {
  cache = /* @__PURE__ */ new Map();
  DEFAULT_TTL = 5 * 60 * 1e3;
  // 5분 기본 캐시 시간
  /**
   * 캐시에서 값을 가져옴
   * @param key 캐시 키
   * @returns 캐시된 값 또는 undefined (만료 또는 없음)
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) {
      if (item) this.cache.delete(key);
      return void 0;
    }
    return item.value;
  }
  /**
   * 캐시에 값을 저장
   * @param key 캐시 키
   * @param value 저장할 값
   * @param ttl 캐시 유효 시간(ms), 기본값 5분
   */
  set(key, value, ttl = this.DEFAULT_TTL) {
    const now = Date.now();
    const expiry = now + ttl;
    this.cache.set(key, { value, expiry, timestamp: now });
  }
  /**
   * 캐시 항목이 생성된 시간을 반환
   * @param key 캐시 키
   * @returns 캐시 생성 시간(타임스탬프) 또는 undefined (캐시 없음)
   */
  getTimestamp(key) {
    const item = this.cache.get(key);
    return item ? item.timestamp : void 0;
  }
  /**
   * 특정 키의 캐시 삭제
   * @param key 삭제할 캐시 키
   */
  delete(key) {
    this.cache.delete(key);
  }
  /**
   * 특정 프리픽스로 시작하는 모든 캐시 삭제
   * @param prefix 캐시 키 프리픽스
   */
  deleteByPrefix(prefix) {
    Array.from(this.cache.keys()).forEach((key) => {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    });
  }
  /**
   * 모든 캐시 삭제
   */
  clear() {
    this.cache.clear();
  }
  /**
   * 만료된 모든 캐시 항목 삭제 (정리)
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
};
var memoryCache = new MemoryCache();
setInterval(() => {
  memoryCache.cleanup();
}, 5 * 60 * 1e3);

// server/auth.ts
init_storage();
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as NaverStrategy } from "passport-naver";
import { Strategy as KakaoStrategy } from "passport-kakao";
import session2 from "express-session";
import { scrypt as scrypt2, randomBytes as randomBytes2, timingSafeEqual } from "crypto";
import { promisify as promisify2 } from "util";
var scryptAsync2 = promisify2(scrypt2);
async function hashPassword2(password) {
  const salt = randomBytes2(16).toString("hex");
  const buf = await scryptAsync2(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync2(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
storage.initializeData().catch(console.error);
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "\uD55C\uAD6D\uBD80\uB3D9\uC0B0\uBE44\uBC00\uD0A4",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1e3,
      // 24시간
      httpOnly: true
    },
    store: storage.sessionStore
    // 세션 스토어 설정
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  const defaultUrl = process.env.NODE_ENV === "production" ? "http://1.234.53.82" : "http://localhost:5000";
  let rawAppUrl = (process.env.APP_URL || defaultUrl).replace(/\/$/, "");
  if (!rawAppUrl.startsWith("http")) {
    rawAppUrl = `http://${rawAppUrl}`;
  }
  const appUrl = rawAppUrl;
  console.log("Auth Callback Base URL:", appUrl);
  const naverClientId = process.env.NAVER_CLIENT_ID?.trim();
  const naverClientSecret = process.env.NAVER_CLIENT_SECRET?.trim();
  if (naverClientId && naverClientSecret) {
    passport.use(
      new NaverStrategy(
        {
          clientID: naverClientId,
          clientSecret: naverClientSecret,
          callbackURL: `${appUrl}/api/auth/naver/callback`
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            console.log("Naver Auth Profile:", JSON.stringify(profile));
            const naverId = profile.id;
            let user = await storage.getUserByUsername(`naver_${naverId}`);
            if (!user) {
              const newUser = {
                username: `naver_${naverId}`,
                password: await hashPassword2(randomBytes2(16).toString("hex")),
                // 임의의 비밀번호
                email: profile.emails?.[0]?.value || "",
                phone: profile._json?.mobile || "",
                role: "user",
                provider: "naver",
                providerId: naverId
              };
              user = await storage.createUser(newUser);
            }
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }
  const kakaoKey = process.env.KAKAO_API_KEY || "2f6ff1b2e516329499e3e785899159e9";
  if (kakaoKey) {
    passport.use(
      new KakaoStrategy(
        {
          clientID: kakaoKey,
          callbackURL: `${appUrl}/api/auth/kakao/callback`
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const kakaoId = profile.id;
            let user = await storage.getUserByUsername(`kakao_${kakaoId}`);
            if (!user) {
              const newUser = {
                username: `kakao_${kakaoId}`,
                password: await hashPassword2(randomBytes2(16).toString("hex")),
                // 임의의 비밀번호
                email: profile._json?.kakao_account?.email || "",
                phone: "",
                role: "user",
                provider: "kakao",
                providerId: kakaoId
              };
              user = await storage.createUser(newUser);
            }
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "\uC774\uBBF8 \uC874\uC7AC\uD558\uB294 \uC544\uC774\uB514\uC785\uB2C8\uB2E4." });
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword2(req.body.password),
        role: req.body.role || "user",
        // 기본적으로 일반 사용자 역할 부여
        birthDate: req.body.birthDate || null,
        birthTime: req.body.birthTime || null,
        isLunar: req.body.isLunar || false
        // Added
      });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "\uC544\uC774\uB514 \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
      req.login(user, (err2) => {
        if (err2) return next(err2);
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  const isAdmin = (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
    }
    next();
  };
  app2.get("/api/admin/users", isAdmin, async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });
  app2.patch("/api/users/profile", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const userId = req.user.id;
      const { currentPassword, password, email, phone, birthDate, birthTime, isLunar } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      const updateData = {};
      if (password) {
        updateData.password = await hashPassword2(password);
      }
      if (email !== void 0) {
        updateData.email = email;
      }
      if (phone !== void 0) {
        updateData.phone = phone;
      }
      if (birthDate !== void 0) {
        updateData.birthDate = birthDate;
      }
      if (birthTime !== void 0) {
        updateData.birthTime = birthTime;
      }
      if (isLunar !== void 0) {
        updateData.isLunar = isLunar;
      }
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(500).json({ message: "\uC0AC\uC6A9\uC790 \uC815\uBCF4 \uC5C5\uB370\uC774\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." });
      }
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  app2.patch("/api/users/password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uC640 \uC0C8 \uBE44\uBC00\uBC88\uD638\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      const isPasswordCorrect = await comparePasswords(currentPassword, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ message: "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
      }
      const hashedPassword = await hashPassword2(newPassword);
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      if (!updatedUser) {
        return res.status(500).json({ message: "\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." });
      }
      res.json({ message: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/admin/users/:id", isAdmin, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790 ID\uC785\uB2C8\uB2E4." });
      }
      if (userId === req.user.id) {
        return res.status(400).json({ message: "\uAD00\uB9AC\uC790\uB294 \uC790\uC2E0\uC758 \uACC4\uC815\uC744 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "\uD574\uB2F9 \uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      res.status(200).json({ message: "\uC0AC\uC6A9\uC790\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/auth/naver", passport.authenticate("naver"));
  app2.get("/api/auth/naver/callback", (req, res, next) => {
    passport.authenticate("naver", (err, user, info) => {
      if (err) {
        console.error("Naver Login Callback Error:", err);
        const errMsg = err.message || JSON.stringify(err);
        return res.redirect(`/auth?error=naver_login_failed&details=${encodeURIComponent(errMsg)}`);
      }
      if (!user) {
        console.error("Naver Login Failed: No User returned");
        return res.redirect("/auth?error=naver_login_failed_no_user");
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Session Login Error:", loginErr);
          return next(loginErr);
        }
        res.redirect("/");
      });
    })(req, res, next);
  });
  app2.get("/api/auth/kakao", passport.authenticate("kakao"));
  app2.get(
    "/api/auth/kakao/callback",
    passport.authenticate("kakao", {
      failureRedirect: "/auth?error=kakao_login_failed"
    }),
    (req, res) => {
      res.redirect("/");
    }
  );
}

// server/news-fetcher.ts
init_storage();
import fetch2 from "node-fetch";

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    server: serverOptions,
    appType: "custom",
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    }
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/news-fetcher.ts
import * as cheerio from "cheerio";
var SEARCH_ENDPOINT = "https://openapi.naver.com/v1/search/news.json";
var REAL_ESTATE_IMAGES = [
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500"
];
var SEARCH_KEYWORDS = [
  "\uAC15\uD654\uAD70 \uBD80\uB3D9\uC0B0",
  "\uAC15\uD654\uB3C4 \uBD80\uB3D9\uC0B0",
  "\uAC15\uD654\uAD70 \uAC1C\uBC1C",
  "\uAC15\uD654\uB3C4 \uC804\uC6D0\uC8FC\uD0DD",
  "\uAC15\uD654\uB3C4 \uD1A0\uC9C0",
  "\uC778\uCC9C \uAC15\uD654 \uAC1C\uBC1C",
  "\uAC15\uD654\uAD70 \uB274\uC2A4",
  "\uAC15\uD654\uAD70 \uC18C\uC2DD",
  "\uAC15\uD654\uB3C4 \uCD95\uC81C",
  "\uAC15\uD654\uAD70 \uAD50\uD1B5",
  "\uAC15\uD654\uAD70\uCCAD",
  "\uAC15\uD654\uB3C4 \uAD00\uAD11"
];
async function fetchNaverNews(keyword) {
  try {
    const response = await fetch2(`${SEARCH_ENDPOINT}?query=${encodeURIComponent(keyword)}&display=5&sort=date`, {
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID || "",
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET || ""
      }
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    log(`\uB124\uC774\uBC84 \uB274\uC2A4 API \uD638\uCD9C \uC624\uB958: ${error}`, "error");
    return [];
  }
}
function stripHtmlTags(html) {
  let text = html.replace(/<\/?[^>]+(>|$)/g, "");
  const entities = {
    "&quot;": '"',
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
    "&#039;": "'",
    "&#39;": "'",
    "&ldquo;": '"',
    "&rdquo;": '"',
    "&hellip;": "...",
    "&middot;": "\xB7"
  };
  Object.entries(entities).forEach(([entity, replacement]) => {
    text = text.replace(new RegExp(entity, "g"), replacement);
  });
  return text;
}
async function isNewsAlreadyExists(title) {
  const news = await storage.getNewsByTitle(title);
  return !!news;
}
var globalProcessedTitles = /* @__PURE__ */ new Set();
var globalProcessedLinks = /* @__PURE__ */ new Set();
var globalSimilaritySet = /* @__PURE__ */ new Map();
async function isSimilarNewsExists(title) {
  const normalizedTitle = title.toLowerCase().replace(/[^\w\s가-힣]/g, "");
  if (globalProcessedTitles.has(normalizedTitle)) {
    return true;
  }
  const words = normalizedTitle.split(/\s+/).filter((word) => word.length >= 3);
  const entries = Array.from(globalSimilaritySet.entries());
  for (let i = 0; i < entries.length; i++) {
    const [keyword, titles] = entries[i];
    if (normalizedTitle.includes(keyword) || words.some((word) => keyword.includes(word))) {
      return true;
    }
  }
  globalProcessedTitles.add(normalizedTitle);
  return false;
}
function hasTooManyRepeatedWords(title) {
  const cleanedTitle = title.replace(/[^a-zA-Z0-9가-힣\s]/g, "").toLowerCase();
  const words = cleanedTitle.split(/\s+/).filter((word) => word.length > 1);
  const wordCount = {};
  for (const word of words) {
    wordCount[word] = (wordCount[word] || 0) + 1;
  }
  for (const word in wordCount) {
    if (wordCount[word] >= 3) {
      return true;
    }
  }
  return false;
}
async function extractImageFromNews(url) {
  try {
    const response = await fetch2(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    let imageUrl = null;
    const naverNewsImage = $("#articleBodyContents img, #newsEndContents img, .end_photo_org img").first();
    if (naverNewsImage.length) {
      imageUrl = naverNewsImage.attr("src") || null;
    }
    if (!imageUrl) {
      const metaImage = $('meta[property="og:image"]').attr("content");
      if (metaImage) {
        imageUrl = metaImage;
      }
    }
    if (!imageUrl) {
      const firstImage = $("article img, .article img, .news_body img").first();
      if (firstImage.length) {
        imageUrl = firstImage.attr("src") || null;
      }
    }
    if (imageUrl && !imageUrl.startsWith("http")) {
      if (imageUrl.startsWith("//")) {
        imageUrl = "https:" + imageUrl;
      } else {
        const baseUrl = new URL(url);
        imageUrl = `${baseUrl.protocol}//${baseUrl.host}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
      }
    }
    return imageUrl;
  } catch (error) {
    return null;
  }
}
async function saveNewsToDatabase(newsItems) {
  let savedCount = 0;
  const sessionProcessedTitles = /* @__PURE__ */ new Set();
  const sessionProcessedLinks = /* @__PURE__ */ new Set();
  const shuffledItems = [...newsItems].sort(() => Math.random() - 0.5);
  for (const item of shuffledItems) {
    try {
      const cleanTitle = stripHtmlTags(item.title);
      const cleanDesc = stripHtmlTags(item.description);
      const sourceLink = item.originallink || item.link;
      const normalizedLink = sourceLink.replace(/\/$/, "");
      if (sessionProcessedTitles.has(cleanTitle)) continue;
      if (sessionProcessedLinks.has(normalizedLink)) continue;
      if (globalProcessedLinks.has(normalizedLink)) continue;
      sessionProcessedTitles.add(cleanTitle);
      sessionProcessedLinks.add(normalizedLink);
      globalProcessedLinks.add(normalizedLink);
      const exists = await isNewsAlreadyExists(cleanTitle);
      if (exists) continue;
      const similarExists = await isSimilarNewsExists(cleanTitle);
      if (similarExists) continue;
      if (hasTooManyRepeatedWords(cleanTitle)) continue;
      let imageUrl = await extractImageFromNews(item.link);
      if (!imageUrl) {
        const randomImageIndex = Math.floor(Math.random() * REAL_ESTATE_IMAGES.length);
        imageUrl = REAL_ESTATE_IMAGES[randomImageIndex];
      }
      try {
        await storage.createNews({
          title: cleanTitle,
          summary: cleanDesc,
          description: cleanDesc,
          content: `${cleanDesc}

\uC6D0\uBCF8 \uAE30\uC0AC: ${item.link}`,
          source: new URL(sourceLink).hostname,
          sourceUrl: sourceLink,
          url: item.link,
          imageUrl,
          category: "\uC778\uCC9C \uBD80\uB3D9\uC0B0",
          isPinned: false
        });
        log(`\uC0C8\uB85C\uC6B4 \uB274\uC2A4 \uC800\uC7A5\uB428: ${cleanTitle}`, "info");
        savedCount++;
        if (savedCount >= 3) break;
      } catch (dbError) {
        log(`\uB274\uC2A4 DB \uC800\uC7A5 \uC624\uB958 (${cleanTitle}): ${dbError}`, "error");
        continue;
      }
    } catch (error) {
      log(`\uB274\uC2A4 \uCC98\uB9AC \uC624\uB958: ${error}`, "error");
    }
  }
  return savedCount;
}
async function filterExistingNewsByRepeatedWords() {
  try {
    const allNews = await storage.getNews();
    let removedCount = 0;
    for (const newsItem of allNews) {
      if (hasTooManyRepeatedWords(newsItem.title)) {
        await storage.deleteNews(newsItem.id);
        removedCount++;
      }
    }
    if (removedCount > 0) {
      log(`\uCD1D ${removedCount}\uAC1C\uC758 \uC911\uBCF5 \uB2E8\uC5B4\uAC00 \uB9CE\uC740 \uB274\uC2A4\uB97C \uC0AD\uC81C\uD588\uC2B5\uB2C8\uB2E4.`, "info");
    }
  } catch (error) {
    console.error("\uAE30\uC874 \uB274\uC2A4 \uD544\uD130\uB9C1 \uC911 \uC624\uB958:", error);
  }
}
async function fetchAndSaveNews() {
  log(`\uB274\uC2A4 \uC218\uC9D1 \uC2DC\uC791: ${(/* @__PURE__ */ new Date()).toLocaleString()}`, "info");
  await filterExistingNewsByRepeatedWords();
  if (!process.env.NAVER_CLIENT_ID) {
    log("\uB124\uC774\uBC84 API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC544 \uB274\uC2A4 \uC218\uC9D1\uC744 \uAC74\uB108\uB701\uB2C8\uB2E4.", "info");
    return [];
  }
  let allNewsItems = [];
  for (const keyword of SEARCH_KEYWORDS) {
    const newsItems = await fetchNaverNews(keyword);
    allNewsItems = [...allNewsItems, ...newsItems];
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const titleSet = /* @__PURE__ */ new Set();
  const uniqueNewsItems = [];
  for (const item of allNewsItems) {
    const t = stripHtmlTags(item.title);
    if (!titleSet.has(t)) {
      titleSet.add(t);
      uniqueNewsItems.push(item);
    }
  }
  const savedCount = await saveNewsToDatabase(uniqueNewsItems);
  log(`\uB274\uC2A4 \uC218\uC9D1 \uC644\uB8CC: ${savedCount}\uAC1C \uC800\uC7A5\uB428`, "info");
  return uniqueNewsItems.slice(0, 3);
}
function setupNewsScheduler() {
  log(`[info] \uB274\uC2A4 \uC790\uB3D9 \uC5C5\uB370\uC774\uD2B8 \uC2A4\uCF00\uC904\uB7EC \uCD08\uAE30\uD654`, "info");
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    log("[warn] \uB124\uC774\uBC84 API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC544 \uB274\uC2A4 \uC790\uB3D9 \uC218\uC9D1\uC774 \uBE44\uD65C\uC131\uD654\uB429\uB2C8\uB2E4.", "warn");
    return;
  }
  fetchAndSaveNews().catch((err) => log(`\uCD08\uAE30 \uB274\uC2A4 \uC218\uC9D1 \uC2E4\uD328: ${err}`, "error"));
  const CHECK_INTERVAL = 60 * 1e3;
  let lastRunIdentifier = "";
  setInterval(() => {
    const now = /* @__PURE__ */ new Date();
    const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1e3;
    const kstOffset = 9 * 60 * 60 * 1e3;
    const kstDate = new Date(utcNow + kstOffset);
    const currentHour = kstDate.getHours();
    const currentMinute = kstDate.getMinutes();
    if (currentHour % 3 === 0 && currentMinute < 20) {
      const currentIdentifier = `${kstDate.getFullYear()}-${kstDate.getMonth()}-${kstDate.getDate()}-${currentHour}`;
      if (lastRunIdentifier !== currentIdentifier) {
        log(`[scheduler] \uC815\uAE30 \uB274\uC2A4 \uC218\uC9D1 \uC2DC\uC791 (KST ${currentHour}\uC2DC - 3\uC2DC\uAC04 \uAC04\uACA9)`, "info");
        lastRunIdentifier = currentIdentifier;
        fetchAndSaveNews().catch((err) => log(`\uC815\uAE30 \uB274\uC2A4 \uC218\uC9D1 \uC2E4\uD328: ${err}`, "error"));
      }
    }
  }, CHECK_INTERVAL);
  log(`[info] \uB274\uC2A4 \uC2A4\uCF00\uC904\uB7EC \uC124\uC815 \uC644\uB8CC (\uB9E4 3\uC2DC\uAC04\uB9C8\uB2E4 \uC2E4\uD589)`, "info");
}

// server/mailer.ts
import nodemailer from "nodemailer";
var transporter = nodemailer.createTransport({
  host: "smtp.naver.com",
  port: 465,
  // 포트 465로 변경 (SSL/TLS 사용)
  secure: true,
  // true는 포트 465를 사용할 때, false는 다른 포트에서 사용
  auth: {
    user: process.env.NAVER_EMAIL,
    pass: process.env.NAVER_APP_PASSWORD
    // 애플리케이션 비밀번호 사용
  },
  debug: true,
  // 디버깅 모드 활성화
  logger: true
  // 로깅 활성화
});
console.log("SMTP \uC124\uC815 \uC815\uBCF4:", {
  host: "smtp.naver.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NAVER_EMAIL ? "\uC124\uC815\uB428" : "\uBBF8\uC124\uC815",
    pass: process.env.NAVER_APP_PASSWORD ? "\uC124\uC815\uB428" : "\uBBF8\uC124\uC815"
  }
});
async function sendEmail(to, subject, htmlContent) {
  try {
    console.log("\uC774\uBA54\uC77C \uC804\uC1A1 \uC2DC\uB3C4...");
    if (!process.env.NAVER_EMAIL || !process.env.NAVER_APP_PASSWORD) {
      console.error("\uB124\uC774\uBC84 \uBA54\uC77C \uC778\uC99D \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return false;
    }
    if (!to || to.trim() === "") {
      console.error("\uC218\uC2E0\uC790 \uC774\uBA54\uC77C \uC8FC\uC18C\uAC00 \uBE44\uC5B4\uC788\uC2B5\uB2C8\uB2E4.");
      return false;
    }
    console.log(`\uBC1C\uC2E0\uC790: ${process.env.NAVER_EMAIL}`);
    console.log(`\uC218\uC2E0\uC790: ${to}`);
    console.log(`\uC81C\uBAA9: ${subject}`);
    const rawEmail = process.env.NAVER_EMAIL || "";
    const naverEmail = rawEmail.includes("@") ? rawEmail : `${rawEmail}@naver.com`;
    console.log("\uBCF4\uC815\uB41C \uBC1C\uC2E0\uC790 \uC774\uBA54\uC77C:", naverEmail);
    const mailOptions = {
      from: naverEmail,
      // 단순 이메일 주소만 사용
      to: to.trim(),
      subject,
      html: htmlContent
    };
    console.log("SMTP \uC11C\uBC84\uB85C \uC804\uC1A1 \uC911...");
    const info = await transporter.sendMail(mailOptions);
    console.log("\uC774\uBA54\uC77C \uC804\uC1A1 \uC131\uACF5:", info);
    return true;
  } catch (error) {
    console.error("\uC774\uBA54\uC77C \uC804\uC1A1 \uC2E4\uD328 - \uC0C1\uC138 \uC624\uB958:", error);
    if (error instanceof Error) {
      console.error("\uC624\uB958 \uBA54\uC2DC\uC9C0:", error.message);
      console.error("\uC624\uB958 \uC2A4\uD0DD:", error.stack);
    }
    return false;
  }
}
function createInquiryEmailTemplate(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
      <h2 style="color: #3b82f6; margin-bottom: 20px;">\uC0C8\uB85C\uC6B4 \uBB38\uC758\uAC00 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4</h2>
      
      <div style="margin-bottom: 15px;">
        <strong>\uC774\uB984:</strong> ${data.name}
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>\uC774\uBA54\uC77C:</strong> ${data.email}
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>\uC804\uD654\uBC88\uD638:</strong> ${data.phone}
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>\uBB38\uC758\uB0B4\uC6A9:</strong>
        <p style="background-color: #f9f9f9; padding: 10px; border-radius: 4px;">${data.message.replace(/\n/g, "<br>")}</p>
      </div>
      
      <div style="font-size: 12px; color: #666; margin-top: 30px; padding-top: 10px; border-top: 1px solid #e1e1e1;">
        <p>\uC774 \uC774\uBA54\uC77C\uC740 \uC774\uAC00\uC774\uBC84\uBD80\uB3D9\uC0B0 \uC6F9\uC0AC\uC774\uD2B8\uC758 \uBB38\uC758 \uD3FC\uC5D0\uC11C \uC790\uB3D9\uC73C\uB85C \uC804\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4.</p>
      </div>
    </div>
  `;
}

// server/real-estate-api.ts
import fetch3 from "node-fetch";
import { XMLParser } from "fast-xml-parser";
var DEBUG_API_CALLS = true;
async function getApartmentTransactions(params) {
  const baseUrl = "http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTradeDev";
  const serviceKey = process.env.DATA_GO_KR_API_KEY;
  if (!serviceKey) {
    throw new Error("DATA_GO_KR_API_KEY \uD658\uACBD\uBCC0\uC218\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
  }
  const cacheKey = `apartment-transactions-${params.LAWD_CD}-${params.DEAL_YMD}`;
  const cachedData = memoryCache.get(cacheKey);
  if (cachedData) {
    console.log(`\uCE90\uC2DC\uB41C \uC544\uD30C\uD2B8 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uBC18\uD658: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    return cachedData;
  }
  const url = `${baseUrl}?serviceKey=${serviceKey}&LAWD_CD=${params.LAWD_CD}&DEAL_YMD=${params.DEAL_YMD}`;
  try {
    console.log(`\uC544\uD30C\uD2B8 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC694\uCCAD: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    console.log("\uC694\uCCAD URL:", url);
    const response = await fetch3(url, {
      method: "GET",
      headers: {
        "Accept": "application/xml",
        "Content-Type": "application/xml",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
      console.error(`HTTP \uC624\uB958: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP \uC624\uB958: ${response.status}`);
    }
    const xmlData = await response.text();
    if (DEBUG_API_CALLS) {
      console.log("API \uC751\uB2F5 \uC804\uCCB4:", xmlData);
    } else {
      console.log("API \uC751\uB2F5 \uC77C\uBD80:", xmlData.substring(0, 300));
    }
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text"
    });
    const result = parser.parse(xmlData);
    console.log("\uD30C\uC2F1\uB41C \uACB0\uACFC \uAD6C\uC870:", JSON.stringify(result).substring(0, 300));
    if (!result.response) {
      console.error("API \uC751\uB2F5 \uD615\uC2DD \uC624\uB958: response \uAC1D\uCCB4 \uC5C6\uC74C");
      return [];
    }
    const resultCode = result.response.header?.resultCode;
    if (resultCode && resultCode !== "00") {
      const errorMsg = result.response.header?.resultMsg || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958";
      console.error(`API \uC624\uB958: ${errorMsg}`);
      return [];
    }
    if (!result.response.body?.items?.item) {
      console.log("API \uC751\uB2F5: \uB370\uC774\uD130 \uC5C6\uC74C");
      return [];
    }
    let items = [];
    if (Array.isArray(result.response.body.items.item)) {
      items = result.response.body.items.item;
    } else {
      items = [result.response.body.items.item];
    }
    const transactions = items.map((item) => {
      const legalDong = item.\uBC95\uC815\uB3D9 || "";
      const jibun = item.\uC9C0\uBC88 || "";
      const address = `\uC778\uCC9C \uAC15\uD654\uAD70 ${legalDong} ${jibun}`;
      let dealAmount = item.\uAC70\uB798\uAE08\uC561 || "";
      if (typeof dealAmount === "string") {
        dealAmount = dealAmount.trim().replace(/,/g, "");
      }
      return {
        \uAC70\uB798\uAE08\uC561: dealAmount,
        \uAC74\uCD95\uB144\uB3C4: item.\uAC74\uCD95\uB144\uB3C4,
        \uB144: item.\uB144,
        \uC6D4: item.\uC6D4,
        \uC77C: item.\uC77C,
        \uC544\uD30C\uD2B8: item.\uC544\uD30C\uD2B8,
        \uC804\uC6A9\uBA74\uC801: item.\uC804\uC6A9\uBA74\uC801,
        \uBC95\uC815\uB3D9: legalDong,
        \uC9C0\uBC88: jibun,
        \uC9C0\uC5ED\uCF54\uB4DC: item.\uC9C0\uC5ED\uCF54\uB4DC,
        \uCE35: item.\uCE35,
        type: "\uC544\uD30C\uD2B8",
        address
      };
    });
    memoryCache.set(cacheKey, transactions, 2 * 60 * 60 * 1e3);
    console.log(`${transactions.length}\uAC1C\uC758 \uC544\uD30C\uD2B8 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC644\uB8CC`);
    return transactions;
  } catch (error) {
    console.error("\uC544\uD30C\uD2B8 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC624\uB958:", error);
    return [];
  }
}
async function getHouseTransactions(params) {
  const baseUrl = "http://openapi.molit.go.kr:8081/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcSHTrade";
  const serviceKey = process.env.DATA_GO_KR_API_KEY;
  if (!serviceKey) {
    throw new Error("DATA_GO_KR_API_KEY \uD658\uACBD\uBCC0\uC218\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
  }
  const cacheKey = `house-transactions-${params.LAWD_CD}-${params.DEAL_YMD}`;
  const cachedData = memoryCache.get(cacheKey);
  if (cachedData) {
    console.log(`\uCE90\uC2DC\uB41C \uB2E8\uB3C5\uB2E4\uAC00\uAD6C \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uBC18\uD658: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    return cachedData;
  }
  const url = `${baseUrl}?serviceKey=${serviceKey}&LAWD_CD=${params.LAWD_CD}&DEAL_YMD=${params.DEAL_YMD}`;
  try {
    console.log(`\uB2E8\uB3C5\uB2E4\uAC00\uAD6C \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC694\uCCAD: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    console.log("\uC694\uCCAD URL:", url);
    const response = await fetch3(url, {
      method: "GET",
      headers: {
        "Accept": "application/xml",
        "Content-Type": "application/xml",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
      console.error(`HTTP \uC624\uB958: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP \uC624\uB958: ${response.status}`);
    }
    const xmlData = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text"
    });
    const result = parser.parse(xmlData);
    if (!result.response) {
      console.error("API \uC751\uB2F5 \uD615\uC2DD \uC624\uB958: response \uAC1D\uCCB4 \uC5C6\uC74C");
      return [];
    }
    const resultCode = result.response.header?.resultCode;
    if (resultCode && resultCode !== "00") {
      const errorMsg = result.response.header?.resultMsg || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958";
      console.error(`API \uC624\uB958: ${errorMsg}`);
      return [];
    }
    if (!result.response.body?.items?.item) {
      console.log("API \uC751\uB2F5: \uB370\uC774\uD130 \uC5C6\uC74C");
      return [];
    }
    let items = [];
    if (Array.isArray(result.response.body.items.item)) {
      items = result.response.body.items.item;
    } else {
      items = [result.response.body.items.item];
    }
    const transactions = items.map((item) => {
      const legalDong = item.\uBC95\uC815\uB3D9 || "";
      const jibun = item.\uC9C0\uBC88 || "";
      const address = `\uC778\uCC9C \uAC15\uD654\uAD70 ${legalDong} ${jibun}`;
      let dealAmount = item.\uAC70\uB798\uAE08\uC561 || "";
      if (typeof dealAmount === "string") {
        dealAmount = dealAmount.trim().replace(/,/g, "");
      }
      return {
        \uAC70\uB798\uAE08\uC561: dealAmount,
        \uAC74\uCD95\uB144\uB3C4: item.\uAC74\uCD95\uB144\uB3C4,
        \uB144: item.\uB144,
        \uC6D4: item.\uC6D4,
        \uC77C: item.\uC77C,
        \uC8FC\uD0DD\uC720\uD615: item.\uC8FC\uD0DD\uC720\uD615,
        \uC804\uC6A9\uBA74\uC801: item.\uC5F0\uBA74\uC801,
        // 단독주택은 연면적을 사용함
        \uBC95\uC815\uB3D9: legalDong,
        \uC9C0\uBC88: jibun,
        type: "\uB2E8\uB3C5\uB2E4\uAC00\uAD6C",
        address
      };
    });
    memoryCache.set(cacheKey, transactions, 2 * 60 * 60 * 1e3);
    console.log(`${transactions.length}\uAC1C\uC758 \uB2E8\uB3C5\uB2E4\uAC00\uAD6C \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC644\uB8CC`);
    return transactions;
  } catch (error) {
    console.error("\uB2E8\uB3C5\uB2E4\uAC00\uAD6C \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC624\uB958:", error);
    return [];
  }
}
async function getLandTransactions(params) {
  const baseUrl = "http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcLandTrade";
  const serviceKey = process.env.DATA_GO_KR_API_KEY;
  if (!serviceKey) {
    throw new Error("DATA_GO_KR_API_KEY \uD658\uACBD\uBCC0\uC218\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
  }
  const cacheKey = `land-transactions-${params.LAWD_CD}-${params.DEAL_YMD}`;
  const cachedData = memoryCache.get(cacheKey);
  if (cachedData) {
    console.log(`\uCE90\uC2DC\uB41C \uD1A0\uC9C0 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uBC18\uD658: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    return cachedData;
  }
  const url = `${baseUrl}?serviceKey=${serviceKey}&LAWD_CD=${params.LAWD_CD}&DEAL_YMD=${params.DEAL_YMD}`;
  try {
    console.log(`\uD1A0\uC9C0 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC694\uCCAD: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    console.log("\uC694\uCCAD URL:", url);
    const response = await fetch3(url, {
      method: "GET",
      headers: {
        "Accept": "application/xml",
        "Content-Type": "application/xml",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
      console.error(`HTTP \uC624\uB958: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP \uC624\uB958: ${response.status}`);
    }
    const xmlData = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text"
    });
    const result = parser.parse(xmlData);
    if (!result.response) {
      console.error("API \uC751\uB2F5 \uD615\uC2DD \uC624\uB958: response \uAC1D\uCCB4 \uC5C6\uC74C");
      return [];
    }
    const resultCode = result.response.header?.resultCode;
    if (resultCode && resultCode !== "00") {
      const errorMsg = result.response.header?.resultMsg || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958";
      console.error(`API \uC624\uB958: ${errorMsg}`);
      return [];
    }
    if (!result.response.body?.items?.item) {
      console.log("API \uC751\uB2F5: \uB370\uC774\uD130 \uC5C6\uC74C");
      return [];
    }
    let items = [];
    if (Array.isArray(result.response.body.items.item)) {
      items = result.response.body.items.item;
    } else {
      items = [result.response.body.items.item];
    }
    const transactions = items.map((item) => {
      const legalDong = item.\uBC95\uC815\uB3D9 || "";
      const jibun = item.\uC9C0\uBC88 || "";
      const address = `\uC778\uCC9C \uAC15\uD654\uAD70 ${legalDong} ${jibun}`;
      let dealAmount = item.\uAC70\uB798\uAE08\uC561 || "";
      if (typeof dealAmount === "string") {
        dealAmount = dealAmount.trim().replace(/,/g, "");
      }
      return {
        \uAC70\uB798\uAE08\uC561: dealAmount,
        \uB144: item.\uB144,
        \uC6D4: item.\uC6D4,
        \uC77C: item.\uC77C,
        \uD1A0\uC9C0\uAC70\uB798\uAD6C\uBD84: item.\uD1A0\uC9C0\uAC70\uB798\uAD6C\uBD84,
        \uBC95\uC815\uB3D9: legalDong,
        \uC9C0\uBC88: jibun,
        type: "\uD1A0\uC9C0",
        address
      };
    });
    memoryCache.set(cacheKey, transactions, 2 * 60 * 60 * 1e3);
    console.log(`${transactions.length}\uAC1C\uC758 \uD1A0\uC9C0 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC644\uB8CC`);
    return transactions;
  } catch (error) {
    console.error("\uD1A0\uC9C0 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC624\uB958:", error);
    return [];
  }
}
async function getRecentTransactions(regionCode = "28710") {
  try {
    console.log(`\uC2E4\uAC70\uB798\uAC00 \uB370\uC774\uD130 \uC694\uCCAD: \uC9C0\uC5ED\uCF54\uB4DC=${regionCode}`);
    const today = /* @__PURE__ */ new Date();
    const months = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      months.push(`${year}${month}`);
    }
    console.log(`\uCD5C\uADFC 3\uAC1C\uC6D4 \uB370\uC774\uD130 \uC870\uD68C: ${months.join(", ")}`);
    const allTransactionsPromises = months.flatMap((month) => [
      getApartmentTransactions({ LAWD_CD: regionCode, DEAL_YMD: month }),
      getHouseTransactions({ LAWD_CD: regionCode, DEAL_YMD: month }),
      getLandTransactions({ LAWD_CD: regionCode, DEAL_YMD: month })
    ]);
    const allTransactions = await Promise.all(allTransactionsPromises);
    const transactions = allTransactions.flat();
    console.log(`\uCD1D ${transactions.length}\uAC1C\uC758 \uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC644\uB8CC`);
    return transactions;
  } catch (error) {
    console.error("\uC2E4\uAC70\uB798 \uB370\uC774\uD130 \uC870\uD68C \uC624\uB958:", error);
    return [];
  }
}

// server/test-api.ts
import fetch4 from "node-fetch";
async function testRealEstateAPI() {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    console.error("DATA_GO_KR_API_KEY \uD658\uACBD\uBCC0\uC218\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    return;
  }
  console.log("\uC0C8\uB85C\uC6B4 API \uD0A4:", apiKey.substring(0, 10) + "...");
  const tests = [
    {
      name: "\uD1A0\uC9C0 \uC2E4\uAC70\uB798\uAC00 API (\uC0C8\uB85C\uC6B4 \uC2A4\uD0C0\uC77C)",
      url: `https://api.odcloud.kr/api/RltmTradeInfoLandService/v1/getMTransaction?serviceKey=${apiKey}&page=1&perPage=10&LAWD_CD=28710&DEAL_YMD=202311`
    },
    {
      name: "\uC544\uD30C\uD2B8 \uC2E4\uAC70\uB798\uAC00 API (\uC0C8\uB85C\uC6B4 \uC2A4\uD0C0\uC77C)",
      url: `https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail?serviceKey=${apiKey}&page=1&perPage=10`
    },
    {
      name: "\uB2E8\uB3C5/\uB2E4\uAC00\uAD6C \uC2E4\uAC70\uB798\uAC00 API (\uAD6C \uC2A4\uD0C0\uC77C)",
      url: `http://openapi.molit.go.kr:8081/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcSHTrade?serviceKey=${apiKey}&LAWD_CD=28710&DEAL_YMD=202311`
    },
    {
      name: "\uD1A0\uC9C0 \uC2E4\uAC70\uB798\uAC00 API + \uC778\uCF54\uB529 \uD0A4 (\uC2E0 \uC2A4\uD0C0\uC77C)",
      url: `https://apis.data.go.kr/1613000/RTMSDataSvcLandTrade/getLandTrade?serviceKey=${apiKey}&LAWD_CD=28710&DEAL_YMD=202503&numOfRows=10&pageNo=1`
    },
    {
      name: "\uC544\uD30C\uD2B8 \uC2E4\uAC70\uB798\uAC00 API + \uC778\uCF54\uB529 \uD0A4 (\uC2E0 \uC2A4\uD0C0\uC77C)",
      url: `https://apis.data.go.kr/1613000/AptTradeSvc/getAptTrade?serviceKey=${apiKey}&LAWD_CD=28710&DEAL_YMD=202503&numOfRows=10&pageNo=1`
    },
    {
      name: "\uB0A0\uC528 API \uD14C\uC2A4\uD2B8",
      url: `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${apiKey}&numOfRows=10&pageNo=1&base_date=20240514&base_time=0600&nx=55&ny=127`
    }
  ];
  for (const test of tests) {
    console.log(`

\uD14C\uC2A4\uD2B8: ${test.name}`);
    console.log(`URL: ${test.url}`);
    try {
      const response = await fetch4(test.url, {
        method: "GET",
        headers: {
          "Accept": "application/xml",
          "Content-Type": "application/xml",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        }
      });
      console.log(`\uC0C1\uD0DC \uCF54\uB4DC: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`\uC751\uB2F5 \uC77C\uBD80: ${text.substring(0, 300)}...`);
      if (text.includes("<OpenAPI_ServiceResponse>")) {
        console.log("\u2705 API \uC751\uB2F5 \uD615\uC2DD \uD655\uC778\uB428: OpenAPI_ServiceResponse \uD3EC\uD568");
      } else if (text.includes("<response>")) {
        console.log("\u2705 API \uC751\uB2F5 \uD615\uC2DD \uD655\uC778\uB428: response \uD3EC\uD568");
      } else if (!text.includes("<?xml")) {
        console.log("\u274C XML \uD615\uC2DD\uC774 \uC544\uB2D8");
      } else {
        console.log("\u2753 \uC54C \uC218 \uC5C6\uB294 \uC751\uB2F5 \uD615\uC2DD");
      }
      if (text.includes("SERVICE ERROR") || text.includes("SERVICE_KEY_IS_NOT_REGISTERED")) {
        console.log("\u274C \uC11C\uBE44\uC2A4 \uD0A4 \uC624\uB958 \uD3EC\uD568\uB428");
      } else if (text.includes("LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS")) {
        console.log("\u274C \uC694\uCCAD \uD69F\uC218 \uCD08\uACFC\uB428");
      } else if (text.includes("NO_MANDATORY_REQUEST_PARAMETERS_ERROR")) {
        console.log("\u274C \uD544\uC218 \uD30C\uB77C\uBBF8\uD130 \uB204\uB77D\uB428");
      } else if (text.includes("INVALID_REQUEST_PARAMETER_ERROR")) {
        console.log("\u274C \uC798\uBABB\uB41C \uD30C\uB77C\uBBF8\uD130 \uAC12");
      }
    } catch (error) {
      console.error(`\u274C \uC624\uB958 \uBC1C\uC0DD: ${error}`);
    }
  }
}

// server/routes.ts
init_blog_fetcher();

// server/youtube-fetcher.ts
import fetch6 from "node-fetch";
async function getChannelIdByHandle(handle) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YouTube API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    }
    const cleanHandle = handle.startsWith("@") ? handle.substring(1) : handle;
    console.log(`YouTube \uD578\uB4E4\uB85C \uCC44\uB110 ID \uC870\uD68C: @${cleanHandle}`);
    const response = await fetch6(
      `https://www.googleapis.com/youtube/v3/channels?part=id,contentDetails&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`
    );
    if (!response.ok) {
      throw new Error(`\uCC44\uB110 \uC870\uD68C \uC2E4\uD328: ${response.status}`);
    }
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      console.log(`\uCC44\uB110 ID \uCC3E\uC74C: ${data.items[0].id}`);
      return data.items[0].id;
    }
    return null;
  } catch (error) {
    console.error("\uCC44\uB110 ID \uC870\uD68C \uC624\uB958:", error);
    return null;
  }
}
function extractChannelId(channelUrl) {
  const match = channelUrl.match(/channel\/([^/?]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return "UCCG3_JlKhgalqhict7tKkbA";
}
async function fetchYouTubeShorts(channelId, limit = 10) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YouTube API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    }
    console.log(`YouTube \uC1FC\uCE20 \uAC80\uC0C9: \uCC44\uB110 ${channelId}`);
    const searchResponse = await fetch6(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&videoDuration=short&maxResults=${limit}&order=date&key=${apiKey}`
    );
    if (!searchResponse.ok) {
      throw new Error(`\uC1FC\uCE20 \uAC80\uC0C9 \uC2E4\uD328: ${searchResponse.status}`);
    }
    const searchData = await searchResponse.json();
    if (!searchData.items || searchData.items.length === 0) {
      console.log("\uC1FC\uCE20\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return [];
    }
    console.log(`${searchData.items.length}\uAC1C\uC758 \uC1FC\uCE20\uB97C \uCC3E\uC558\uC2B5\uB2C8\uB2E4.`);
    const shorts = searchData.items.map((item) => {
      const thumbnailUrl = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`;
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: thumbnailUrl,
        url: `https://www.youtube.com/shorts/${item.id.videoId}`,
        publishedAt: item.snippet.publishedAt
      };
    });
    return shorts;
  } catch (error) {
    console.error("YouTube \uC1FC\uCE20 \uAC80\uC0C9 \uC624\uB958:", error);
    return [];
  }
}
async function fetchLatestYouTubeVideosWithAPI(channelId, limit = 5) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YouTube API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4");
    }
    console.log(`YouTube API\uB97C \uC0AC\uC6A9\uD558\uC5EC \uCC44\uB110 \uC815\uBCF4 \uC694\uCCAD: ${channelId}`);
    const channelResponse = await fetch6(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    );
    if (!channelResponse.ok) {
      throw new Error(`\uCC44\uB110 \uC815\uBCF4 \uC694\uCCAD \uC2E4\uD328: ${channelResponse.status} ${channelResponse.statusText}`);
    }
    const channelData = await channelResponse.json();
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error("\uCC44\uB110 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4");
    }
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
    console.log(`\uCC44\uB110 \uC5C5\uB85C\uB4DC \uC7AC\uC0DD\uBAA9\uB85D ID: ${uploadsPlaylistId}`);
    const playlistResponse = await fetch6(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${limit}&playlistId=${uploadsPlaylistId}&key=${apiKey}`
    );
    if (!playlistResponse.ok) {
      throw new Error(`\uC7AC\uC0DD\uBAA9\uB85D \uC694\uCCAD \uC2E4\uD328: ${playlistResponse.status} ${playlistResponse.statusText}`);
    }
    const playlistData = await playlistResponse.json();
    if (!playlistData.items) {
      console.log("\uC7AC\uC0DD\uBAA9\uB85D\uC5D0\uC11C \uC601\uC0C1\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return [];
    }
    console.log(`\uC7AC\uC0DD\uBAA9\uB85D\uC5D0\uC11C ${playlistData.items.length}\uAC1C\uC758 \uC601\uC0C1 \uC815\uBCF4\uB97C \uAC00\uC838\uC654\uC2B5\uB2C8\uB2E4.`);
    const videos = playlistData.items.map((item) => {
      const thumbnailUrl = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || `https://i.ytimg.com/vi/${item.snippet.resourceId.videoId}/hqdefault.jpg`;
      return {
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnail: thumbnailUrl,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        publishedAt: item.snippet.publishedAt
      };
    });
    console.log("YouTube API\uC5D0\uC11C \uC601\uC0C1 \uC815\uBCF4 \uAC00\uC838\uC624\uAE30 \uC131\uACF5");
    return videos;
  } catch (error) {
    console.error("YouTube API \uC694\uCCAD \uC624\uB958:", error);
    throw error;
  }
}
async function fetchLatestYouTubeVideos(channelUrl, limit = 5) {
  try {
    console.log(`\uC720\uD29C\uBE0C \uCC44\uB110 \uC815\uBCF4 \uC694\uCCAD: ${channelUrl}`);
    const channelId = extractChannelId(channelUrl);
    console.log(`\uCD94\uCD9C\uB41C \uCC44\uB110 ID: ${channelId}`);
    try {
      return await fetchLatestYouTubeVideosWithAPI(channelId, limit);
    } catch (apiError) {
      console.error("YouTube API \uC694\uCCAD \uC2E4\uD328, \uB300\uCCB4 \uB370\uC774\uD130 \uC0AC\uC6A9:", apiError);
      if (channelId === "UCCG3_JlKhgalqhict7tKkbA") {
        console.log("\uC774\uAC00\uC774\uBC84 \uC720\uD29C\uBE0C \uCC44\uB110\uC758 \uB300\uCCB4 \uB370\uC774\uD130\uB97C \uC0AC\uC6A9\uD569\uB2C8\uB2E4.");
        const videos2 = [
          {
            id: "Kh-CoR26mAk",
            title: "\uBB34\uC5C7\uC744 \uBCF4\uACE0 \uB9E4\uC785\uD55C \uB545\uC778\uB370..\uC774\uB807\uAC8C...",
            thumbnail: "https://i.ytimg.com/vi/Kh-CoR26mAk/hqdefault.jpg",
            url: "https://www.youtube.com/watch?v=Kh-CoR26mAk"
          },
          {
            id: "lIMCvP9De8w",
            title: "\uAC15\uD654\uB3C4 \uB9C8\uB2C8\uC0B0 \uC544\uB798 \uD790\uB9C1 \uD560\uC218 \uC788\uB294 \uC804\uB9DD\uC88B\uC740\uC9D1",
            thumbnail: "https://i.ytimg.com/vi/lIMCvP9De8w/hqdefault.jpg",
            url: "https://www.youtube.com/watch?v=lIMCvP9De8w"
          },
          {
            id: "3dJUkIVx42U",
            title: "\uAC15\uD654 \uCC9C\uBB38 \uAE08\uC1A1 \uC804\uB0A8\uAD8C\uACF5\uAC04-\uAC15\uD654\uBD80\uB3D9\uC0B0",
            thumbnail: "https://i.ytimg.com/vi/3dJUkIVx42U/hqdefault.jpg",
            url: "https://www.youtube.com/watch?v=3dJUkIVx42U"
          },
          {
            id: "wTxCLSPAktI",
            title: "\uAC15\uD654 \uB9C8\uB2C8\uC0B0 \uC911\uD131 \uC804\uC6D0\uC8FC\uD0DD 50\uD3C9\uD615 \uB118\uB294 \uB2E8\uB3C5\uC8FC\uD0DD",
            thumbnail: "https://i.ytimg.com/vi/wTxCLSPAktI/hqdefault.jpg",
            url: "https://www.youtube.com/watch?v=wTxCLSPAktI"
          },
          {
            id: "tlcv9i9m5CU",
            title: "\uBCA4\uCE20\uAC00 \uBC14\uD034\uAC00 \uAC70\uC758 \uC5C6\uB294 \uC8FC\uCC45\uC774\uC57C...\uBED8\uC774 \uB9CE\uB2E4",
            thumbnail: "https://i.ytimg.com/vi/tlcv9i9m5CU/hqdefault.jpg",
            url: "https://www.youtube.com/watch?v=tlcv9i9m5CU"
          }
        ];
        return videos2.slice(0, limit);
      }
      const videos = [
        {
          id: "Vjqm9G9VN7s",
          title: "\uAC15\uD654\uBC84\uC2A4\uD22C\uC5B4 \uAC15\uD654\uD55C\uC625\uB9C8\uC744-\uC6B0\uB9AC\uC9D1\uD55C\uC625\uC2A4\uD14C\uC774",
          thumbnail: "https://i.ytimg.com/vi/Vjqm9G9VN7s/hqdefault.jpg",
          url: "https://www.youtube.com/watch?v=Vjqm9G9VN7s"
        },
        {
          id: "nJvPvjZ6hcE",
          title: "\uD604\uB300\uC544\uC774\uD30C\uD06C \uC778\uADFC \uB2E8\uB3C5\uC8FC\uD0DD \uBC14\uB85C \uBCF4\uC2DC\uC8E0",
          thumbnail: "https://i.ytimg.com/vi/nJvPvjZ6hcE/hqdefault.jpg",
          url: "https://www.youtube.com/watch?v=nJvPvjZ6hcE"
        },
        {
          id: "FQy2PGG2IEY",
          title: "\uAC15\uD654 \uC804\uC6D0\uC8FC\uD0DD \uC804\uC138 \uBC14\uB85C \uBCF4\uC2DC\uC8E0",
          thumbnail: "https://i.ytimg.com/vi/FQy2PGG2IEY/hqdefault.jpg",
          url: "https://www.youtube.com/watch?v=FQy2PGG2IEY"
        },
        {
          id: "uF6DUZEdFtA",
          title: '\uAC15\uD654\uC5D0\uC11C \uC11C\uC6B8 \uD55C\uAC15\uC774 \uBCF4\uC774\uB294 \uD0C0\uC6B4\uD558\uC6B0\uC2A4 "\uAC15\uD654 \uBE0C\uB9AC\uB4DC\uC6D0"',
          thumbnail: "https://i.ytimg.com/vi/uF6DUZEdFtA/hqdefault.jpg",
          url: "https://www.youtube.com/watch?v=uF6DUZEdFtA"
        },
        {
          id: "cJ-OQ4j5-5c",
          title: '\uC7A5\uD654\uB9AC \uD6A8\uC815\uB9C8\uC744 \uC804\uC6D0\uC8FC\uD0DD\uB2E8\uC9C0 "\uC774\uC6C3\uACFC \uD568\uAED8 \uC0AC\uB294 \uAE30\uC068"',
          thumbnail: "https://i.ytimg.com/vi/cJ-OQ4j5-5c/hqdefault.jpg",
          url: "https://www.youtube.com/watch?v=cJ-OQ4j5-5c"
        }
      ];
      return videos.slice(0, limit);
    }
  } catch (error) {
    console.error("\uC720\uD29C\uBE0C \uC601\uC0C1 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
    return [];
  }
}
var youtubeCache = {
  videos: [],
  lastFetched: 0
};
var CACHE_TTL2 = 6 * 60 * 60 * 1e3;
async function getLatestYouTubeVideos(channelUrl, limit = 5) {
  const now = Date.now();
  if (youtubeCache.videos.length > 0 && now - youtubeCache.lastFetched < CACHE_TTL2) {
    console.log("\uCE90\uC2DC\uB41C \uC720\uD29C\uBE0C \uC601\uC0C1 \uC815\uBCF4 \uBC18\uD658");
    return youtubeCache.videos.slice(0, limit);
  }
  const videos = await fetchLatestYouTubeVideos(channelUrl, limit);
  if (videos.length > 0) {
    youtubeCache = {
      videos,
      lastFetched: now
    };
  }
  return videos;
}

// server/sheet-importer.ts
init_storage();
import { google } from "googleapis";

// server/image-resizer.ts
import * as fs2 from "fs";
import * as path3 from "path";
function convertGoogleDriveUrl(url) {
  const patterns = [
    /https:\/\/drive\.google\.com\/file\/d\/([^\/]+)\/view/,
    /https:\/\/drive\.google\.com\/file\/d\/([^\/]+)/,
    /https:\/\/drive\.google\.com\/open\?id=([^&]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const fileId = match[1].split("?")[0];
      const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      log(`Google Drive URL \uBCC0\uD658: ${url.substring(0, 60)}... -> ${directUrl}`, "info");
      return directUrl;
    }
  }
  return url;
}
async function resizeImageFromUrl(imageUrl) {
  try {
    if (!imageUrl || imageUrl.trim() === "") {
      return null;
    }
    let downloadUrl = imageUrl;
    if (imageUrl.includes("drive.google.com")) {
      downloadUrl = convertGoogleDriveUrl(imageUrl);
    }
    log(`\uC774\uBBF8\uC9C0 \uB2E4\uC6B4\uB85C\uB4DC \uBC0F \uC800\uC7A5 \uC2DC\uC791 (Resizing SKIPPED): ${downloadUrl}`, "info");
    console.log(`[\uC774\uBBF8\uC9C0 \uB2E4\uC6B4\uB85C\uB4DC] \uC2DC\uB3C4: ${downloadUrl}`);
    const response = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      redirect: "follow"
    });
    console.log(`[\uC774\uBBF8\uC9C0 \uB2E4\uC6B4\uB85C\uB4DC] \uC751\uB2F5 \uC0C1\uD0DC: ${response.status}, \uD0C0\uC785: ${response.headers.get("content-type")}`);
    if (!response.ok) {
      log(`\uC774\uBBF8\uC9C0 \uB2E4\uC6B4\uB85C\uB4DC \uC2E4\uD328: ${imageUrl}, \uC0C1\uD0DC: ${response.status}`, "warn");
      return null;
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      log(`\uC774\uBBF8\uC9C0\uAC00 \uC544\uB2CC \uCF58\uD150\uCE20: ${imageUrl}, \uD0C0\uC785: ${contentType}`, "warn");
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const saveBuffer = imageBuffer;
    const uploadsDir = path3.join(process.cwd(), "public", "uploads");
    if (!fs2.existsSync(uploadsDir)) {
      fs2.mkdirSync(uploadsDir, { recursive: true });
    }
    const filename = `saved_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const filepath = path3.join(uploadsDir, filename);
    fs2.writeFileSync(filepath, saveBuffer);
    const savedUrl = `/uploads/${filename}`;
    log(`\uC774\uBBF8\uC9C0 \uC800\uC7A5 \uC644\uB8CC (\uC6D0\uBCF8): ${imageUrl} -> ${savedUrl}`, "info");
    return savedUrl;
  } catch (error) {
    log(`\uC774\uBBF8\uC9C0 \uCC98\uB9AC \uC624\uB958: ${imageUrl}, \uC5D0\uB7EC: ${error}`, "error");
    console.log(`[\uC774\uBBF8\uC9C0 \uC624\uB958] ${imageUrl}: ${error}`);
    return null;
  }
}
async function resizeImages(imageUrls) {
  const results = [];
  for (const url of imageUrls) {
    if (!url || url.trim() === "") {
      continue;
    }
    const resizedUrl = await resizeImageFromUrl(url);
    if (resizedUrl) {
      results.push(resizedUrl);
    }
  }
  return results;
}

// server/sheet-importer.ts
var COL = {
  A: 0,
  // 날짜
  B: 1,
  // 지역 (district)
  C: 2,
  // 주소 (address)
  D: 3,
  // 지목 (landType)
  E: 4,
  // 용도지역 (zoneType)
  G: 6,
  // 건물명 (buildingName)
  H: 7,
  // 동호수 (unitNumber)
  J: 9,
  // 면적/공급면적 (size/supplyArea)
  M: 12,
  // 전용면적 (privateArea)
  O: 14,
  // 평형 (areaSize)
  P: 15,
  // 방개수 (bedrooms)
  Q: 16,
  // 욕실개수 (bathrooms)
  S: 18,
  // 층수 (floor)
  T: 19,
  // 총층 (totalFloors)
  U: 20,
  // 방향 (direction)
  V: 21,
  // 난방방식 (heatingSystem)
  X: 23,
  // 사용승인일 (approvalDate)
  Y: 24,
  // 유형 (type)
  AB: 27,
  // 승강기유무 (elevator) - "유"이면 체크, "무"이거나 빈값이면 비체크
  AC: 28,
  // 주차 (parking)
  AD: 29,
  // 거래종류 (dealType)
  AE: 30,
  // 가격 (price)
  AF: 31,
  // 전세금 (deposit)
  AG: 32,
  // 보증금 (depositAmount)
  AH: 33,
  // 월세 (monthlyRent)
  AI: 34,
  // 관리비 (maintenanceFee)
  AJ: 35,
  // 소유자 (ownerName)
  AK: 36,
  // 소유자전화 (ownerPhone)
  AL: 37,
  // 임차인 (tenantName)
  AM: 38,
  // 임차인전화 (tenantPhone)
  AN: 39,
  // 의뢰인 (clientName)
  AO: 40,
  // 의뢰인전화 (clientPhone)
  AP: 41,
  // 특이사항 (specialNote)
  AQ: 42,
  // 담당중개사 (agentName) - 텍스트로 저장
  AR: 43,
  // 매물설명 (propertyDescription)
  AS: 44,
  // 비공개메모 (privateNote)
  AT: 45,
  // 제목 (title)
  AU: 46,
  // 설명 (description)
  AV: 47,
  // 이미지1
  AW: 48,
  // 이미지2
  AX: 49,
  // 이미지3
  AY: 50,
  // 이미지4
  AZ: 51,
  // 이미지5
  BA: 52
  // 유튜브URL (youtubeUrl)
};
async function checkDuplicatesFromSheet(spreadsheetId, apiKey, range, filterDate) {
  try {
    const sheets = google.sheets({ version: "v4", auth: apiKey });
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { success: true, duplicates: [] };
    }
    const filterDateTime = new Date(filterDate);
    filterDateTime.setHours(0, 0, 0, 0);
    const addressMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 3) continue;
      const rowDateStr = row[COL.A]?.toString().trim();
      if (!rowDateStr) continue;
      let rowDate;
      if (rowDateStr.includes("/")) {
        const parts = rowDateStr.split("/");
        if (parts[0].length === 4) {
          rowDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          rowDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        }
      } else if (rowDateStr.includes("-")) {
        rowDate = new Date(rowDateStr);
      } else if (rowDateStr.includes(".")) {
        const parts = rowDateStr.split(".");
        if (parts[0].length === 4) {
          rowDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          rowDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        }
      } else {
        rowDate = new Date(rowDateStr);
        if (isNaN(rowDate.getTime())) continue;
      }
      rowDate.setHours(0, 0, 0, 0);
      if (rowDate < filterDateTime) continue;
      const address = row[COL.C]?.toString().trim();
      if (address) {
        addressMap.set(address, i + 2);
      }
    }
    if (addressMap.size === 0) {
      return { success: true, duplicates: [] };
    }
    const addresses = Array.from(addressMap.keys());
    const existingProperties = await storage.getPropertiesByAddresses(addresses);
    const duplicates = existingProperties.map((prop) => ({
      rowIndex: addressMap.get(prop.address) || 0,
      address: prop.address,
      existingPropertyId: prop.id,
      existingPropertyTitle: prop.title
    }));
    return { success: true, duplicates };
  } catch (error) {
    log(`\uC911\uBCF5 \uD655\uC778 \uC2E4\uD328: ${error}`, "error");
    return { success: false, error: `\uC911\uBCF5 \uD655\uC778 \uC2E4\uD328: ${error}` };
  }
}
async function importPropertiesFromSheet(spreadsheetId, apiKey, range = "\uD1A0\uC9C0!A2:BA", filterDate, skipAddresses = []) {
  try {
    const sheets = google.sheets({ version: "v4", auth: apiKey });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { success: false, error: "\uC2DC\uD2B8\uC5D0 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." };
    }
    log(`\uAD6C\uAE00 \uC2DC\uD2B8\uC5D0\uC11C ${rows.length}\uAC1C\uC758 \uD589\uC744 \uCC3E\uC558\uC2B5\uB2C8\uB2E4. (\uC2DC\uD2B8: ${range})`, "info");
    const filterDateTime = new Date(filterDate);
    filterDateTime.setHours(0, 0, 0, 0);
    log(`\uB0A0\uC9DC \uD544\uD130 \uC801\uC6A9: ${filterDate} \uC774\uD6C4\uC758 \uB370\uC774\uD130\uB9CC \uAC00\uC838\uC635\uB2C8\uB2E4.`, "info");
    const importedIds = [];
    const errors = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (row.length < 3) {
          errors.push(`\uD589 ${i + 2}: \uB370\uC774\uD130\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4.`);
          continue;
        }
        const rowDateStr = row[COL.A]?.toString().trim();
        if (!rowDateStr) {
          continue;
        }
        let rowDate;
        if (rowDateStr.includes("/")) {
          const parts = rowDateStr.split("/");
          if (parts[0].length === 4) {
            rowDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            rowDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          }
        } else if (rowDateStr.includes("-")) {
          rowDate = new Date(rowDateStr);
        } else if (rowDateStr.includes(".")) {
          const parts = rowDateStr.split(".");
          if (parts[0].length === 4) {
            rowDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            rowDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          }
        } else {
          rowDate = new Date(rowDateStr);
        }
        rowDate.setHours(0, 0, 0, 0);
        if (isNaN(rowDate.getTime())) {
          log(`\uD589 ${i + 2}: \uB0A0\uC9DC \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4 (${rowDateStr}), \uC2A4\uD0B5\uB428`, "warn");
          continue;
        }
        if (rowDate < filterDateTime) {
          continue;
        }
        log(`\uD589 ${i + 2}: \uB0A0\uC9DC \uD544\uD130 \uD1B5\uACFC (${rowDateStr} >= ${filterDate})`, "info");
        log(`\uD589 ${i + 2}: \uD328\uB529 \uC804 \uD589 \uAE38\uC774: ${row.length}`, "info");
        const originalAV = row[COL.AV] || "(\uC5C6\uC74C)";
        const originalAW = row[COL.AW] || "(\uC5C6\uC74C)";
        const originalAX = row[COL.AX] || "(\uC5C6\uC74C)";
        const originalAY = row[COL.AY] || "(\uC5C6\uC74C)";
        const originalAZ = row[COL.AZ] || "(\uC5C6\uC74C)";
        log(`\uD589 ${i + 2}: \uC6D0\uBCF8 \uC774\uBBF8\uC9C0 \uB370\uC774\uD130 - AV: "${String(originalAV).substring(0, 30)}", AW: "${String(originalAW).substring(0, 30)}", AX: "${String(originalAX).substring(0, 30)}"`, "info");
        const requiredLength = COL.BA + 1;
        while (row.length < requiredLength) {
          row.push("");
        }
        log(`\uD589 ${i + 2}: \uD328\uB529 \uD6C4 \uD589 \uAE38\uC774: ${row.length}`, "info");
        const rowAddress = row[COL.C]?.toString().trim();
        if (rowAddress && skipAddresses.includes(rowAddress)) {
          log(`\uD589 ${i + 2}: \uC911\uBCF5 \uB9E4\uBB3C\uB85C \uAC74\uB108\uB700 (\uC8FC\uC18C: ${rowAddress})`, "info");
          continue;
        }
        const getValue = (idx) => row[idx]?.toString().trim() || "";
        const getNumericValue = (idx) => {
          const val = getValue(idx);
          if (!val || val === "") return null;
          const numStr = val.replace(/[^0-9.-]/g, "");
          return numStr || null;
        };
        const getMoneyValue = (idx) => {
          const val = getNumericValue(idx);
          if (!val || val === "0") return null;
          const numericVal = parseFloat(val);
          if (isNaN(numericVal)) return null;
          return String(Math.round(numericVal * 1e4));
        };
        const getBooleanValue = (idx) => {
          const val = getValue(idx).toLowerCase();
          return val === "true" || val === "1" || val === "yes" || val === "\uC608" || val === "o";
        };
        const getElevatorValue = (idx) => {
          const val = getValue(idx).trim();
          return val === "\uC720";
        };
        const collectImageUrls = () => {
          const imageColumns = [COL.AV, COL.AW, COL.AX, COL.AY, COL.AZ];
          const urls = [];
          log(`[IMG] \uD589 ${i + 2}: \uD589\uAE38\uC774=${row.length}, AV(47)="${(row[47] || "").toString().substring(0, 60)}"`, "info");
          log(`[IMG] \uD589 ${i + 2}: AW(48)="${(row[48] || "").toString().substring(0, 60)}", AX(49)="${(row[49] || "").toString().substring(0, 60)}"`, "info");
          for (const col of imageColumns) {
            const rawValue = row[col];
            const url = rawValue?.toString().trim() || "";
            const cleanUrl = url.replace(/\s+/g, "");
            if (cleanUrl && cleanUrl.length > 0) {
              if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://") || cleanUrl.startsWith("//")) {
                const finalUrl = cleanUrl.startsWith("//") ? "https:" + cleanUrl : cleanUrl;
                log(`[IMG] \uD589 ${i + 2}: \uC5F4 ${col}\uC5D0\uC11C URL \uBC1C\uACAC: ${finalUrl.substring(0, 60)}...`, "info");
                urls.push(finalUrl);
              } else {
                log(`[IMG] \uD589 ${i + 2}: \uC5F4 ${col} URL\uD615\uC2DD \uC544\uB2D8: "${cleanUrl.substring(0, 40)}"`, "warn");
              }
            }
          }
          log(`[IMG] \uD589 ${i + 2}: \uCD1D ${urls.length}\uAC1C URL`, "info");
          return urls;
        };
        const dealTypeStr = getValue(COL.AD);
        let dealTypeArray = ["\uB9E4\uB9E4"];
        if (dealTypeStr) {
          dealTypeArray = dealTypeStr.split(",").map((s) => s.trim()).filter((s) => s);
          if (dealTypeArray.length === 0) dealTypeArray = ["\uB9E4\uB9E4"];
        }
        const originalImageUrls = collectImageUrls();
        let processedImageUrls = [];
        if (originalImageUrls.length > 0) {
          log(`\uD589 ${i + 2}: ${originalImageUrls.length}\uAC1C \uC774\uBBF8\uC9C0 \uB9AC\uC0AC\uC774\uC9D5 \uC2DC\uC791...`, "info");
          processedImageUrls = await resizeImages(originalImageUrls);
          log(`\uD589 ${i + 2}: \uC774\uBBF8\uC9C0 \uB9AC\uC0AC\uC774\uC9D5 \uC644\uB8CC (${processedImageUrls.length}\uAC1C)`, "info");
        }
        const propertyType = mapPropertyType(getValue(COL.Y));
        if (processedImageUrls.length === 0) {
          processedImageUrls = [getDefaultImageForPropertyType(propertyType)];
        }
        const propertyData = {
          title: getValue(COL.AT) || "\uC81C\uBAA9\uC744 \uC785\uB825\uD558\uC138\uC694",
          description: getValue(COL.AU) || getValue(COL.AR) || "",
          type: propertyType,
          price: (() => {
            const priceVal = getNumericValue(COL.AE);
            if (!priceVal || priceVal === "0") return "0";
            const numericPrice = parseFloat(priceVal);
            if (isNaN(numericPrice)) return "0";
            return String(Math.round(numericPrice * 1e4));
          })(),
          address: getValue(COL.C),
          district: getValue(COL.B),
          size: getNumericValue(COL.J) || "0",
          bedrooms: parseInt(getValue(COL.P)) || 0,
          bathrooms: parseInt(getValue(COL.Q)) || 0,
          // 위치 정보
          buildingName: getValue(COL.G) || null,
          unitNumber: getValue(COL.H) || null,
          // 면적 정보
          supplyArea: getNumericValue(COL.J),
          privateArea: getNumericValue(COL.M),
          areaSize: getValue(COL.O) || null,
          // 건물 정보
          floor: parseInt(getValue(COL.S)) || null,
          totalFloors: parseInt(getValue(COL.T)) || null,
          direction: getValue(COL.U) || null,
          elevator: getElevatorValue(COL.AB),
          // "유"이면 체크, "무"이거나 빈값이면 비체크
          parking: getValue(COL.AC) || null,
          heatingSystem: getValue(COL.V) || null,
          approvalDate: getValue(COL.X) || null,
          // 토지 정보
          landType: getValue(COL.D) || null,
          zoneType: getValue(COL.E) || null,
          // 금액 정보 (만원 → 원 변환)
          dealType: dealTypeArray,
          deposit: getMoneyValue(COL.AF),
          depositAmount: getMoneyValue(COL.AG),
          monthlyRent: getMoneyValue(COL.AH),
          maintenanceFee: getNumericValue(COL.AI),
          // 연락처 정보
          ownerName: getValue(COL.AJ) || null,
          ownerPhone: getValue(COL.AK) || null,
          tenantName: getValue(COL.AL) || null,
          tenantPhone: getValue(COL.AM) || null,
          clientName: getValue(COL.AN) || null,
          clientPhone: getValue(COL.AO) || null,
          // 추가 정보
          specialNote: getValue(COL.AP) || null,
          coListing: false,
          // 공동중개 기본값
          agentName: getValue(COL.AQ) || null,
          // 담당중개사 이름 (텍스트)
          propertyDescription: getValue(COL.AR) || null,
          privateNote: getValue(COL.AS) || null,
          youtubeUrl: getValue(COL.BA) || null,
          // 이미지 URL 처리 - 리사이징된 이미지 사용
          imageUrl: processedImageUrls[0],
          imageUrls: processedImageUrls,
          featured: false,
          displayOrder: 0,
          isVisible: true,
          agentId: 4
          // 기본값 4 (이민호)
        };
        if (!propertyData.title || !propertyData.address) {
          errors.push(`\uD589 ${i + 2}: \uD544\uC218 \uD544\uB4DC(\uC81C\uBAA9, \uC8FC\uC18C)\uAC00 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`);
          continue;
        }
        const savedProperty = await storage.createProperty(propertyData);
        importedIds.push(savedProperty.id);
        log(`\uD589 ${i + 2} \uC784\uD3EC\uD2B8 \uC131\uACF5: ${savedProperty.title} (ID: ${savedProperty.id})`, "info");
      } catch (rowError) {
        errors.push(`\uD589 ${i + 2} \uCC98\uB9AC \uC624\uB958: ${rowError}`);
        log(`\uD589 ${i + 2} \uCC98\uB9AC \uC624\uB958: ${rowError}`, "error");
      }
    }
    if (errors.length > 0) {
      log(`${errors.length}\uAC1C\uC758 \uD589\uC5D0\uC11C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${errors.slice(0, 5).join("; ")}`, "error");
    }
    return {
      success: true,
      count: importedIds.length,
      importedIds,
      error: errors.length > 0 ? `${errors.length}\uAC1C\uC758 \uD589\uC5D0\uC11C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4` : void 0
    };
  } catch (error) {
    log(`\uAD6C\uAE00 \uC2DC\uD2B8 \uB370\uC774\uD130 \uAC00\uC838\uC624\uAE30 \uC2E4\uD328: ${error}`, "error");
    return { success: false, error: `\uAD6C\uAE00 \uC2DC\uD2B8 \uB370\uC774\uD130 \uAC00\uC838\uC624\uAE30 \uC2E4\uD328: ${error}` };
  }
}
function mapPropertyType(type) {
  const typeMap = {
    "\uD1A0\uC9C0": "\uD1A0\uC9C0",
    "\uB2E8\uB3C5": "\uB2E8\uB3C5",
    "\uB2E8\uB3C5\uC8FC\uD0DD": "\uB2E8\uB3C5",
    "\uC8FC\uD0DD": "\uB2E8\uB3C5",
    "\uADFC\uB9B0": "\uADFC\uB9B0",
    "\uADFC\uB9B0\uC0C1\uAC00": "\uADFC\uB9B0",
    "\uC544\uD30C\uD2B8": "\uC544\uD30C\uD2B8",
    "\uB2E4\uC138\uB300": "\uB2E4\uC138\uB300",
    "\uC5F0\uB9BD": "\uC5F0\uB9BD",
    "\uC6D0\uB8F8": "\uC6D0\uD22C\uB8F8",
    "\uD22C\uB8F8": "\uC6D0\uD22C\uB8F8",
    "\uC6D0\uD22C\uB8F8": "\uC6D0\uD22C\uB8F8",
    "\uB2E4\uAC00\uAD6C": "\uB2E4\uAC00\uAD6C",
    "\uC624\uD53C\uC2A4\uD154": "\uC624\uD53C\uC2A4\uD154",
    "\uC0C1\uAC00": "\uADFC\uB9B0",
    "\uACF5\uC7A5": "\uAE30\uD0C0",
    "\uCC3D\uACE0": "\uAE30\uD0C0",
    "\uD39C\uC158": "\uAE30\uD0C0",
    "\uAE30\uD0C0": "\uAE30\uD0C0"
  };
  const normalizedType = type.trim();
  if (typeMap[normalizedType]) {
    return typeMap[normalizedType];
  }
  for (const key in typeMap) {
    if (normalizedType.includes(key)) {
      return typeMap[key];
    }
  }
  return "\uAE30\uD0C0";
}
function getDefaultImageForPropertyType(type) {
  return "/uploads/default-property.png";
}

// server/routes.ts
var siteConfig = {
  siteName: "\uC774\uAC00\uC774\uBC84 \uBD80\uB3D9\uC0B0",
  siteDescription: "\uAC15\uD654\uB3C4 \uBD80\uB3D9\uC0B0 \uC911\uAC1C \uC11C\uBE44\uC2A4",
  siteContactEmail: "contact@ganghwaestate.com"
};
async function registerRoutes(app2) {
  const uploadDir = path4.join(process.cwd(), "public/uploads");
  if (!fs3.existsSync(uploadDir)) {
    fs3.mkdirSync(uploadDir, { recursive: true });
  }
  app2.use("/uploads", express2.static(uploadDir));
  const uploadStorage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path4.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  });
  const upload = multer({
    storage: uploadStorage,
    limits: { fileSize: 10 * 1024 * 1024 }
    // 10MB 제한
  });
  setupAuth(app2);
  app2.get("/api/site/config", (req, res) => {
    res.json(siteConfig);
  });
  app2.get("/api/status", async (req, res) => {
    try {
      const envCheck = {
        FIREBASE_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
        YOUTUBE_KEY: !!process.env.YOUTUBE_API_KEY,
        NAVER_ID: !!process.env.NAVER_CLIENT_ID,
        NAVER_SECRET: !!process.env.NAVER_CLIENT_SECRET,
        // Server side doesn't see VITE_ keys usually, but helpful to check if passed
        VITE_KAKAO_KEY: !!process.env.VITE_KAKAO_MAP_KEY,
        NODE_ENV: process.env.NODE_ENV,
        APP_URL: process.env.APP_URL
        // 값 확인 필요 (http/https mismatch 확인용)
      };
      const defaultUrl = process.env.NODE_ENV === "production" ? "http://1.234.53.82" : "http://localhost:5000";
      const appUrl = (process.env.APP_URL || defaultUrl).replace(/\/$/, "");
      const authDebug = {
        naverCallback: `${appUrl}/api/auth/naver/callback`,
        kakaoCallback: `${appUrl}/api/auth/kakao/callback`
      };
      let dbStatus = "Unknown";
      let propertyCount = -1;
      let userCount = -1;
      try {
        const testProps = await storage.getProperties();
        const testUsers = await storage.getAllUsers();
        dbStatus = "Connected";
        propertyCount = testProps.length;
        userCount = testUsers.length;
      } catch (dbError) {
        dbStatus = `Error: ${dbError instanceof Error ? dbError.message : String(dbError)}`;
      }
      res.json({
        status: "ok",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: envCheck,
        authExpectedCallbacks: authDebug,
        database: {
          status: dbStatus,
          propertyCount,
          userCount,
          adminExists: userCount > 0 && await storage.getUserByUsername("admin") ? true : false
        }
      });
    } catch (e) {
      res.status(500).json({ status: "error", error: String(e) });
    }
  });
  app2.get("/api/admin/seed", async (req, res) => {
    try {
      const { seedInitialData: seedInitialData2 } = await Promise.resolve().then(() => (init_seeder(), seeder_exports));
      await seedInitialData2();
      res.json({ message: "Seeding executed. Check server logs for details or /api/status for count." });
    } catch (e) {
      res.status(500).json({ message: "Seeding failed", error: String(e) });
    }
  });
  app2.get("/api/admin/import-from-replit", async (req, res) => {
    try {
      const REMOTE_URL = "https://real-estate-hub-mino312044.replit.app";
      const response = await fetch(`${REMOTE_URL}/api/properties`);
      if (!response.ok) throw new Error(`Failed to fetch from Replit: ${response.statusText}`);
      const properties = await response.json();
      let count = 0;
      for (const prop of properties) {
        const { id, createdAt, updatedAt, ...newProp } = prop;
        newProp.price = String(newProp.price || "0");
        newProp.size = String(newProp.size || "0");
        newProp.imageUrls = newProp.imageUrls || [];
        await storage.createProperty(newProp);
        count++;
        await new Promise((r) => setTimeout(r, 50));
      }
      res.json({
        message: "Migration started/completed.",
        source: REMOTE_URL,
        importedCount: count
      });
    } catch (e) {
      res.status(500).json({ message: "Migration failed", error: String(e) });
    }
  });
  app2.get("/api/properties", async (req, res) => {
    try {
      const skipCache = req.query.skipCache === "true";
      if (!skipCache) {
        const cacheKey = "properties_all";
        const cachedProperties = memoryCache.get(cacheKey);
        if (cachedProperties) {
          return res.json(cachedProperties);
        }
      }
      const properties = await storage.getProperties();
      if (!skipCache) {
        memoryCache.set("properties_all", properties, 1 * 60 * 1e3);
      }
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });
  app2.get("/api/admin/properties", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all properties" });
    }
  });
  app2.get("/api/properties/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : void 0;
      const properties = await storage.getFeaturedProperties(limit);
      console.log(
        `\uCD94\uCC9C \uB9E4\uBB3C ${properties.length}\uAC1C \uC870\uD68C\uB428:`,
        properties.map((p) => `${p.id}:${p.title}(${p.featured ? "\uCD94\uCC9C" : "\uC77C\uBC18"})`)
      );
      res.json(properties);
    } catch (error) {
      console.error("Error fetching featured properties:", error);
      res.status(500).json({ message: "Failed to fetch featured properties" });
    }
  });
  app2.get("/api/properties/urgent", async (req, res) => {
    try {
      const properties = await storage.getUrgentProperties(4);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch urgent properties" });
    }
  });
  app2.get("/api/properties/negotiable", async (req, res) => {
    try {
      const properties = await storage.getNegotiableProperties(4);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch negotiable properties" });
    }
  });
  app2.get("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      let isAdmin = false;
      if (req.isAuthenticated()) {
        const user = req.user;
        isAdmin = user.role === "admin";
      }
      if (isAdmin) {
        return res.json(property);
      }
      const {
        // address는 지도 표시를 위해 허용 (단, 상세 주소인 unitNumber는 숨김)
        buildingName,
        unitNumber,
        // 동호수 (노출금지)
        ownerName,
        ownerPhone,
        // 소유자 정보 (노출금지)
        tenantName,
        tenantPhone,
        // 임차인 정보 (노출금지)
        clientName,
        clientPhone,
        // 의뢰인 정보 (노출금지)
        privateNote,
        // 비공개 메모 (노출금지)
        ...safeProperty
      } = property;
      res.json(safeProperty);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });
  app2.patch("/api/properties/:id/featured", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { featured } = req.body;
      await storage.togglePropertyFeatured(id, featured);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle property featured status" });
    }
  });
  app2.patch("/api/properties/:id/urgent", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { isUrgent } = req.body;
      await storage.togglePropertyUrgent(id, isUrgent);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle property urgent status" });
    }
  });
  app2.patch("/api/properties/:id/negotiable", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { isNegotiable } = req.body;
      await storage.togglePropertyNegotiable(id, isNegotiable);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle property negotiable status" });
    }
  });
  app2.put("/api/properties/:id/urgent-order", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { urgentOrder } = req.body;
      await storage.updatePropertyUrgentOrder(id, urgentOrder);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update property urgent order" });
    }
  });
  app2.put("/api/properties/:id/negotiable-order", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      const id = parseInt(req.params.id);
      const { negotiableOrder } = req.body;
      await storage.updatePropertyNegotiableOrder(id, negotiableOrder);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update property negotiable order" });
    }
  });
  app2.get("/api/properties/type/:type", async (req, res) => {
    try {
      const type = req.params.type;
      const properties = await storage.getPropertiesByType(type);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties by type" });
    }
  });
  app2.get("/api/properties/district/:district", async (req, res) => {
    try {
      const district = req.params.district;
      const properties = await storage.getPropertiesByDistrict(district);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties by district" });
    }
  });
  app2.get("/api/properties/price-range", async (req, res) => {
    try {
      const minParam = req.query.min;
      const maxParam = req.query.max;
      if (!minParam || !maxParam) {
        return res.status(400).json({ message: "Min and max parameters are required" });
      }
      const min = parseInt(minParam);
      const max = parseInt(maxParam);
      if (isNaN(min) || isNaN(max)) {
        return res.status(400).json({ message: "Min and max must be valid numbers" });
      }
      const properties = await storage.getPropertiesByPriceRange(min, max);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties by price range" });
    }
  });
  app2.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });
  app2.get("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });
  app2.post("/api/agents", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin permission required" });
      }
      const agent = await storage.createAgent(req.body);
      res.status(201).json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to create agent" });
    }
  });
  app2.patch("/api/agents/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin permission required" });
      }
      const id = parseInt(req.params.id);
      const agent = await storage.updateAgent(id, req.body);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update agent" });
    }
  });
  app2.delete("/api/agents/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin permission required" });
      }
      const id = parseInt(req.params.id);
      const result = await storage.deleteAgent(id);
      if (result) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Agent not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete agent" });
    }
  });
  app2.post("/api/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      try {
        const emailTemplate = createInquiryEmailTemplate({
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          message: validatedData.message
        });
        const recipientEmail = "9551304@naver.com";
        console.log(`\uC218\uC2E0\uC790 \uC774\uBA54\uC77C \uC124\uC815: ${recipientEmail}`);
        const emailSent = await sendEmail(
          recipientEmail,
          `[\uC774\uAC00\uC774\uBC84\uBD80\uB3D9\uC0B0 \uC6F9\uC0AC\uC774\uD2B8] ${validatedData.name}\uB2D8\uC758 \uC0C8\uB85C\uC6B4 \uBB38\uC758\uAC00 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4`,
          emailTemplate
        );
        if (emailSent) {
          console.log(`\uBB38\uC758 ID ${inquiry.id}\uC5D0 \uB300\uD55C \uC54C\uB9BC \uC774\uBA54\uC77C \uC804\uC1A1 \uC644\uB8CC`);
        } else {
          console.error(`\uBB38\uC758 ID ${inquiry.id}\uC5D0 \uB300\uD55C \uC54C\uB9BC \uC774\uBA54\uC77C \uC804\uC1A1 \uC2E4\uD328`);
        }
      } catch (emailError) {
        console.error("\uBB38\uC758 \uC54C\uB9BC \uC774\uBA54\uC77C \uBC1C\uC1A1 \uC911 \uC624\uB958 \uBC1C\uC0DD:", emailError);
      }
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });
  app2.get("/api/properties/:propertyId/inquiries", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "\uD574\uB2F9 \uB9E4\uBB3C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      let user = null;
      let isAdmin = false;
      if (req.isAuthenticated()) {
        user = req.user;
        isAdmin = user.role === "admin";
      }
      const inquiries = await storage.getPropertyInquiries(propertyId);
      const filteredInquiries = inquiries.map((inquiry) => {
        if (isAdmin) return inquiry;
        if (user && inquiry.userId === user.id) return inquiry;
        if (user && inquiry.isReply && inquiry.parentId) {
          const parentInquiry = inquiries.find((i) => i.id === inquiry.parentId);
          if (user && parentInquiry?.userId === user.id) return inquiry;
          return {
            ...inquiry,
            content: "\uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uB2F5\uBCC0\uC740 \uBB38\uC758 \uC791\uC131\uC790\uC640 \uAD00\uB9AC\uC790\uB9CC \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
            // 내용 숨김
          };
        }
        return {
          ...inquiry,
          content: "\uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uBB38\uC758\uAE00\uC740 \uC791\uC131\uC790\uC640 \uAD00\uB9AC\uC790\uB9CC \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4."
          // 내용 숨김
        };
      });
      res.json(filteredInquiries);
    } catch (error) {
      console.error("Error getting property inquiries:", error);
      res.status(500).json({ message: "\uBB38\uC758\uAE00 \uBAA9\uB85D\uC744 \uAC00\uC838\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/properties/:propertyId/inquiries", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const propertyId = parseInt(req.params.propertyId);
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "\uD574\uB2F9 \uB9E4\uBB3C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (req.body.isReply) {
        const isAdmin = user.role === "admin";
        if (!isAdmin) {
          return res.status(403).json({ message: "\uB2F5\uBCC0\uC740 \uAD00\uB9AC\uC790\uB9CC \uC791\uC131\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
        }
        const parentId = req.body.parentId;
        if (!parentId) {
          return res.status(400).json({ message: "\uB2F5\uBCC0\uC5D0\uB294 \uBD80\uBAA8 \uBB38\uC758\uAE00 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." });
        }
        const parentInquiry = await storage.getPropertyInquiry(parentId);
        if (!parentInquiry) {
          return res.status(404).json({ message: "\uC6D0\uBCF8 \uBB38\uC758\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
        }
        if (parentInquiry.isReply) {
          return res.status(400).json({ message: "\uB2F5\uBCC0\uC5D0\uB294 \uCD94\uAC00 \uB2F5\uBCC0\uC744 \uB2EC \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
        }
      }
      const inquiryData = {
        ...req.body,
        propertyId,
        userId: user.id
      };
      const validatedData = insertPropertyInquirySchema.parse(inquiryData);
      const inquiry = await storage.createPropertyInquiry(validatedData);
      if (!inquiry.isReply) {
        try {
          const recipientEmail = "9551304@naver.com";
          const emailSubject = `[\uC774\uAC00\uC774\uBC84\uBD80\uB3D9\uC0B0] \uB9E4\uBB3C \uBB38\uC758: ${property.title}`;
          const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
              <h2 style="color: #3b82f6; margin-bottom: 20px;">\uC0C8\uB85C\uC6B4 \uB9E4\uBB3C \uBB38\uC758\uAC00 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4</h2>
              
              <div style="margin-bottom: 15px; background-color: #f0f9ff; padding: 15px; border-radius: 5px;">
                <strong>\uB9E4\uBB3C \uC815\uBCF4:</strong><br>
                [${property.type}] ${property.title}<br>
                ${property.district} / ${Number(property.price) > 0 ? Number(property.price) / 1e4 + "\uB9CC\uC6D0" : "\uAC00\uACA9\uBB38\uC758"}
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong>\uBB38\uC758\uC790 \uC815\uBCF4:</strong><br>
                \uC774\uB984: ${user.username}<br>
                \uC5F0\uB77D\uCC98: ${user.phone || "\uC5C6\uC74C"}<br>
                \uC774\uBA54\uC77C: ${user.email || "\uC5C6\uC74C"}
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong>\uBB38\uC758 \uC81C\uBAA9:</strong> ${inquiry.title}
              </div>
              
              <div style="margin-bottom: 15px;">
                <strong>\uBB38\uC758 \uB0B4\uC6A9:</strong>
                <p style="background-color: #f9f9f9; padding: 10px; border-radius: 4px;">${inquiry.content.replace(/\n/g, "<br>")}</p>
              </div>
              
              <div style="font-size: 12px; color: #666; margin-top: 30px; padding-top: 10px; border-top: 1px solid #e1e1e1;">
                <p>\uAD00\uB9AC\uC790 \uD398\uC774\uC9C0\uC5D0\uC11C \uB2F5\uAE00\uC744 \uC791\uC131\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>
              </div>
            </div>
          `;
          console.log(`\uB9E4\uBB3C \uBB38\uC758 \uC54C\uB9BC \uC774\uBA54\uC77C \uBC1C\uC1A1 \uC900\uBE44: ${recipientEmail}`);
          await sendEmail(recipientEmail, emailSubject, emailContent);
        } catch (emailError) {
          console.error("\uB9E4\uBB3C \uBB38\uC758 \uC54C\uB9BC \uC774\uBA54\uC77C \uBC1C\uC1A1 \uC2E4\uD328:", emailError);
        }
      }
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "\uC798\uBABB\uB41C \uBB38\uC758\uAE00 \uB370\uC774\uD130\uC785\uB2C8\uB2E4.", errors: error.errors });
      }
      console.error("Error creating property inquiry:", error);
      res.status(500).json({ message: "\uBB38\uC758\uAE00 \uC791\uC131 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.delete("/api/properties/:propertyId/inquiries/:inquiryId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const inquiryId = parseInt(req.params.inquiryId);
      const inquiry = await storage.getPropertyInquiry(inquiryId);
      if (!inquiry) {
        return res.status(404).json({ message: "\uD574\uB2F9 \uBB38\uC758\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      const user = req.user;
      const isAdmin = user.role === "admin";
      const isAuthor = inquiry.userId === user.id;
      if (!isAdmin && !isAuthor) {
        return res.status(403).json({ message: "\uD574\uB2F9 \uBB38\uC758\uAE00\uC744 \uC0AD\uC81C\uD560 \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      const success = await storage.deletePropertyInquiry(inquiryId);
      if (success) {
        res.status(200).json({ message: "\uBB38\uC758\uAE00\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
      } else {
        res.status(500).json({ message: "\uBB38\uC758\uAE00 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
      }
    } catch (error) {
      console.error("Error deleting property inquiry:", error);
      res.status(500).json({ message: "\uBB38\uC758\uAE00 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.get("/api/admin/inquiries/unread", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const unreadInquiries = await storage.getUnreadInquiries();
      res.json(unreadInquiries);
    } catch (error) {
      console.error("Error getting unread inquiries:", error);
      res.status(500).json({ message: "\uBBF8\uC77D\uC740 \uBB38\uC758\uAE00\uC744 \uAC00\uC838\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.get("/api/admin/inquiries/unread/count", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const count = await storage.getUnreadInquiryCount();
      res.json({ count });
    } catch (error) {
      console.error("Error getting unread inquiry count:", error);
      res.status(500).json({ message: "\uBBF8\uC77D\uC740 \uBB38\uC758\uAE00 \uC218\uB97C \uAC00\uC838\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.put("/api/admin/inquiries/:inquiryId/read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const inquiryId = parseInt(req.params.inquiryId);
      const success = await storage.markInquiryAsRead(inquiryId);
      if (success) {
        res.json({ message: "\uBB38\uC758\uAE00\uC744 \uC77D\uC74C \uCC98\uB9AC\uD588\uC2B5\uB2C8\uB2E4." });
      } else {
        res.status(500).json({ message: "\uC77D\uC74C \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
      }
    } catch (error) {
      console.error("Error marking inquiry as read:", error);
      res.status(500).json({ message: "\uC77D\uC74C \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.put("/api/admin/inquiries/read-all", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const success = await storage.markAllInquiriesAsRead();
      if (success) {
        res.json({ message: "\uBAA8\uB4E0 \uBB38\uC758\uAE00\uC744 \uC77D\uC74C \uCC98\uB9AC\uD588\uC2B5\uB2C8\uB2E4." });
      } else {
        res.status(500).json({ message: "\uC77D\uC74C \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
      }
    } catch (error) {
      console.error("Error marking all inquiries as read:", error);
      res.status(500).json({ message: "\uC77D\uC74C \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.get("/api/search", async (req, res) => {
    try {
      const { district, type, minPrice, maxPrice, keyword } = req.query;
      console.log("\uAC80\uC0C9 \uD30C\uB77C\uBBF8\uD130:", { district, type, minPrice, maxPrice, keyword });
      let properties = await storage.getProperties();
      if (keyword && typeof keyword === "string" && keyword.trim() !== "") {
        const searchKeyword = keyword.toLowerCase().trim();
        console.log(`\uD0A4\uC6CC\uB4DC \uAC80\uC0C9: "${searchKeyword}"`);
        properties = properties.filter((p) => {
          const title = (p.title || "").toLowerCase();
          const description = (p.description || "").toLowerCase();
          const address = (p.address || "").toLowerCase();
          const district2 = (p.district || "").toLowerCase();
          return title.includes(searchKeyword) || description.includes(searchKeyword) || address.includes(searchKeyword) || district2.includes(searchKeyword);
        });
        console.log(`\uD0A4\uC6CC\uB4DC \uAC80\uC0C9 \uACB0\uACFC: ${properties.length}\uAC1C \uB9E4\uBB3C`);
      }
      if (district && district !== "all") {
        console.log(`\uC9C0\uC5ED \uD544\uD130\uB9C1: ${district}`);
        properties = properties.filter((p) => {
          const propertyDistrict = (p.district || "").toLowerCase();
          const searchDistrict = district.toLowerCase();
          console.log(`\uB9E4\uBB3C ID ${p.id}\uC758 \uC9C0\uC5ED: "${propertyDistrict}", \uAC80\uC0C9 \uC9C0\uC5ED: "${searchDistrict}"`);
          let isMatch = false;
          if (propertyDistrict === searchDistrict) {
            isMatch = true;
          } else if (searchDistrict === "\uAE30\uD0C0\uC9C0\uC5ED") {
            isMatch = !propertyDistrict.includes("\uAC15\uD654") || propertyDistrict === "";
          } else if (searchDistrict === "all") {
            isMatch = true;
          }
          if (isMatch) {
            console.log(`\u2713 \uB9E4\uCE6D \uB9E4\uBB3C \uBC1C\uACAC: ${p.id}, ${p.title}, ${p.district}`);
          }
          return isMatch;
        });
      }
      if (type && type !== "all") {
        properties = properties.filter((p) => {
          const propertyType = (p.type || "").toLowerCase();
          const searchType = type.toLowerCase();
          return propertyType.includes(searchType);
        });
      }
      if (minPrice && maxPrice) {
        const min = parseInt(minPrice);
        const max = parseInt(maxPrice);
        if (!isNaN(min) && !isNaN(max)) {
          properties = properties.filter((p) => {
            const price = p.price !== void 0 ? Number(p.price) : 0;
            return price >= min && price <= max;
          });
        }
      }
      console.log(`\uAC80\uC0C9 \uACB0\uACFC: ${properties.length}\uAC1C \uB9E4\uBB3C`);
      res.json(properties);
    } catch (error) {
      console.error("\uB9E4\uBB3C \uAC80\uC0C9 \uC624\uB958:", error);
      res.status(500).json({ message: "\uB9E4\uBB3C \uAC80\uC0C9 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/properties", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      console.log("\uBD80\uB3D9\uC0B0 \uB4F1\uB85D \uC694\uCCAD \uB370\uC774\uD130:", JSON.stringify(req.body, null, 2));
      try {
        const stripCommas = (value) => {
          if (value === "" || value === null || value === void 0) return null;
          return String(value).replace(/,/g, "");
        };
        const processedData = {
          ...req.body,
          bedrooms: req.body.bedrooms !== void 0 ? req.body.bedrooms : 0,
          bathrooms: req.body.bathrooms !== void 0 ? req.body.bathrooms : 0,
          // 이미지 URL 필드 처리
          imageUrls: Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [],
          // dealType 처리 - 배열로 변환
          dealType: Array.isArray(req.body.dealType) ? req.body.dealType : req.body.dealType ? [req.body.dealType] : ["\uB9E4\uB9E4"],
          // 숫자 필드들 - 쉼표 제거 후 처리
          price: stripCommas(req.body.price) || "0",
          size: stripCommas(req.body.size) || "0",
          // agentId 처리 - 필수 필드이므로 기본값 설정 (database에서는 agent_id로 저장됨)
          agentId: (() => {
            const raw = Number(req.body.agentId || req.body.agent_id);
            return Number.isFinite(raw) && raw > 0 ? raw : 4;
          })(),
          supplyArea: stripCommas(req.body.supplyArea),
          privateArea: stripCommas(req.body.privateArea),
          floor: req.body.floor === "" ? null : req.body.floor ? parseInt(req.body.floor) || null : null,
          totalFloors: req.body.totalFloors === "" ? null : req.body.totalFloors ? parseInt(req.body.totalFloors) || null : null,
          deposit: stripCommas(req.body.deposit),
          depositAmount: stripCommas(req.body.depositAmount),
          monthlyRent: stripCommas(req.body.monthlyRent),
          maintenanceFee: stripCommas(req.body.maintenanceFee)
        };
        console.log("\uCC98\uB9AC\uB41C \uB370\uC774\uD130:", JSON.stringify(processedData, null, 2));
        const validatedData = insertPropertySchema.parse(processedData);
        const property = await storage.createProperty(validatedData);
        res.status(201).json(property);
      } catch (e) {
        if (e instanceof z2.ZodError) {
          console.error("\uC720\uD6A8\uC131 \uAC80\uC0AC \uC624\uB958:", JSON.stringify(e.errors, null, 2));
          return res.status(400).json({ message: "Invalid property data", errors: e.errors });
        }
        throw e;
      }
    } catch (error) {
      console.error("\uBD80\uB3D9\uC0B0 \uB4F1\uB85D \uC624\uB958:", error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });
  app2.patch("/api/properties/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      const existingProperty = await storage.getProperty(id);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }
      const stripCommas = (value) => {
        if (value === "" || value === null || value === void 0) return null;
        return String(value).replace(/,/g, "");
      };
      const processedData = {
        ...req.body,
        bedrooms: req.body.bedrooms !== void 0 ? req.body.bedrooms : existingProperty.bedrooms || 0,
        bathrooms: req.body.bathrooms !== void 0 ? req.body.bathrooms : existingProperty.bathrooms || 0,
        // 이미지 URL 필드 처리
        imageUrls: Array.isArray(req.body.imageUrls) ? req.body.imageUrls : req.body.imageUrls ? [req.body.imageUrls] : existingProperty.imageUrls || [],
        // dealType 처리 - 배열로 변환
        dealType: Array.isArray(req.body.dealType) ? req.body.dealType : req.body.dealType ? [req.body.dealType] : existingProperty.dealType || ["\uB9E4\uB9E4"],
        // 숫자 필드들 - 쉼표 제거 후 처리
        price: stripCommas(req.body.price) || existingProperty.price || "0",
        size: stripCommas(req.body.size) || existingProperty.size || "0",
        // agentId 처리 - 필수 필드이므로 기본값 설정 (database에서는 agent_id로 저장됨)
        agentId: (() => {
          const raw = Number(req.body.agentId || req.body.agent_id || existingProperty.agentId);
          return Number.isFinite(raw) && raw > 0 ? raw : 4;
        })(),
        supplyArea: stripCommas(req.body.supplyArea),
        privateArea: stripCommas(req.body.privateArea),
        floor: req.body.floor === "" ? null : req.body.floor ? parseInt(req.body.floor) || null : null,
        totalFloors: req.body.totalFloors === "" ? null : req.body.totalFloors ? parseInt(req.body.totalFloors) || null : null,
        deposit: stripCommas(req.body.deposit),
        depositAmount: stripCommas(req.body.depositAmount),
        monthlyRent: stripCommas(req.body.monthlyRent),
        maintenanceFee: stripCommas(req.body.maintenanceFee)
      };
      const validatedData = insertPropertySchema.partial().parse(processedData);
      const updatedProperty = await storage.updateProperty(id, validatedData);
      res.json(updatedProperty);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        console.error("\uBD80\uB3D9\uC0B0 \uC218\uC815 \uC720\uD6A8\uC131 \uAC80\uC0AC \uC624\uB958:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      console.error("\uBD80\uB3D9\uC0B0 \uC218\uC815 \uC624\uB958:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });
  app2.delete("/api/properties/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      const exists = await storage.getProperty(id);
      if (!exists) {
        return res.status(404).json({ message: "Property not found" });
      }
      const result = await storage.deleteProperty(id);
      if (result) {
        memoryCache.deleteByPrefix("properties_");
        res.json({ success: true });
      } else {
        res.status(500).json({ message: "Failed to delete property" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });
  app2.get("/api/favorites", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      const favoriteProperties = await storage.getFavoriteProperties(user.id);
      res.json(favoriteProperties);
    } catch (error) {
      console.error("Error fetching favorite properties:", error);
      res.status(500).json({ message: "\uAD00\uC2EC\uB9E4\uBB3C \uBAA9\uB85D\uC744 \uAC00\uC838\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.get("/api/properties/:propertyId/is-favorite", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.json({ isFavorite: false });
      }
      const propertyId = parseInt(req.params.propertyId);
      const user = req.user;
      const isFavorite = await storage.isFavorite(user.id, propertyId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking if property is favorite:", error);
      res.status(500).json({ message: "\uAD00\uC2EC\uB9E4\uBB3C \uD655\uC778 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/favorites", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      const propertyId = parseInt(req.body.propertyId);
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB9E4\uBB3C ID\uC785\uB2C8\uB2E4." });
      }
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "\uD574\uB2F9 \uB9E4\uBB3C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      const favoriteData = {
        userId: user.id,
        propertyId
      };
      try {
        const favorite = await storage.addFavorite(favoriteData);
        res.status(201).json({ message: "\uAD00\uC2EC\uB9E4\uBB3C\uB85C \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", favorite });
      } catch (err) {
        if (err instanceof Error && err.message.includes("\uC774\uBBF8 \uAD00\uC2EC \uB9E4\uBB3C\uB85C \uB4F1\uB85D")) {
          return res.status(409).json({ message: "\uC774\uBBF8 \uAD00\uC2EC\uB9E4\uBB3C\uB85C \uB4F1\uB85D\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4." });
        }
        throw err;
      }
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "\uAD00\uC2EC\uB9E4\uBB3C \uB4F1\uB85D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.delete("/api/favorites/:propertyId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      const propertyId = parseInt(req.params.propertyId);
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB9E4\uBB3C ID\uC785\uB2C8\uB2E4." });
      }
      const success = await storage.removeFavorite(user.id, propertyId);
      if (success) {
        res.json({ message: "\uAD00\uC2EC\uB9E4\uBB3C\uC5D0\uC11C \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
      } else {
        res.status(404).json({ message: "\uD574\uB2F9 \uAD00\uC2EC\uB9E4\uBB3C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "\uAD00\uC2EC\uB9E4\uBB3C \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ message: "\uB274\uC2A4\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.get("/api/test-real-estate", async (req, res) => {
    try {
      await testRealEstateAPI();
      res.json({
        success: true,
        message: "API \uD14C\uC2A4\uD2B8 \uC644\uB8CC, \uC11C\uBC84 \uB85C\uADF8\uB97C \uD655\uC778\uD558\uC138\uC694"
      });
    } catch (error) {
      console.error("API \uD14C\uC2A4\uD2B8 \uC624\uB958:", error);
      res.status(500).json({
        success: false,
        message: "API \uD14C\uC2A4\uD2B8 \uC911 \uC624\uB958 \uBC1C\uC0DD"
      });
    }
  });
  app2.get("/api/real-estate/transactions", async (req, res) => {
    try {
      const regionCode = req.query.regionCode || "28710";
      console.log(`\uC2E4\uAC70\uB798\uAC00 \uB370\uC774\uD130 \uC694\uCCAD: \uC9C0\uC5ED\uCF54\uB4DC=${regionCode}`);
      const transactions = await getRecentTransactions(regionCode);
      res.json({
        success: true,
        count: transactions.length,
        data: transactions
      });
    } catch (error) {
      console.error("\uC2E4\uAC70\uB798\uAC00 \uB370\uC774\uD130 \uC870\uD68C \uC624\uB958:", error);
      res.status(500).json({
        success: false,
        message: "\uC2E4\uAC70\uB798\uAC00 \uB370\uC774\uD130\uB97C \uAC00\uC838\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
      });
    }
  });
  app2.get("/api/youtube/latest", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 5;
      const cacheKey = `youtube_latest_${limit}`;
      const cachedVideos = memoryCache.get(cacheKey);
      if (cachedVideos) {
        return res.json(cachedVideos);
      }
      const channelUrl = "https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA?view_as=subscriber";
      const videos = await getLatestYouTubeVideos(channelUrl, limit);
      memoryCache.set(cacheKey, videos, 6 * 60 * 60 * 1e3);
      res.json(videos);
    } catch (error) {
      console.error("\uC720\uD29C\uBE0C \uC601\uC0C1 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
      res.status(500).json({
        message: "\uCD5C\uC2E0 \uC720\uD29C\uBE0C \uC601\uC0C1\uC744 \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/youtube/channel/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const refresh = req.query.refresh === "true";
      const cacheKey = `youtube_channel_videos_${channelId}_${limit}`;
      if (refresh) {
        memoryCache.delete(cacheKey);
      }
      const cachedVideos = memoryCache.get(cacheKey);
      if (cachedVideos) {
        return res.json(cachedVideos);
      }
      const videos = await fetchLatestYouTubeVideosWithAPI(channelId, limit);
      memoryCache.set(cacheKey, videos, 6 * 60 * 60 * 1e3);
      res.json(videos);
    } catch (error) {
      console.error("\uC720\uD29C\uBE0C \uCC44\uB110 \uC601\uC0C1 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
      res.status(500).json({
        message: "\uC720\uD29C\uBE0C \uCC44\uB110 \uC601\uC0C1\uC744 \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/youtube/handle/:handle", async (req, res) => {
    try {
      const { handle } = req.params;
      const cacheKey = `youtube_handle_${handle}`;
      const cachedChannelId = memoryCache.get(cacheKey);
      if (cachedChannelId) {
        return res.json({ channelId: cachedChannelId });
      }
      const channelId = await getChannelIdByHandle(handle);
      if (!channelId) {
        return res.status(404).json({ message: "\uCC44\uB110\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" });
      }
      memoryCache.set(cacheKey, channelId, 24 * 60 * 60 * 1e3);
      res.json({ channelId });
    } catch (error) {
      console.error("\uC720\uD29C\uBE0C \uD578\uB4E4 \uC870\uD68C \uC624\uB958:", error);
      res.status(500).json({
        message: "\uCC44\uB110 ID \uC870\uD68C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/youtube/shorts/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const cacheKey = `youtube_shorts_${channelId}_${limit}`;
      const cachedShorts = memoryCache.get(cacheKey);
      if (cachedShorts) {
        return res.json(cachedShorts);
      }
      const shorts = await fetchYouTubeShorts(channelId, limit);
      memoryCache.set(cacheKey, shorts, 6 * 60 * 60 * 1e3);
      res.json(shorts);
    } catch (error) {
      console.error("\uC720\uD29C\uBE0C \uC1FC\uCE20 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
      res.status(500).json({
        message: "\uC720\uD29C\uBE0C \uC1FC\uCE20\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/blog/latest", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 3;
      const blogId = req.query.blogId || "9551304";
      const categories = req.query.categories ? req.query.categories.split(",") : ["35", "36", "37"];
      const refresh = req.query.refresh === "true";
      const cacheKey = `blog_latest_${blogId}_${categories.join("_")}_${limit}`;
      const now = Date.now();
      const cacheTimestamp = memoryCache.getTimestamp(cacheKey);
      const cacheAge = cacheTimestamp ? now - cacheTimestamp : Infinity;
      const shouldRefresh = refresh || !cacheTimestamp || cacheAge > 1 * 60 * 1e3;
      if (shouldRefresh) {
        console.log(`\uBE14\uB85C\uADF8 \uCE90\uC2DC \uCD08\uAE30\uD654 (\uD0A4: ${cacheKey}, \uC0AC\uC720: ${refresh ? "\uAC15\uC81C \uAC31\uC2E0" : "\uC790\uB3D9 \uAC31\uC2E0"}, \uACBD\uACFC\uC2DC\uAC04: ${cacheAge / 1e3}\uCD08)`);
        memoryCache.delete(cacheKey);
      }
      const cachedPosts = memoryCache.get(cacheKey);
      if (cachedPosts) {
        if (Array.isArray(cachedPosts) && cachedPosts.length > 0) {
          console.log(`\uBE14\uB85C\uADF8 \uCE90\uC2DC\uC5D0\uC11C ${cachedPosts.length}\uAC1C \uD3EC\uC2A4\uD2B8 \uBC18\uD658`);
          return res.json(cachedPosts);
        } else {
          console.log("\uBE14\uB85C\uADF8 \uCE90\uC2DC\uAC00 \uBE44\uC5B4\uC788\uAC70\uB098, \uC798\uBABB\uB41C \uD615\uC2DD\uC785\uB2C8\uB2E4. \uC0C8\uB85C \uAC00\uC838\uC635\uB2C8\uB2E4.");
          memoryCache.delete(cacheKey);
        }
      }
      console.log(`\uBE14\uB85C\uADF8 \uB370\uC774\uD130 \uC0C8\uB85C \uC694\uCCAD (\uD0A4: ${cacheKey})`);
      if (refresh) {
        console.log("\uAC15\uC81C \uC0C8\uB85C\uACE0\uCE68 \uC694\uCCAD - \uC804\uC5ED \uBE14\uB85C\uADF8 \uCE90\uC2DC \uCD08\uAE30\uD654");
        try {
          const blogFetcher = (init_blog_fetcher(), __toCommonJS(blog_fetcher_exports));
          if (blogFetcher.blogCache) {
            blogFetcher.blogCache = {};
            console.log("\uBE14\uB85C\uADF8 \uCE90\uC2DC\uAC00 \uC644\uC804\uD788 \uCD08\uAE30\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBAA8\uB4E0 \uB370\uC774\uD130\uB97C \uC0C8\uB85C \uAC00\uC838\uC635\uB2C8\uB2E4.");
          }
        } catch (e) {
          console.error("\uBE14\uB85C\uADF8 \uCE90\uC2DC \uCD08\uAE30\uD654 \uC2E4\uD328:", e);
        }
      }
      let posts = await getLatestBlogPosts(blogId, categories, limit);
      if (!posts || posts.length === 0) {
        console.log("\uBE14\uB85C\uADF8 \uB370\uC774\uD130 \uC870\uD68C \uC2E4\uD328, \uCE74\uD14C\uACE0\uB9AC \uBCC0\uACBD \uD6C4 \uC7AC\uC2DC\uB3C4");
        posts = await getLatestBlogPosts(blogId, ["0", "11"], limit);
      }
      if (!posts || !Array.isArray(posts) || posts.length === 0) {
        console.log("\uB124\uC774\uBC84 \uBE14\uB85C\uADF8\uC5D0\uC11C \uD3EC\uC2A4\uD2B8\uB97C \uAC00\uC838\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD569\uB2C8\uB2E4.");
        try {
          posts = await getLatestBlogPosts(blogId, ["11", "0"], limit);
        } catch (retryErr) {
          console.error("\uBE14\uB85C\uADF8 \uB370\uC774\uD130 \uB450 \uBC88\uC9F8 \uC2DC\uB3C4 \uC2E4\uD328:", retryErr);
        }
      }
      if (Array.isArray(posts)) {
        posts = posts.filter(
          (post) => post && typeof post === "object" && post.id && post.title && post.link
        );
        const uniqueTitles = /* @__PURE__ */ new Set();
        posts = posts.filter((post) => {
          if (!post.title || uniqueTitles.has(post.title)) return false;
          uniqueTitles.add(post.title);
          if (post.title.length > 50) {
            post.title = post.title.substring(0, 50) + "...";
          }
          return true;
        });
      }
      if (Array.isArray(posts) && posts.length > 0) {
        console.log(`${posts.length}\uAC1C\uC758 \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8\uB97C \uCE90\uC2DC\uC5D0 \uC800\uC7A5 (1\uBD84)`);
        memoryCache.set(cacheKey, posts, 1 * 60 * 1e3);
      } else {
        console.log("\uC720\uD6A8\uD55C \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
      }
      res.json(posts);
    } catch (error) {
      console.error("\uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
      res.status(500).json({
        message: "\uCD5C\uC2E0 \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/news/latest", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 6;
      const cacheKey = `news_latest_${limit}`;
      const cachedNews = memoryCache.get(cacheKey);
      if (cachedNews) {
        return res.json(cachedNews);
      }
      const news = await storage.getLatestNews(limit);
      memoryCache.set(cacheKey, news, 5 * 60 * 1e3);
      res.json(news);
    } catch (error) {
      res.status(500).json({ message: "\uCD5C\uC2E0 \uB274\uC2A4\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.get("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB274\uC2A4 ID\uC785\uB2C8\uB2E4" });
      }
      const newsItem = await storage.getNewsById(id);
      if (!newsItem) {
        return res.status(404).json({ message: "\uB274\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" });
      }
      res.json(newsItem);
    } catch (error) {
      res.status(500).json({ message: "\uB274\uC2A4\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.get("/api/news/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const news = await storage.getNewsByCategory(category);
      res.json(news);
    } catch (error) {
      res.status(500).json({ message: "\uCE74\uD14C\uACE0\uB9AC\uBCC4 \uB274\uC2A4\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.post("/api/news", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4" });
      }
      const validatedData = insertNewsSchema.parse(req.body);
      const newsItem = await storage.createNews(validatedData);
      res.status(201).json(newsItem);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB274\uC2A4 \uB370\uC774\uD130\uC785\uB2C8\uB2E4", errors: error.errors });
      }
      res.status(500).json({ message: "\uB274\uC2A4 \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.patch("/api/news/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB274\uC2A4 ID\uC785\uB2C8\uB2E4" });
      }
      const existingNews = await storage.getNewsById(id);
      if (!existingNews) {
        return res.status(404).json({ message: "\uB274\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" });
      }
      const validatedData = insertNewsSchema.partial().parse(req.body);
      const updatedNews = await storage.updateNews(id, validatedData);
      res.json(updatedNews);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB274\uC2A4 \uB370\uC774\uD130\uC785\uB2C8\uB2E4", errors: error.errors });
      }
      res.status(500).json({ message: "\uB274\uC2A4 \uC218\uC815\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.delete("/api/news/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB274\uC2A4 ID\uC785\uB2C8\uB2E4" });
      }
      const exists = await storage.getNewsById(id);
      if (!exists) {
        return res.status(404).json({ message: "\uB274\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" });
      }
      const result = await storage.deleteNews(id);
      if (result) {
        res.json({ success: true });
      } else {
        res.status(500).json({ message: "\uB274\uC2A4 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
      }
    } catch (error) {
      res.status(500).json({ message: "\uB274\uC2A4 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.get("/api/admin/update-news", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4" });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      let newsItems = [];
      try {
        newsItems = await fetchAndSaveNews();
        console.log("\uB274\uC2A4 \uC5C5\uB370\uC774\uD2B8 \uC131\uACF5:", newsItems.length, "\uAC1C\uC758 \uB274\uC2A4 \uD56D\uBAA9");
      } catch (err) {
        const fetchError = err;
        console.error("\uB274\uC2A4 \uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958:", fetchError);
        return res.status(500).json({ message: "\uB274\uC2A4 \uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: " + fetchError.message });
      }
      return res.json({
        success: true,
        message: "\uB274\uC2A4\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        count: newsItems.length
      });
    } catch (error) {
      console.error("\uB274\uC2A4 \uC218\uB3D9 \uC5C5\uB370\uC774\uD2B8 API \uC624\uB958:", error);
      return res.status(500).json({ message: "\uB274\uC2A4 \uC5C5\uB370\uC774\uD2B8 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.put("/api/properties/:id/order", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const propertyId = parseInt(req.params.id);
      const { displayOrder } = req.body;
      if (typeof displayOrder !== "number") {
        return res.status(400).json({ message: "Display order must be a number" });
      }
      const success = await storage.updatePropertyOrder(propertyId, displayOrder);
      if (!success) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json({ message: "Property order updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update property order" });
    }
  });
  app2.patch("/api/properties/:id/visibility", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const propertyId = parseInt(req.params.id);
      const { isVisible } = req.body;
      if (!propertyId || typeof isVisible !== "boolean") {
        return res.status(400).json({ message: "Property ID and visibility state are required" });
      }
      const success = await storage.togglePropertyVisibility(propertyId, isVisible);
      if (!success) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json({ message: "Property visibility updated successfully" });
    } catch (error) {
      console.error("Error updating property visibility:", error);
      res.status(500).json({ message: "Failed to update property visibility" });
    }
  });
  app2.patch("/api/properties/:id/featured", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const propertyId = parseInt(req.params.id);
      const { featured } = req.body;
      if (!propertyId || typeof featured !== "boolean") {
        return res.status(400).json({ message: "Property ID and featured state are required" });
      }
      const success = await storage.togglePropertyFeatured(propertyId, featured);
      if (!success) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json({ message: "Property featured status updated successfully" });
    } catch (error) {
      console.error("Error updating property featured status:", error);
      res.status(500).json({ message: "Failed to update property featured status" });
    }
  });
  app2.post("/api/properties/batch-delete", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "\uC0AD\uC81C\uD560 \uB9E4\uBB3C ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            return await storage.deleteProperty(parseInt(id));
          } catch (err) {
            console.error(`\uB9E4\uBB3C ID ${id} \uC0AD\uC81C \uC911 \uC624\uB958:`, err);
            return false;
          }
        })
      );
      const successCount = results.filter(Boolean).length;
      memoryCache.deleteByPrefix("properties_");
      res.status(200).json({
        message: `\uCD1D ${ids.length}\uAC1C \uC911 ${successCount}\uAC1C\uC758 \uB9E4\uBB3C\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
        successCount,
        totalCount: ids.length
      });
    } catch (error) {
      console.error("\uB9E4\uBB3C \uC77C\uAD04 \uC0AD\uC81C \uC911 \uC624\uB958:", error);
      res.status(500).json({ message: "\uB9E4\uBB3C \uC77C\uAD04 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/news/batch-delete", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "\uC0AD\uC81C\uD560 \uB274\uC2A4 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            return await storage.deleteNews(parseInt(id));
          } catch (err) {
            console.error(`\uB274\uC2A4 ID ${id} \uC0AD\uC81C \uC911 \uC624\uB958:`, err);
            return false;
          }
        })
      );
      const successCount = results.filter(Boolean).length;
      memoryCache.deleteByPrefix("news_");
      res.status(200).json({
        message: `\uCD1D ${ids.length}\uAC1C \uC911 ${successCount}\uAC1C\uC758 \uB274\uC2A4\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
        successCount,
        totalCount: ids.length
      });
    } catch (error) {
      console.error("\uB274\uC2A4 \uC77C\uAD04 \uC0AD\uC81C \uC911 \uC624\uB958:", error);
      res.status(500).json({ message: "\uB274\uC2A4 \uC77C\uAD04 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/users/batch-delete", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "\uC0AD\uC81C\uD560 \uC0AC\uC6A9\uC790 ID\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const filteredIds = ids.filter((id) => parseInt(id) !== user.id);
      if (filteredIds.length !== ids.length) {
        console.log("\uC0AC\uC6A9\uC790\uAC00 \uC790\uAE30 \uC790\uC2E0\uC744 \uC0AD\uC81C\uD558\uB824\uACE0 \uC2DC\uB3C4\uD588\uC2B5\uB2C8\uB2E4.");
      }
      const results = await Promise.all(
        filteredIds.map(async (id) => {
          try {
            return await storage.deleteUser(parseInt(id));
          } catch (err) {
            console.error(`\uC0AC\uC6A9\uC790 ID ${id} \uC0AD\uC81C \uC911 \uC624\uB958:`, err);
            return false;
          }
        })
      );
      const successCount = results.filter(Boolean).length;
      res.status(200).json({
        message: `\uCD1D ${filteredIds.length}\uAC1C \uC911 ${successCount}\uAC1C\uC758 \uC0AC\uC6A9\uC790 \uACC4\uC815\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
        successCount,
        totalCount: filteredIds.length,
        skippedSelf: ids.length !== filteredIds.length
      });
    } catch (error) {
      console.error("\uC0AC\uC6A9\uC790 \uC77C\uAD04 \uC0AD\uC81C \uC911 \uC624\uB958:", error);
      res.status(500).json({ message: "\uC0AC\uC6A9\uC790 \uC77C\uAD04 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/admin/batch-delete/:type", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const { type } = req.params;
      const { ids } = req.body;
      console.log(`\uC77C\uAD04 \uC0AD\uC81C API \uD638\uCD9C: type=${type}, body=`, req.body);
      console.log(`ids \uD0C0\uC785: ${typeof ids}, \uBC30\uC5F4\uC5EC\uBD80: ${Array.isArray(ids)}, \uAC12:`, ids);
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "\uC720\uD6A8\uD55C ID \uBAA9\uB85D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      console.log(`\uC77C\uAD04 \uC0AD\uC81C \uCC98\uB9AC \uC2DC\uC791: ${type}, \uC0AD\uC81C\uD560 ID \uAC1C\uC218: ${ids.length}, IDs:`, ids);
      let successCount = 0;
      switch (type) {
        case "properties":
          for (const id of ids) {
            const result = await storage.deleteProperty(id);
            if (result) successCount++;
          }
          memoryCache.deleteByPrefix("properties_");
          break;
        case "news":
          for (const id of ids) {
            const result = await storage.deleteNews(id);
            if (result) successCount++;
          }
          memoryCache.deleteByPrefix("news_");
          break;
        case "users":
          const filteredIds = ids.filter((id) => id !== user.id);
          if (filteredIds.length !== ids.length) {
            console.log("\uC0AC\uC6A9\uC790\uAC00 \uC790\uAE30 \uC790\uC2E0\uC744 \uC0AD\uC81C\uD558\uB824\uACE0 \uC2DC\uB3C4\uD588\uC2B5\uB2C8\uB2E4.");
          }
          for (const id of filteredIds) {
            const userToDelete = await storage.getUser(id);
            if (userToDelete && userToDelete.role !== "admin") {
              const result = await storage.deleteUser(id);
              if (result) successCount++;
            }
          }
          break;
        default:
          return res.status(400).json({ message: "\uC9C0\uC6D0\uB418\uC9C0 \uC54A\uB294 \uC720\uD615\uC785\uB2C8\uB2E4." });
      }
      res.json({
        success: true,
        message: `${successCount}\uAC1C\uC758 \uD56D\uBAA9\uC774 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
        deletedCount: successCount,
        skippedSelf: type === "users" && ids.includes(user.id)
      });
    } catch (error) {
      console.error("\uC77C\uAD04 \uC0AD\uC81C \uC624\uB958:", error);
      res.status(500).json({ message: "\uC77C\uAD04 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.get("/api/banners", async (req, res) => {
    try {
      const location = req.query.location;
      const banners = await storage.getBanners(location);
      res.json(banners);
    } catch (error) {
      console.error("\uBC30\uB108 \uC870\uD68C \uC624\uB958:", error);
      res.status(500).json({ message: "\uBC30\uB108\uB97C \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/banners", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const parsed = insertBannerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "\uC798\uBABB\uB41C \uB370\uC774\uD130\uC785\uB2C8\uB2E4.", errors: parsed.error });
      }
      const banner = await storage.createBanner(parsed.data);
      res.status(201).json(banner);
    } catch (error) {
      console.error("\uBC30\uB108 \uC0DD\uC131 \uC624\uB958:", error);
      res.status(500).json({ message: "\uBC30\uB108 \uC0DD\uC131 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.put("/api/banners/order", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "\uC798\uBABB\uB41C \uB370\uC774\uD130 \uD615\uC2DD\uC785\uB2C8\uB2E4." });
      }
      for (const item of items) {
        if (item.id && typeof item.displayOrder === "number") {
          await storage.updateBannerOrder(item.id, item.displayOrder);
        }
      }
      res.json({ message: "\uBC30\uB108 \uC21C\uC11C\uAC00 \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
    } catch (error) {
      console.error("\uBC30\uB108 \uC21C\uC11C \uBCC0\uACBD \uC624\uB958:", error);
      res.status(500).json({ message: "\uBC30\uB108 \uC21C\uC11C \uBCC0\uACBD \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "\uD30C\uC77C\uC774 \uC5C5\uB85C\uB4DC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." });
      }
      const originalPath = req.file.path;
      const filename = req.file.filename;
      console.log(`[Upload DEBUG] File: ${filename}, Type: ${req.file.mimetype}, Size: ${req.file.size}`);
      if (req.file.mimetype.startsWith("image/")) {
        const tempPath = path4.join(uploadDir, `temp_${filename}`);
        try {
          const image = await Jimp.read(originalPath);
          const currentWidth = image.bitmap.width;
          console.log(`[Upload] Width: ${currentWidth}px`);
          if (currentWidth > 400) {
            console.log(`[Upload] Resizing from ${currentWidth}px to 400px`);
            await image.resize({ w: 400 });
            const resizedBuffer = await image.getBuffer(req.file.mimetype);
            console.log(`[Upload] Resized buffer size: ${resizedBuffer.length} bytes`);
            fs3.writeFileSync(tempPath, resizedBuffer);
            if (fs3.existsSync(originalPath)) {
              fs3.unlinkSync(originalPath);
            }
            fs3.renameSync(tempPath, originalPath);
            console.log(`[Upload] \uC774\uBBF8\uC9C0 \uB9AC\uC0AC\uC774\uC9D5 \uC644\uB8CC(Jimp): ${filename}`);
          } else {
            console.log(`[Upload] \uC774\uBBF8\uC9C0 \uB9AC\uC0AC\uC774\uC9D5 \uC2A4\uD0B5(\uB108\uBE44 ${currentWidth}px): ${filename}`);
          }
        } catch (resizeError) {
          console.error(`[Upload] \uC774\uBBF8\uC9C0 \uB9AC\uC0AC\uC774\uC9D5 \uC2E4\uD328 (\uC6D0\uBCF8 \uC720\uC9C0):`, resizeError);
          if (fs3.existsSync(tempPath)) {
            fs3.unlinkSync(tempPath);
          }
        }
      } else {
        console.log(`[Upload] Not an image, skipping resize. Mimetype: ${req.file.mimetype}`);
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("\uD30C\uC77C \uC5C5\uB85C\uB4DC \uC624\uB958:", error);
      res.status(500).json({ message: "\uD30C\uC77C \uC5C5\uB85C\uB4DC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.delete("/api/banners/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const id = parseInt(req.params.id);
      const success = await storage.deleteBanner(id);
      if (success) {
        res.json({ message: "\uBC30\uB108\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
      } else {
        res.status(404).json({ message: "\uBC30\uB108\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
    } catch (error) {
      console.error("\uBC30\uB108 \uC0AD\uC81C \uC624\uB958:", error);
      res.status(500).json({ message: "\uBC30\uB108 \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/admin/check-sheet-duplicates", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const { spreadsheetId, ranges, filterDate } = req.body;
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: "\uC11C\uBC84\uC5D0 Google API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." });
      }
      if (!spreadsheetId || !filterDate) {
        return res.status(400).json({ success: false, error: "\uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8 ID\uC640 \uB0A0\uC9DC\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." });
      }
      const sheetRanges = ranges || ["\uD1A0\uC9C0!A2:BA", "\uC8FC\uD0DD!A2:BA", "\uC544\uD30C\uD2B8\uC678!A2:BA", "\uC0C1\uAC00\uC678!A2:BA"];
      let allDuplicates = [];
      for (const range of sheetRanges) {
        try {
          const result = await checkDuplicatesFromSheet(spreadsheetId, apiKey, range, filterDate);
          if (result.success && result.duplicates) {
            const sheetName = range.split("!")[0];
            allDuplicates = [...allDuplicates, ...result.duplicates.map((d) => ({ ...d, sheetName }))];
          }
        } catch (sheetError) {
          log(`\uC2DC\uD2B8 ${range} \uC911\uBCF5 \uD655\uC778 \uC911 \uC624\uB958 (\uBB34\uC2DC\uB428): ${sheetError}`, "warn");
        }
      }
      res.json({ success: true, duplicates: allDuplicates });
    } catch (error) {
      console.error("\uC911\uBCF5 \uD655\uC778 \uC624\uB958:", error);
      res.status(500).json({ success: false, error: "\uC911\uBCF5 \uD655\uC778 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  app2.post("/api/admin/import-from-sheet", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "\uC778\uC99D\uB418\uC9C0 \uC54A\uC740 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4." });
      }
      const user = req.user;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "\uAD00\uB9AC\uC790\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const { spreadsheetId, ranges, filterDate, skipAddresses } = req.body;
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: "\uC11C\uBC84\uC5D0 Google API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." });
      }
      if (!spreadsheetId) {
        return res.status(400).json({ message: "\uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8 ID\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." });
      }
      if (!filterDate) {
        return res.status(400).json({ success: false, error: "\uB0A0\uC9DC\uB97C \uBC18\uB4DC\uC2DC \uC120\uD0DD\uD574\uC8FC\uC138\uC694." });
      }
      log(`\uB370\uC774\uD130 \uAC00\uC838\uC624\uAE30 \uC2DC\uC791: \uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8=${spreadsheetId}, \uB0A0\uC9DC\uD544\uD130=${filterDate}, \uAC74\uB108\uB6F8 \uC8FC\uC18C: ${skipAddresses?.length || 0}\uAC1C`, "info");
      log(`\uC804\uB2EC\uBC1B\uC740 ranges \uD30C\uB77C\uBBF8\uD130: ${JSON.stringify(ranges)}`, "info");
      const sheetRanges = ranges || ["\uD1A0\uC9C0!A2:BA", "\uC8FC\uD0DD!A2:BA", "\uC544\uD30C\uD2B8\uC678!A2:BA", "\uC0C1\uAC00\uC678!A2:BA"];
      log(`\uCC98\uB9AC\uD560 \uC2DC\uD2B8 \uBAA9\uB85D: ${JSON.stringify(sheetRanges)}`, "info");
      let totalCount = 0;
      let allImportedIds = [];
      let allErrors = [];
      const addressesToSkip = skipAddresses || [];
      for (const range of sheetRanges) {
        try {
          log(`\uC2DC\uD2B8 \uCC98\uB9AC \uC2DC\uC791: ${range}`, "info");
          const result = await importPropertiesFromSheet(spreadsheetId, apiKey, range, filterDate, addressesToSkip);
          log(`\uC2DC\uD2B8 \uCC98\uB9AC \uC644\uB8CC: ${range}, \uC131\uACF5=${result.success}, \uAC1C\uC218=${result.count || 0}`, "info");
          if (result.success && result.count) {
            totalCount += result.count;
            if (result.importedIds) {
              allImportedIds = [...allImportedIds, ...result.importedIds];
            }
          }
          if (result.error) {
            log(`\uC2DC\uD2B8 \uC624\uB958 \uBC1C\uC0DD: ${range}: ${result.error}`, "warn");
            allErrors.push(`${range}: ${result.error}`);
          }
        } catch (sheetError) {
          const errorMessage = sheetError?.message || String(sheetError);
          log(`\uC2DC\uD2B8 ${range} \uCC98\uB9AC \uC911 \uC608\uC678 \uBC1C\uC0DD: ${errorMessage}`, "error");
          allErrors.push(`${range}: ${errorMessage}`);
        }
      }
      res.json({
        success: true,
        count: totalCount,
        importedIds: allImportedIds,
        error: allErrors.length > 0 ? allErrors.join("; ") : void 0
      });
    } catch (error) {
      console.error("\uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8 \uB370\uC774\uD130 \uAC00\uC838\uC624\uAE30 \uC624\uB958:", error);
      res.status(500).json({ success: false, error: "\uB370\uC774\uD130 \uAC00\uC838\uC624\uAE30 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
    }
  });
  setupNewsScheduler();
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
init_seeder();
var app = express3();
app.use("/uploads", express3.static(path5.join(process.cwd(), "public/uploads")));
app.use(express3.json({ limit: "10mb" }));
app.use(express3.urlencoded({ limit: "10mb", extended: true }));
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    log(`serving on port ${port}`);
    setupNewsScheduler();
    seedInitialData().catch(console.error);
  });
})();
