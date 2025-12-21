# Admin Module

This module provides admin-only APIs for managing and viewing user data.

## Features

### Test Management APIs (Admin Only)

1. **GET /admin/users/:userId/tests** - Get all tests for a specific user
   - Query Parameters:
     - `page` (optional): Page number for pagination (default: 1)
     - `limit` (optional): Number of items per page (default: 10, max: 100)
   - Returns: Paginated list of tests for the specified user
   - Access: Admin role required

2. **GET /admin/users/:userId/tests/:testId** - Get detailed test information
   - Path Parameters:
     - `userId`: ID of the user who owns the test
     - `testId`: ID of the specific test to retrieve
   - Returns: Detailed test information including questions, selected options, and mental health evaluation
   - Access: Admin role required

## Security

- All endpoints require JWT authentication (`@UseGuards(JwtAuthGuard)`)
- All endpoints require admin role (`@Roles(UserRole.ADMIN)`)
- User existence is verified before retrieving tests
- Tests can only be accessed if they belong to the specified user

## Error Responses

- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: User does not have admin role
- `404 Not Found`: User or test not found

## Usage Example

```typescript
// Get tests for user ID 5 with pagination
GET /admin/users/5/tests?page=1&limit=10

// Get detailed information for test ID 123 belonging to user ID 5
GET /admin/users/5/tests/123
```