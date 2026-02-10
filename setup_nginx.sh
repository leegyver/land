#!/bin/bash
# leegyver.com Nginx Configuration

# 1. Create Config File
echo "Creating Nginx config for leegyver.com..."
cat > /etc/nginx/sites-available/leegyver.com <<EOF
server {
    listen 80;
    server_name leegyver.com www.leegyver.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 2. Enable Site
echo "Enabling site..."
ln -sf /etc/nginx/sites-available/leegyver.com /etc/nginx/sites-enabled/

# 3. Validating and Restarting Nginx
echo "Checking Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Configuration valid. Restarting Nginx..."
    systemctl restart nginx
    echo "SUCCESS: leegyver.com is now configured!"
else
    echo "ERROR: Nginx configuration failed!"
    exit 1
fi
