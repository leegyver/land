import Database from 'better-sqlite3';

const db = new Database('database.sqlite');
console.log('properties count:', db.prepare('SELECT count(*) as c FROM properties').get());
console.log('crawled_properties count:', db.prepare('SELECT count(*) as c FROM crawled_properties').get());
console.log('news count:', db.prepare('SELECT count(*) as c FROM news').get());
console.log('posts count:', db.prepare('SELECT count(*) as c FROM posts').get());
