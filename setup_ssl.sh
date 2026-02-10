#!/bin/bash

# 1. Install Nginx and Certbot (if not installed)
echo "Updating package list..."
apt-get update
echo "Installing Nginx and Certbot..."
apt-get install -y nginx certbot python3-certbot-nginx

# 2. Configure Nginx for leegyver.com
echo "Configuring Nginx..."
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
        
        # Real IP / Security Headers
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Upload Limit
    client_max_body_size 10M;
}
EOF

# 3. Enable Site and Remove Default
ln -sf /etc/nginx/sites-available/leegyver.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 4. Test and Reload Nginx
nginx -t && systemctl reload nginx

# 5. Run Certbot (Interactive Mode)
echo "Starting SSL Certificate Installation..."
echo "You will be asked to enter your email and agree to terms."
certbot --nginx -d leegyver.com -d www.leegyver.com
