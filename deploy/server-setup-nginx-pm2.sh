#!/usr/bin/env bash
# Chạy trên server (Ubuntu/Debian), tài khoản có sudo.
# Đặt thư mục gốc monorepo (có thư mục deploy/, backend/, ui/):
#   export REPO=/home/spa-crm
#   hoặc sửa dòng dưới thành đúng path của bạn.
#
# 1) Copy cấu hình nginx → sites-available, symlink → sites-enabled
# 2) Gợi ý: build backend + chạy PM2 (từ dist/main.js — mặc định nest build)

set -euo pipefail

REPO="${REPO:-/home/spa-crm}"

# --- Nginx: copy + bật site
sudo cp -v "${REPO}/deploy/nginx/spacrm.dosutech.site.conf" /etc/nginx/sites-available/
sudo cp -v "${REPO}/deploy/nginx/api-spa.dosutech.site.conf" /etc/nginx/sites-available/

# Trỏ (symlink) vào sites-enabled
sudo ln -sfn /etc/nginx/sites-available/spacrm.dosutech.site.conf /etc/nginx/sites-enabled/spacrm.dosutech.site.conf
sudo ln -sfn /etc/nginx/sites-available/api-spa.dosutech.site.conf /etc/nginx/sites-enabled/api-spa.dosutech.site.conf

# Kiểm tra cú pháp rồi nạp lại
sudo nginx -t
sudo systemctl reload nginx
echo "Nginx: OK (FE root=/home/.../ui/dist, API proxy 127.0.0.1:3010)"

# --- PM2: backend (chạy từ thư mục backend để đọc .env, Prisma, v.v.)
cd "${REPO}/backend"

# Một lần: cài phụ thuộc, generate Prisma, build
# npm ci
# npx prisma generate
# npm run build
#
# Xác nhận file entry (mặc định nest: dist/main.js — KHÔNG phải dist/src/main.js)
#   ls -la dist/main.js

# Entry sau nest build: thường là dist/main.js (đúng với package.json "start:prod": node dist/main)
if [[ -f dist/main.js ]]; then
  ENTRY=dist/main.js
elif [[ -f dist/src/main.js ]]; then
  ENTRY=dist/src/main.js
  echo "Dùng dist/src/main.js (bản build đặc biệt)"
else
  echo "Chưa có file build. Chạy: cd ${REPO}/backend && npm ci && npx prisma generate && npm run build"
  exit 1
fi

# Xóa app cũ cùng tên nếu từng tạo (bỏ qua lỗi)
pm2 delete api-spa 2>/dev/null || true
pm2 start "$ENTRY" --name api-spa --cwd "${REPO}/backend"
pm2 save
echo "Xong: PM2. Chạy: pm2 logs api-spa  |  lần đầu: pm2 startup  (hệ thống in thêm 1 lệnh sudo, chạy theo hướng dẫn)" 
