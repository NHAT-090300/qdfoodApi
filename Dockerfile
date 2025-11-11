# Dockerfile
FROM node:20-alpine

# cài certs + công cụ nhỏ (curl nếu cần)
RUN apk add --no-cache ca-certificates \
    && update-ca-certificates \
    && apk add --no-cache bash

WORKDIR /home/app

COPY package.json yarn.lock ./
# Cài node_modules (production) — nếu bạn cần devDeps để build, có thể tách build stage
RUN yarn install --frozen-lockfile --production=false

COPY . .

# (TÙY CHỌN) nếu bạn có test-mail.js để debug, hãy đảm bảo nó được copy vào /home/app
# COPY test-mail.js /home/app/test-mail.js

RUN yarn build

ENV NODE_ENV=production
EXPOSE 8000

CMD ["yarn", "start"]
