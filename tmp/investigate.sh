#!/bin/bash
echo "=== GIT INIT DATE ==="
stat /root/land/.git/HEAD 2>/dev/null | head -3

echo "=== FIRST GIT COMMIT ==="
cd /root/land
git log --reverse --oneline --format='%h %ai %s' -5 2>/dev/null

echo "=== OLD FILES (before Mar 14, not in node_modules/dist) ==="
find /root/land/server /root/land/client/src /root/land/shared -name '*.ts' -o -name '*.tsx' 2>/dev/null | while read f; do
  mod=$(date -r "$f" '+%Y-%m-%d %H:%M')
  echo "$mod $f"
done | sort | head -40

echo "=== SCRIPTS DIR ==="
ls -la /root/land/scripts/ 2>/dev/null

echo "=== DRIZZLE CONFIG ==="
cat /root/land/drizzle.config.ts 2>/dev/null

echo "=== DB.TS content ==="
head -30 /root/land/server/db.ts 2>/dev/null

echo "=== OLD STORAGE ==="
find /root/land -maxdepth 2 -name 'storage*.ts' 2>/dev/null | while read f; do
  echo "--- $f ---"
  head -5 "$f"
done
