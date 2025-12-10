# Mental Health Evaluation Cache Strategy

## Overview
Hệ thống cache cho mental health evaluation giúp theo dõi trạng thái cảm xúc của user qua các ngày một cách hiệu quả.

## Cache Strategy

### Cache Key
```
mental_health_eval:{userId}
```

### Cache Value
```typescript
{
  evaluationId: number;     // ID của record evaluation trong database
  lastUpdated: number;      // Timestamp (milliseconds) của lần update cuối
}
```

### Cache TTL
- **24 giờ** - Cache sẽ tự động expire sau 24h
- Sau khi expire, ngày mới sẽ tạo record mới

### Update Logic

#### Khi gọi `getMentalHealthEvaluationAndSave()`:

1. **Check cache tồn tại không**
   - Nếu **KHÔNG** có cache → Tạo record mới và lưu vào cache
   
2. **Check thời gian update cuối**
   - Nếu `now - lastUpdated < 2 hours` → **SKIP**, trả về evaluation hiện tại
   - Nếu `now - lastUpdated >= 2 hours` → **UPDATE** record hiện tại

3. **Sau 24h**
   - Cache expire tự động
   - Lần gọi tiếp theo sẽ tạo record mới cho ngày mới

## Flow Chart

```
User Activity
    ↓
getMentalHealthEvaluationAndSave()
    ↓
Check cache exists?
    ├─ NO → Create new evaluation
    │       ├─ Save to DB
    │       └─ Set cache (24h TTL)
    │
    └─ YES → Check time since last update
            ├─ < 2 hours → Return current evaluation (no update)
            └─ >= 2 hours → Update existing evaluation
                          ├─ Recalculate scores
                          ├─ Update DB record
                          └─ Update cache timestamp
```

## Benefits

### 1. Clean Data
- Mỗi user mỗi ngày chỉ có **1 record** evaluation
- Không tạo nhiều record duplicate trong ngày

### 2. Performance
- Không recalculate quá thường xuyên (tối thiểu 2h/lần)
- Giảm tải cho AI model (Gemini API)

### 3. Accurate Tracking
- Update đủ thường xuyên để theo dõi biến động cảm xúc (2h)
- Giữ history theo ngày để phân tích xu hướng dài hạn

### 4. Auto Reset
- TTL 24h tự động reset cho ngày mới
- Không cần cronjob để cleanup

## Usage

### Automatic Trigger
Có thể gọi hàm này tại các điểm:

1. **Sau mỗi chat message**
   ```typescript
   // In chat.controller.ts - after RAG response
   if (user && user.userId) {
     // Non-blocking call
     this.chatService.getMentalHealthEvaluationAndSave(user.userId)
       .catch(err => console.error('Eval update failed:', err));
   }
   ```

2. **Manual Endpoint** (đã có)
   ```
   GET /api/chat/mental-health-evaluation
   ```

3. **Scheduled Job** (optional)
   ```typescript
   // Every 3 hours
   @Cron('0 */3 * * *')
   async updateAllActiveUsers() {
     const activeUsers = await this.getActiveUsers();
     for (const userId of activeUsers) {
       await this.chatService.getMentalHealthEvaluationAndSave(userId);
     }
   }
   ```

### Manual Query
```typescript
// Controller
const evaluation = await this.chatService.getMentalHealthEvaluationAndSave(userId);
```

## Example Timeline

```
Day 1:
├─ 09:00 - User chat → Create new evaluation (ID: 1)
├─ 09:30 - User chat → Skip (< 2h)
├─ 11:30 - User chat → Update evaluation (ID: 1)
├─ 14:00 - User chat → Update evaluation (ID: 1)
└─ 20:00 - User chat → Update evaluation (ID: 1)

Day 2:
├─ 09:00 - Cache expired → Create new evaluation (ID: 2)
├─ 11:30 - User chat → Update evaluation (ID: 2)
└─ 15:00 - User chat → Update evaluation (ID: 2)
```

## Configuration

### Constants in `chat.service.ts`
```typescript
private readonly TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;  // Update interval
private readonly CACHE_TTL = 24 * 60 * 60;              // Cache TTL (seconds)
```

### Adjust Update Frequency
Để thay đổi tần suất update, chỉnh `TWO_HOURS_IN_MS`:
```typescript
// Update every 1 hour
private readonly TWO_HOURS_IN_MS = 1 * 60 * 60 * 1000;

// Update every 3 hours
private readonly TWO_HOURS_IN_MS = 3 * 60 * 60 * 1000;
```

## Database Schema
Evaluation được lưu trong bảng `mental_health_evaluations`:
- Mỗi record có `createdAt` và `updatedAt`
- Query history: `ORDER BY createdAt DESC` để lấy timeline

## API Response
```json
{
  "success": true,
  "data": {
    "emotion_state": "HAPPY",
    "stress_level": 45,
    "gad7_score": 8,
    "gad7_assessment": "Mức độ lo âu nhẹ",
    "pss10_score": 15,
    "pss10_assessment": "Stress mức độ trung bình",
    "mbi_ss_score": {
      "emotional_exhaustion": 12,
      "cynicism": 8,
      "professional_efficacy": 18,
      "assessment": "Mức độ kiệt sức thấp"
    },
    "overall_mental_health": "Tình trạng tâm lý tích cực..."
  }
}
```

## Testing

### Test Cache Logic
```bash
# Test 1: First call - should create new record
curl -X GET http://localhost:3000/api/chat/mental-health-evaluation \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test 2: Immediate second call - should return cached (no AI call)
curl -X GET http://localhost:3000/api/chat/mental-health-evaluation \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test 3: After 2+ hours - should update record
# Wait 2 hours or manually delete cache key in Redis
curl -X GET http://localhost:3000/api/chat/mental-health-evaluation \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notes
- Cache sử dụng in-memory cache (cache-manager)
- Có thể upgrade lên Redis cho production với nhiều instances
- Logging được add để track update behavior
