---
description: Pack, upload, rebuild and restart the application on the production server automatically.
---
// turbo-all
1. Pack the source files into update.tar.
```powershell
tar -cvf update.tar client/src server client/public client/index.html tailwind.config.ts vite.config.ts package.json package-lock.json tsconfig.json postcss.config.js shared
```

2. Upload the archive to the server.
```powershell
scp -i deploy_key -o StrictHostKeyChecking=no -P 22 "update.tar" root@1.234.53.82:/root/land/
```

3. Unpack and clean up on the server.
```powershell
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "tar -xvf /root/land/update.tar -C /root/land/ && rm /root/land/update.tar"
```

4. Build and restart the application.
```powershell
ssh -i deploy_key -o StrictHostKeyChecking=no -p 22 root@1.234.53.82 "cd land && npm run build && pm2 restart leegyver-v2"
```

5. Local cleanup.
```powershell
Remove-Item -Path update.tar -ErrorAction SilentlyContinue
```
