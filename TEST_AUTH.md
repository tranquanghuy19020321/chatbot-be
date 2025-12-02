# Test JWT Authentication

## Khởi động Server
```bash
npm run start:dev
```

Server sẽ chạy tại: http://localhost:3000
Swagger UI: http://localhost:3000/api

## Test Flow với curl

### 1. Tạo User Mới (Register)
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

**Response:**
```json
{
  "id": 1,
  "email": "test@example.com",
  "name": "Test User",
  "phone": "+84901234567",
  "isActive": true,
  "createdAt": "2025-12-02T03:12:00.000Z",
  "updatedAt": "2025-12-02T03:12:00.000Z"
}
```

### 2. Login và Nhận JWT Token
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IFVzZXIiLCJpYXQiOjE3MzMxMTM5MjAsImV4cCI6MTczMzExNzUyMH0.xyz...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### 3. Truy Cập Protected Routes với Token

#### Get User Profile
```bash
# Thay YOUR_TOKEN bằng access_token nhận được từ bước 2
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Thông tin người dùng hiện tại",
  "data": {
    "userId": 1,
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

#### Get All Users (Protected)
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get User by ID (Protected)
```bash
curl -X GET http://localhost:3000/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update User (Protected)
```bash
curl -X PATCH http://localhost:3000/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "phone": "+84987654321"
  }'
```

### 4. Test Error Cases

#### Login với Wrong Password
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }'
```

**Response (401):**
```json
{
  "message": "Email hoặc mật khẩu không đúng",
  "error": "Unauthorized",
  "statusCode": 401
}
```

#### Access Protected Route Without Token
```bash
curl -X GET http://localhost:3000/users
```

**Response (401):**
```json
{
  "message": "Không có quyền truy cập",
  "error": "Unauthorized",
  "statusCode": 401
}
```

#### Access Protected Route với Invalid Token
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer invalid-token"
```

**Response (401):**
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

## Test với Swagger UI

1. Truy cập http://localhost:3000/api
2. Tạo user mới qua **POST /users**
3. Login qua **POST /auth/login** để nhận token
4. Click nút **"Authorize"** ở góc trên bên phải
5. Nhập token (không cần thêm "Bearer " prefix)
6. Click **"Authorize"** rồi **"Close"**
7. Bây giờ có thể test tất cả protected endpoints

## Quick Test Script

Tạo file `test-auth.sh`:
```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "1. Creating user..."
curl -X POST $BASE_URL/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123",
    "phone": "+84901234567"
  }'

echo -e "\n\n2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo $LOGIN_RESPONSE

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo -e "\n\n3. Getting profile with token..."
curl -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n4. Getting all users with token..."
curl -X GET $BASE_URL/users \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\nDone!"
```

Chạy script:
```bash
chmod +x test-auth.sh
./test-auth.sh
```

## Kiểm Tra Database

```sql
-- Xem users trong database
SELECT id, email, name, phone, isActive, createdAt 
FROM users;

-- Xem password hash
SELECT id, email, LEFT(password, 20) as password_hash 
FROM users;
```

## Notes

- Token mặc định hết hạn sau 1 giờ
- Password được hash bằng bcrypt với salt rounds = 10
- POST /users (register) là public, không cần authentication
- Tất cả endpoints khác yêu cầu JWT token trong header Authorization
- Token format: `Authorization: Bearer <token>`
