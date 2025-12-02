# JWT Authentication Documentation

## Overview
Hệ thống JWT Authentication đã được tích hợp vào NestJS application với các tính năng:
- Login endpoint trả về JWT token
- JWT Bearer authentication cho tất cả protected routes
- Public decorator để bỏ qua authentication cho các routes cụ thể

## API Endpoints

### 1. Authentication Endpoints

#### POST /auth/login
Login và nhận JWT token.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "name": "John Doe"
  }
}
```

#### GET /auth/profile
Lấy thông tin user hiện tại (yêu cầu authentication).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "message": "Thông tin người dùng hiện tại",
  "data": {
    "userId": 1,
    "email": "john.doe@example.com",
    "name": "John Doe"
  }
}
```

### 2. User Endpoints

#### POST /users (Public - Register)
Tạo user mới (không cần authentication).

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "password123",
  "phone": "+84901234567"
}
```

#### GET /users (Protected)
Lấy danh sách users (yêu cầu authentication).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

#### GET /users/:id (Protected)
Lấy thông tin user theo ID (yêu cầu authentication).

#### PATCH /users/:id (Protected)
Cập nhật user (yêu cầu authentication).

#### DELETE /users/:id (Protected)
Xóa user (yêu cầu authentication).

## Usage Examples

### 1. Register User
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123",
    "phone": "+84901234567"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Access Protected Route
```bash
# Sử dụng token nhận được từ login
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Get Current User Profile
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Configuration

### Environment Variables (.env)
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
```

**Quan trọng:** Thay đổi `JWT_SECRET` trong production!

## Implementation Details

### Files Structure
```
src/
├── auth/
│   ├── auth.controller.ts       # Login và profile endpoints
│   ├── auth.service.ts          # Authentication logic
│   ├── auth.module.ts           # Auth module configuration
│   ├── decorators/
│   │   ├── public.decorator.ts   # @Public() decorator
│   │   └── current-user.decorator.ts  # @CurrentUser() decorator
│   ├── dto/
│   │   ├── login.dto.ts         # Login request DTO
│   │   └── auth-response.dto.ts # Login response DTO
│   ├── guards/
│   │   └── jwt-auth.guard.ts    # JWT authentication guard
│   └── strategies/
│       └── jwt.strategy.ts      # JWT Passport strategy
```

### Guards

#### Global Protection
Để protect toàn bộ controller:
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  // All endpoints protected by default
}
```

#### Public Routes
Để một route cụ thể không cần authentication:
```typescript
@Public()
@Post()
async create() {
  // This endpoint is public
}
```

#### Get Current User
Để lấy thông tin user hiện tại trong controller:
```typescript
@Get('me')
async getMe(@CurrentUser() user: any) {
  return user; // { userId, email, name }
}
```

## Testing with Swagger

1. Khởi động server:
```bash
npm run start:dev
```

2. Truy cập Swagger UI:
```
http://localhost:3000/api
```

3. Test flow:
   - Gọi `POST /users` để tạo user mới
   - Gọi `POST /auth/login` để login và nhận token
   - Click nút "Authorize" ở góc trên bên phải
   - Nhập token (không cần thêm "Bearer " prefix)
   - Giờ có thể test tất cả protected endpoints

## Security Notes

1. **JWT Secret:** Luôn sử dụng secret key mạnh và giữ bí mật
2. **HTTPS:** Sử dụng HTTPS trong production để bảo vệ token
3. **Token Expiration:** Token mặc định hết hạn sau 1 giờ
4. **Password Hashing:** Passwords được hash bằng bcrypt với salt rounds = 10
5. **Token Storage:** Client nên lưu token trong httpOnly cookie hoặc secure storage

## Troubleshooting

### Error: "Không có quyền truy cập"
- Kiểm tra token có được gửi trong header Authorization không
- Kiểm tra format: `Authorization: Bearer <token>`
- Kiểm tra token còn hạn chưa

### Error: "Email hoặc mật khẩu không đúng"
- Kiểm tra email và password có đúng không
- Kiểm tra user có isActive = true không

### Error: "Token không hợp lệ"
- Token có thể đã hết hạn
- Token có thể bị thay đổi
- JWT_SECRET có thể đã thay đổi
