#!/bin/bash
echo "=== storage_remote_9am.ts (first 30 lines) ==="
head -30 /root/land/server/storage_remote_9am.ts 2>/dev/null

echo "=== db.ts ==="
cat /root/land/server/db.ts 2>/dev/null

echo "=== drizzle.config.ts ==="
cat /root/land/drizzle.config.ts 2>/dev/null

echo "=== scripts dir ==="
ls -la /root/land/scripts/ 2>/dev/null

echo "=== auth-page.tsx first 20 ==="
head -20 /root/land/client/src/pages/auth-page.tsx 2>/dev/null

echo "=== schema.ts first 30 ==="
head -30 /root/land/shared/schema.ts 2>/dev/null

echo "=== .env_prebuild_bak ==="
cat /root/land/.env_prebuild_bak 2>/dev/null

echo "=== FILES FROM MAR 13 ==="
find /root/land -maxdepth 4 -newer /root/land/package-lock.json ! -newer /root/land/database.sqlite_final_bak.sqlite -name '*.ts' -o -name '*.tsx' 2>/dev/null | grep -v node_modules | grep -v .git | sort
