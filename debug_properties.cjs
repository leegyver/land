
const { db } = require('./server/db');
const { properties } = require('./shared/schema');
const { count, eq } = require('drizzle-orm');

async function checkProperties() {
  try {
    const totalCount = await db.select({ count: count() }).from(properties);
    console.log(`Total properties: ${totalCount[0].count}`);

    const visibleCount = await db.select({ count: count() }).from(properties).where(eq(properties.isVisible, true));
    console.log(`Visible properties: ${visibleCount[0].count}`);

    const featuredCount = await db.select({ count: count() }).from(properties).where(eq(properties.featured, true));
    console.log(`Featured properties: ${featuredCount[0].count}`);

    const urgentCount = await db.select({ count: count() }).from(properties).where(eq(properties.isUrgent, true));
    console.log(`Urgent properties (flag): ${urgentCount[0].count}`);

    const soldCount = await db.select({ count: count() }).from(properties).where(eq(properties.isSold, true));
    console.log(`Sold properties: ${soldCount[0].count}`);

    const samples = await db.select({
      id: properties.id,
      title: properties.title,
      isVisible: properties.isVisible,
      featured: properties.featured,
      isUrgent: properties.isUrgent,
      isSold: properties.isSold
    }).from(properties).limit(10);
    
    console.log('\nSample Properties:');
    console.table(samples);
  } catch (err) {
    console.error(err);
  }
}

checkProperties();
