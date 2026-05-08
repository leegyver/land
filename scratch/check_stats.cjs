const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

function getStats() {
  const todayVisitors = db.prepare(`
    SELECT COUNT(DISTINCT ip) as count 
    FROM visit_logs 
    WHERE date(createdAt) = date('now')
  `).get();

  const totalVisitors = db.prepare(`
    SELECT COUNT(DISTINCT ip) as count 
    FROM visit_logs
  `).get();

  const totalProperties = db.prepare(`
    SELECT COUNT(*) as count FROM properties
  `).get();

  const totalInquiries = db.prepare(`
    SELECT COUNT(*) as count FROM inquiries
  `).get();

  const todaySignups = db.prepare(`
    SELECT COUNT(*) as count FROM users 
    WHERE date(createdAt) = date('now')
  `).get();

  const totalUsers = db.prepare(`
    SELECT COUNT(*) as count FROM users
  `).get();

  const realtorCount = db.prepare(`
    SELECT COUNT(*) as count FROM users WHERE role = 'realtor'
  `).get();

  const normalUserCount = db.prepare(`
    SELECT COUNT(*) as count FROM users WHERE role = 'user'
  `).get();

  // Try property_inquiries as well
  const propertyInquiries = db.prepare(`
    SELECT COUNT(*) as count FROM property_inquiries
  `).get();

  const unreadInquiries = db.prepare(`
    SELECT COUNT(*) as count FROM property_inquiries WHERE isReadByAdmin = 0
  `).get();

  const totalNewsletters = db.prepare(`
    SELECT COUNT(*) as count FROM newsletter_subscriptions
  `).get();

  return {
    todayVisitors,
    totalVisitors,
    totalProperties,
    totalInquiries,
    todaySignups,
    totalUsers,
    realtorCount,
    normalUserCount,
    propertyInquiries,
    unreadInquiries,
    totalNewsletters
  };
}

console.log(JSON.stringify(getStats(), null, 2));
db.close();
