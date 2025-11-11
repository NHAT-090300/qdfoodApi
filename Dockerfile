# Dockerfile
FROM node:20-alpine

# Cài đặt CA-Certificates và Bash (Bash là tùy chọn, nếu bạn cần shell linh hoạt)
# Tối ưu hóa: Không cần gọi update-ca-certificates trên Alpine; việc cài ca-certificates đã đủ.
RUN apk add --no-cache ca-certificates bash

WORKDIR /home/app

COPY package.json yarn.lock ./

# Cài đặt dependencies: Nếu bạn chạy 'yarn build', thường bạn cần devDependencies, nên dùng production=false
RUN yarn install --frozen-lockfile --production=false

COPY . .

# Bước BUILD
RUN yarn build

# BƯỚC KHẮC PHỤC LỖI GỬI MAIL (Quan trọng):
# Trong môi trường Docker, biến HOSTNAME của container được đặt tự động.
# Tuy nhiên, nếu bạn muốn đảm bảo, có thể cố định HOSTNAME trong cấu hình code JS 
# hoặc sử dụng hostname của container.

ENV NODE_ENV=production
EXPOSE 8000

# Khởi chạy ứng dụng
CMD ["yarn", "start"]