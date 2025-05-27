FROM node:20-alpine

WORKDIR /home/app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# Copy file env.production thành .env bên trong container
COPY .env.production .env

RUN yarn build

EXPOSE 8000
CMD ["yarn", "start"]
