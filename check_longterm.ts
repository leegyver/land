
import { db } from './server/db';

const count = db.prepare('SELECT COUNT(*) as count FROM properties WHERE isLongTerm = 1').get();
console.log('Long Term Count:', count);
