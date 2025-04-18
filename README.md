# QUANG DA FOOD

### I. Công nghệ sử dụng

1. Ngôn ngữ: JavaScript, TypeScript
2. Nền tảng: NodeJs (ExpressJs)
3. Database: MongoDB, Mongoose

### II. Cách chạy source code

1. Cài đặt thư viện

```
yarn install
```

2. Chạy source

   2.1 Môi trường development

   ```
   yarn dev
   ```

   2.2 Môi trường production

   ```
   yarn build && yarn start
   ```

### III. Biến môi trường

Tên file: .env

Đường dẫn: ./src/env/.env
Copy từ .env.example file vào .env

### IV. Mô tả các module

1. config

   1.1 Đường dẫn: `./src/config`

   1.2 Mô tả:

   Cấu hình thông tin cho database, enviroment

2. api

   1.1 Đường dẫn: `./src/api`

   1.2 Mô tả:

   Cấu hình thông tin cho các router trong service

3. app
   1.1 Đường dẫn: `./src/app`

   1.2 Mô tả:

   Viết những phần xử lý logic cho phần router

4. interface
   1.1 Đường dẫn: `./src/interface`

   1.2 Mô tả:

   Defind kiểu dữ liệu trong service

5. logger

   1.1 Đường dẫn: `./src/logger`

   1.2 Mô tả:

   Thực hiện xử lý cấu hình logger trong service

6. model

   1.1 Đường dẫn: `./src/model`

   1.2 Mô tả:

   Định nghĩa các đối tượng trong dự án

7. seedding

   1.1 Đường dẫn: `./src/seedding`

   1.2 Mô tả:

   Chứa các dữ liệu của service cần seeding trong db

8. server

   1.1 Đường dẫn: `./src/server`

   1.2 Mô tả:

   Cấu hình server cho service

9. service

   1.1 Đường dẫn: `./src/service`

   1.2 Mô tả:

   Chứa các function tương tác với các service bên thứ 3

10. store

    1.1 Đường dẫn: `./src/store`

    1.2 Mô tả:

    Chứa các function tương tác với mongodb

11. utils

    1.1 Đường dẫn: `./src/utils`

    1.2 Mô tả:

    Chứa các function, biến dùng thường xuyên trong dự án
