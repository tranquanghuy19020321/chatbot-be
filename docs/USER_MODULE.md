# User Module - NestJS với TypeORM & MySQL

Module User hoàn chỉnh cho ứng dụng NestJS với TypeORM và MySQL database.

## Cấu trúc Module

```
src/users/
├── dto/
│   ├── create-user.dto.ts     # DTO tạo user
│   └── update-user.dto.ts     # DTO cập nhật user
├── entities/
│   └── user.entity.ts         # Entity User cho TypeORM
├── users.controller.ts        # Controller xử lý HTTP requests
├── users.service.ts           # Service chứa business logic
├── users.module.ts            # Module configuration
├── users.controller.spec.ts   # Test file cho controller
└── users.service.spec.ts      # Test file cho service
```

## Cấu hình Database

### 1. Cấu hình Environment Variables

Tạo file `.env` với nội dung:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=password
DATABASE_NAME=nestjs_users
NODE_ENV=development
```

### 2. Tạo Database

Tạo database MySQL:

```sql
CREATE DATABASE nestjs_users;
```

## API Endpoints

### Users Controller

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/users` | Tạo user mới |
| GET | `/users` | Lấy danh sách tất cả users |
| GET | `/users/:id` | Lấy thông tin user theo ID |
| PATCH | `/users/:id` | Cập nhật user |
| DELETE | `/users/:id` | Xóa user hoàn toàn |
| PATCH | `/users/:id/soft-delete` | Soft delete (đặt isActive = false) |

### Request/Response Examples

#### Tạo User Mới
```http
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "Nguyen Van A",
  "password": "password123",
  "phone": "0123456789"
}
```

#### Response
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Nguyen Van A",
  "phone": "0123456789",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Features

### User Entity
- **id**: Primary key, auto increment
- **email**: Unique email address
- **name**: Tên người dùng
- **password**: Mật khẩu được hash bằng bcrypt
- **phone**: Số điện thoại (optional)
- **isActive**: Trạng thái active/inactive
- **createdAt**: Thời gian tạo
- **updatedAt**: Thời gian cập nhật

### Validation
- Email phải đúng định dạng và unique
- Password tối thiểu 6 ký tự
- Name không được để trống
- Phone là optional

### Security
- Password được hash bằng bcrypt với salt rounds = 10
- Không trả về password trong response

### Error Handling
- ConflictException khi email đã tồn tại
- NotFoundException khi không tìm thấy user
- Validation errors cho dữ liệu không hợp lệ

## Chạy ứng dụng

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Khởi động MySQL server
Đảm bảo MySQL server đang chạy và database đã được tạo

### 3. Chạy ứng dụng
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

### 4. Test API
Sử dụng Postman hoặc curl để test các API endpoints:

```bash
# Tạo user mới
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123"}'

# Lấy danh sách users
curl http://localhost:3000/users

# Lấy user theo ID
curl http://localhost:3000/users/1
```

## Testing

Chạy unit tests:

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## Dependencies đã cài đặt

- `@nestjs/typeorm`: TypeORM integration cho NestJS
- `typeorm`: ORM cho TypeScript/JavaScript
- `mysql2`: MySQL client cho Node.js
- `class-validator`: Validation decorators
- `class-transformer`: Object transformation
- `@nestjs/mapped-types`: Utility types cho DTOs
- `bcrypt`: Password hashing
- `@nestjs/config`: Configuration management

## Lưu ý quan trọng

1. **Database Synchronize**: Trong production, nên tắt `synchronize: false` và sử dụng migrations
2. **Environment Variables**: Luôn sử dụng environment variables cho database credentials
3. **Password Security**: Password luôn được hash trước khi lưu database
4. **Validation**: Sử dụng class-validator để validate input data
5. **Error Handling**: Xử lý đầy đủ các exception cases