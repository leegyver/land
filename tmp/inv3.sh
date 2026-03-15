#!/bin/bash
echo "=== RECOVERED DIR ==="
ls -la /root/land/recovered/ 2>/dev/null

echo "=== RECOVERED CLIENT ==="
find /root/land/recovered -name '*.ts' -o -name '*.tsx' 2>/dev/null | head -30

echo "=== RECOVERED SERVER ==="
find /root/land/recovered -name '*.ts' 2>/dev/null | grep server | head -20

echo "=== MAIN.V2.TSX ==="
head -10 /root/land/client/src/main.v2.tsx 2>/dev/null

echo "=== ADMIN-PAGE-V2 ==="
head -20 /root/land/client/src/pages/admin-page-v2.tsx 2>/dev/null

echo "=== AUTH PAGE (current) first 30 ==="
head -30 /root/land/client/src/pages/auth-page.tsx 2>/dev/null

echo "=== SCRIPTS DIR ==="
ls -la /root/land/scripts/ 2>/dev/null
find /root/land/scripts -name '*.ts' -o -name '*.js' 2>/dev/null

echo "=== MIGRATE SCRIPT ==="
head -20 /root/land/scripts/migrate-firebase-to-sqlite.ts 2>/dev/null
