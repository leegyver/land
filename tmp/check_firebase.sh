#!/bin/bash
echo "=== FIREBASE KEY ==="
cat /root/land/firebase-key.json 2>/dev/null | head -5

echo "=== FIRESTORE SCRIPTS ==="
find /root/land -name '*firebase*' -o -name '*firestore*' 2>/dev/null | grep -v node_modules | grep -v '.git'

echo "=== MIGRATE SCRIPT ==="
cat /root/land/scripts/migrate-firebase-to-sqlite.ts 2>/dev/null | head -50

echo "=== STORAGE_REMOTE_9AM ==="
wc -l /root/land/server/storage_remote_9am.ts 2>/dev/null
head -50 /root/land/server/storage_remote_9am.ts 2>/dev/null

echo "=== ALL BACKUPS WITH DATES ==="
find /root/land -maxdepth 1 -name '*bak*' -o -name '*backup*' -o -name '*old*' -o -name '*_save*' 2>/dev/null | while read f; do
  echo "$(stat -c '%y' "$f" | cut -d. -f1) $(stat -c '%s' "$f") $f"
done | sort

echo "=== CHECK FOR DELETED FILES (recovery attempt) ==="
ls -la /root/land/database.sqlite* 2>/dev/null
