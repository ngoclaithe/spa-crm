#!/usr/bin/env bash
# Chạy sau khi nginx -t OK và cả 2 site http đã mở được từ internet.
# Yêu cầu: DNS spacrm.dosutech.site & api-spa.dosutech.site trỏ A về IP máy này.
# Cài: sudo apt install certbot python3-certbot-nginx
#
# Một lệnh xin cả 2 tên, certbot tự sửa block listen 443 + redirect http→https (nếu cấu hình).

set -e
sudo certbot --nginx -d spacrm.dosutech.site -d api-spa.dosutech.site

# Gia hạn: certbot renew (thường lên cron sẵn)
# sudo certbot renew --dry-run
