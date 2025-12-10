# User Role System

## Mô tả
Hệ thống đã được cập nhật để hỗ trợ 2 loại role:
- `user`: Người dùng thông thường (mặc định)
- `admin`: Quản trị viên

## Các thay đổi đã thực hiện

### 1. Entity User
- Thêm field `role` với enum `UserRole`
- Mặc định role là `USER`

### 2. Migration
- Tạo migration `AddRoleToUser1733840000000` để thêm column role vào database
- Tạo enum type trong PostgreSQL/MySQL

### 3. Authentication
- Cập nhật JWT payload để bao gồm role
- Cập nhật JWT strategy để trả về role trong user object

### 4. Authorization
- Tạo `@Roles()` decorator để kiểm tra quyền truy cập
- Tạo `RolesGuard` để thực thi kiểm tra role
- Ví dụ sử dụng trong `UsersController.findAll()` - chỉ admin mới xem được danh sách tất cả users

### 5. Admin User Creation
- Tạo script `create-admin.ts` để tạo admin user trực tiếp trong database
- Admin user mặc định:
  - Email: `admin@example.com`
  - Password: `admin123`
  - Role: `ADMIN`

## Cách sử dụng

### Tạo Admin User
```bash
npx ts-node create-admin.ts
```

### Bảo vệ endpoint chỉ cho admin
```typescript
@Get('admin-only')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
async adminOnlyEndpoint() {
  return { message: 'Only admin can access this' };
}
```

### Bảo vệ endpoint cho nhiều role
```typescript
@Get('user-and-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.ADMIN)
@ApiBearerAuth()
async userAndAdminEndpoint() {
  return { message: 'Both user and admin can access this' };
}
```

### Lấy thông tin user hiện tại (bao gồm role)
```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
async getProfile(@CurrentUser() user: any) {
  // user object sẽ chứa: { userId, email, name, role }
  return user;
}
```

## Lưu ý
- User thông thường được tạo qua API với role mặc định là `USER`
- Admin user chỉ được tạo trực tiếp trong database thông qua script
- Khi login, JWT token sẽ chứa thông tin role
- Sử dụng `@Roles()` decorator kết hợp với `RolesGuard` để bảo vệ endpoint