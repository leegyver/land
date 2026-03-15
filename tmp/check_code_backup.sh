#!/bin/bash
echo "=== 3/4 백업 소스코드 확인 ==="
tar -tzf /root/land/backup_server_20260304.tar.gz 2>/dev/null | grep -E '\.(tsx|ts)$' | grep -v node_modules | grep -v dist | grep -v .git | sort | head -60

echo ""
echo "=== 3/14 긴급 백업 소스코드 확인 ==="
tar -tzf /root/land/emergency_backup_20260314_1230.tar.gz 2>/dev/null | grep -E '\.(tsx|ts)$' | grep -v node_modules | grep -v dist | grep -v .git | sort | head -60

echo ""
echo "=== 3/4 백업 auth-page 존재? ==="
tar -tzf /root/land/backup_server_20260304.tar.gz 2>/dev/null | grep -i auth

echo ""
echo "=== 3/14 긴급 백업 auth-page 존재? ==="
tar -tzf /root/land/emergency_backup_20260314_1230.tar.gz 2>/dev/null | grep -i auth | head -10

echo ""
echo "=== 3/4 백업 pricing 확인 ==="
tar -tzf /root/land/backup_server_20260304.tar.gz 2>/dev/null | grep -i pricing
