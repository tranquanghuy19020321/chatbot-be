# Refresh Token Implementation

## Tổng quan

Hệ thống authentication đã được nâng cấp với refresh token để cải thiện bảo mật và trải nghiệm người dùng.

## Cách hoạt động

### 1. Access Token và Refresh Token

- **Access Token**: Token có thời hạn ngắn (1 giờ) dùng để xác thực các request
- **Refresh Token**: Token có thời hạn dài (7 ngày) dùng để lấy access token mới

### 2. Flow Authentication

```
1. User Login
   ├── POST /auth/login
   ├── Validate credentials
   └── Return: { access_token, refresh_token, user_info }

2. Access Protected Resources
   ├── GET /users (with Bearer token)
   └── Return: Protected data

3. Access Token Expired
   ├── POST /auth/refresh
   ├── Send: { refresh_token }
   └── Return: { new_access_token, new_refresh_token }

4. Logout
   ├── POST /auth/logout (with Bearer token)
   └── Clear refresh token from database
```

## API Endpoints

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "refresh_token": "eyJhbGciOiJIUzI1...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### Refresh Token
```bash
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1..."
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "refresh_token": "eyJhbGciOiJIUzI1...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### Logout
```bash
POST /auth/logout
Authorization: Bearer <access_token>

Response:
{
  "message": "Đăng xuất thành công"
}
```

## Security Features

### 1. Token Storage
- Refresh tokens được hash (bcrypt) trước khi lưu vào database
- Chỉ lưu hash, không lưu plain text

### 2. Token Validation
- Verify JWT signature
- Check token expiration
- Compare hashed refresh token with database
- Validate user status (isActive)

### 3. Token Rotation
- Mỗi lần refresh, cả access token và refresh token đều được tạo mới
- Refresh token cũ bị vô hiệu hóa sau khi sử dụng

### 4. Logout
- Xóa refresh token khỏi database
- Ngăn chặn việc sử dụng token sau khi logout

## Environment Variables

Thêm vào file `.env`:

```env
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
```

**Lưu ý**: Sử dụng các secret key mạnh và khác nhau cho production.

## Database Schema

### User Entity - Thêm trường mới:

```typescript
@Column({ nullable: true })
refreshToken: string; // Hashed refresh token
```

## Testing

Chạy script test:

```bash
chmod +x test-auth.sh
./test-auth.sh
```

Script sẽ test:
1. Create user
2. Login
3. Refresh token
4. Wrong password
5. Get profile
6. Get users list
7. Access without token
8. Logout

## Best Practices

### Client Side Implementation

```javascript
// Lưu tokens
localStorage.setItem('access_token', response.access_token);
localStorage.setItem('refresh_token', response.refresh_token);

// Interceptor cho API calls
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      try {
        const response = await axios.post('/auth/refresh', {
          refresh_token: refreshToken
        });
        
        // Update tokens
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        
        // Retry original request
        error.config.headers['Authorization'] = `Bearer ${response.data.access_token}`;
        return axios.request(error.config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## Security Considerations

1. **HTTPS Only**: Luôn sử dụng HTTPS trong production
2. **Secure Storage**: 
   - Web: HttpOnly cookies (recommended) hoặc localStorage
   - Mobile: Secure storage (Keychain/Keystore)
3. **Token Expiration**: Điều chỉnh thời gian hết hạn phù hợp với use case
4. **Rate Limiting**: Implement rate limiting cho refresh endpoint
5. **Token Blacklist**: Consider implementing token blacklist cho logout ngay lập tức

## Migration

Nếu cần chạy migration thủ công:

```bash
npm run typeorm migration:run
```

Hoặc database sẽ tự động sync trong development mode.

## Troubleshooting

### Token không hợp lệ
- Kiểm tra JWT_SECRET và JWT_REFRESH_SECRET
- Verify token chưa hết hạn
- Check user isActive = true

### Refresh token failed
- Verify refresh token chưa bị xóa (logout)
- Check token được lưu đúng trong database
- Confirm token signature hợp lệ

## Future Improvements

1. **Token Blacklist**: Redis-based token blacklist
2. **Multiple Devices**: Support multiple refresh tokens per user
3. **Device Tracking**: Track which devices are logged in
4. **Token Revocation**: API để revoke specific tokens
5. **Refresh Token Family**: Implement refresh token family for better security
