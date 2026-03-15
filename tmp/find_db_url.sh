#!/bin/bash
echo "=== SEARCH FOR DATABASE_URL EVERYWHERE ==="
# Check all env files
for f in /root/land/.env /root/land/.env_prebuild_bak /root/land/.env_final_bak /root/land/.env.local /root/land/.env.production; do
  echo "--- $f ---"
  grep -i 'DATABASE_URL\|neon\|postgres' "$f" 2>/dev/null || echo "(not found)"
done

echo "=== GIT HISTORY FOR DATABASE_URL ==="
cd /root/land
git log --all --oneline -p -- '.env*' 2>/dev/null | grep -i 'DATABASE_URL\|neon\|postgres' | head -10

echo "=== SEARCH IN ALL FILES ==="
grep -r 'neon.tech\|DATABASE_URL\|postgresql://' /root/land/ --include='*.ts' --include='*.js' --include='*.json' --include='*.env*' 2>/dev/null | grep -v node_modules | grep -v '.git' | head -20

echo "=== DRIZZLE CONFIG ==="
cat /root/land/drizzle.config.ts 2>/dev/null

echo "=== BACKUP TAR CONTENTS ==="
tar -tzf /root/land/backup_server_20260304.tar.gz 2>/dev/null | grep -iE 'env|database|drizzle|config' | head -20

echo "=== OLD BASH HISTORY FOR DATABASE_URL ==="
grep -i 'DATABASE_URL\|neon\|postgres' /root/.bash_history 2>/dev/null

echo "=== PM2 ENV ==="
cat /root/.pm2/dump.pm2 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*"' | head -5
cat /root/.pm2/dump.pm2.bak 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*"' | head -5
