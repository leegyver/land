const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');
const { eq, desc, asc } = require('drizzle-orm');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// Define properties table matching schema.ts
const properties = sqliteTable("properties", {
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
  imageUrl: text("image_url").notNull(),
  imageUrls: text("image_urls"),
  featuredImageIndex: integer("featured_image_index"),
  agentId: integer("agent_id").notNull(),
  featured: integer("featured", { mode: 'boolean' }).default(false),
  displayOrder: integer("display_order").default(0),
  isVisible: integer("is_visible", { mode: 'boolean' }).default(true),
  createdAt: text("created_at"),
});

async function test() {
  try {
    console.log('Testing drizzle select...');
    const results = db.select()
      .from(properties)
      .where(eq(properties.isVisible, true))
      .orderBy(asc(properties.displayOrder), desc(properties.createdAt))
      .all();
    console.log('SUCCESS! Got', results.length, 'properties');
    if (results.length > 0) {
      console.log('First:', results[0].id, results[0].title);
    }
  } catch(e) {
    console.log('DRIZZLE ERROR:', e.message);
    console.log('STACK:', e.stack);
  }
  sqlite.close();
}
test();
