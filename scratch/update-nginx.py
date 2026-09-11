import re

path = "/etc/nginx/sites-available/leegyver.com"
with open(path, "r") as f:
    content = f.read()

if "proxy_read_timeout" not in content:
    target = "proxy_set_header X-Forwarded-Proto $scheme;"
    replacement = "proxy_set_header X-Forwarded-Proto $scheme;\n        proxy_read_timeout 300s;\n        proxy_connect_timeout 300s;\n        proxy_send_timeout 300s;"
    content = content.replace(target, replacement)
    with open(path, "w") as f:
        f.write(content)
    print("Nginx config updated successfully.")
else:
    print("proxy_read_timeout already present.")
