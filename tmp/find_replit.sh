#!/bin/bash
echo "=== REPLIT FILES ==="
find /root/land -name '.replit' -o -name 'replit.nix' -o -name '.replit.config' 2>/dev/null | grep -v node_modules

echo "=== DATABASE.SQLITE WISE BAK ==="
ls -la /root/land/database.sqlite_wise_bak.sqlite 2>/dev/null

echo "=== EXTRACT WISE BAK FROM BACKUP ==="
cd /tmp
tar -xzf /root/land/backup_server_20260304.tar.gz ./database.sqlite_wise_bak.sqlite ./database.sqlite 2>/dev/null
ls -la /tmp/database.sqlite* 2>/dev/null

echo "=== CHECK WISE BAK DB ==="
cd /root/land
node -e "
const db = require('better-sqlite3')('/root/land/database.sqlite_wise_bak.sqlite', {readonly:true});
const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all();
console.log('Tables:', tables.map(t=>t.name).join(', '));
try { const uc = db.prepare('SELECT COUNT(*) as c FROM users').get(); console.log('Users:', uc.c); } catch(e) { console.log('No users table'); }
try { const pc = db.prepare('SELECT COUNT(*) as c FROM properties').get(); console.log('Props:', pc.c); } catch(e) { console.log('No props table'); }
db.close();
" 2>/dev/null

echo "=== FIREBASE KEY CHECK ==="
ls -la /root/land/firebase-key.json 2>/dev/null
head -5 /root/land/firebase-key.json 2>/dev/null

echo "=== SEARCH FOR REPLIT/NEON URLS IN ALL FILES ==="
grep -r 'replit\|neon\.tech\|\.neon\.' /root/land/ --include='*.ts' --include='*.js' --include='*.tsx' 2>/dev/null | grep -v node_modules | grep -v '.git' | grep -v 'dist/' | head -15
