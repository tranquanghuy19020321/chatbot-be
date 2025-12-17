# Mental Health Evaluation cho Test

## Tổng quan
Đã tạo thành công hệ thống mental health evaluation gắn với bài test. Khi người dùng hoàn thành test (update questions), hệ thống sẽ:

1. Tự động tính toán các điểm số dựa trên loại câu hỏi (GAD-7, PSS-10, PHQ-9, MBI)
2. Gửi kết quả đến AI (Gemini) để phân tích
3. Lưu đánh giá mental health vào database

## Các file đã tạo/sửa đổi

### 1. Entity mới
- `src/tests/entities/test-mental-health-evaluation.entity.ts`: Entity cho bảng mental health evaluation gắn với test

### 2. DTO
- `src/tests/dto/test-mental-health-evaluation.dto.ts`: DTO cho validation và API documentation

### 3. Migration
- `src/database/migrations/1734374400000-CreateTestMentalHealthEvaluations.ts`: Tạo bảng `test_mental_health_evaluations`

### 4. Cập nhật Entity
- `src/tests/entities/test.entity.ts`: Thêm relation OneToOne với TestMentalHealthEvaluation

### 5. Service Logic
- `src/tests/tests.service.ts`: 
  - Thêm logic tự động tạo mental health evaluation khi hoàn thành test
  - Tính toán điểm số cho các loại assessment khác nhau
  - Tích hợp AI để generate assessment và recommendations
  - Xác định emotion state và risk level

### 6. Controller
- `src/tests/tests.controller.ts`: Thêm endpoint GET `/tests/:id/mental-health-evaluation`

### 7. Module
- `src/tests/tests.module.ts`: Import TestMentalHealthEvaluation entity

### 8. Database Config
- `src/config/database.config.ts`: Thêm entity vào TypeORM config
- `src/database/data-source.ts`: Thêm entity và migration

## Cấu trúc bảng test_mental_health_evaluations

```sql
CREATE TABLE test_mental_health_evaluations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_id INT UNIQUE NOT NULL,
  emotion_state ENUM('HAPPY', 'SAD', 'ANGRY', 'ANXIOUS', 'STRESSED', 'NEUTRAL'),
  stress_level TINYINT UNSIGNED, -- 0-100
  gad7_score TINYINT UNSIGNED, -- 0-21 (anxiety)
  gad7_assessment VARCHAR(100),
  pss10_score TINYINT UNSIGNED, -- 0-40 (stress)
  pss10_assessment VARCHAR(100),
  phq9_score TINYINT UNSIGNED, -- 0-27 (depression)
  phq9_assessment VARCHAR(100),
  mbi_emotional_exhaustion TINYINT UNSIGNED, -- 0-30 (burnout)
  mbi_cynicism TINYINT UNSIGNED, -- 0-30
  mbi_professional_efficacy TINYINT UNSIGNED, -- 0-30
  mbi_assessment VARCHAR(100),
  overall_mental_health TEXT, -- AI-generated assessment
  recommendations TEXT, -- AI-generated recommendations
  risk_level ENUM('LOW', 'MODERATE', 'HIGH', 'CRITICAL'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);
```

## API Endpoints

### 1. Update Test (trigger evaluation)
```
PATCH /tests/:id
Body: {
  "questions": [
    {
      "question": "Câu hỏi",
      "answer": 2,
      "questionType": "gad" | "pss" | "phq" | "mbi"
    }
  ]
}
```

### 2. Get Mental Health Evaluation
```
GET /tests/:id/mental-health-evaluation
Response: {
  "id": 1,
  "testId": 1,
  "emotionState": "ANXIOUS",
  "stressLevel": 65,
  "gad7Score": 12,
  "gad7Assessment": "Moderate anxiety",
  "overallMentalHealth": "AI-generated assessment...",
  "recommendations": "AI-generated recommendations...",
  "riskLevel": "MODERATE",
  ...
}
```

## Workflow
1. Người dùng tạo test: `POST /tests`
2. Người dùng update answers: `PATCH /tests/:id` với questions
3. Hệ thống tự động:
   - Tính toán scores theo từng loại assessment
   - Gửi data đến AI để phân tích
   - Tạo và lưu mental health evaluation
4. Người dùng có thể xem kết quả: `GET /tests/:id/mental-health-evaluation`

## AI Integration
- Sử dụng Google Gemini để phân tích kết quả test
- AI nhận điểm số và tạo:
  - Overall assessment (đánh giá tổng quan)
  - Recommendations (khuyến nghị cụ thể)
- Có fallback logic nếu AI không khả dụng

## Score Calculations
- **GAD-7**: 0-21 điểm (anxiety)
  - 0-4: Minimal anxiety
  - 5-9: Mild anxiety  
  - 10-14: Moderate anxiety
  - 15-21: Severe anxiety

- **PSS-10**: 0-40 điểm (perceived stress)
  - 0-13: Low perceived stress
  - 14-26: Moderate perceived stress
  - 27-40: High perceived stress

- **PHQ-9**: 0-27 điểm (depression)
  - 0-4: Minimal depression
  - 5-9: Mild depression
  - 10-14: Moderate depression
  - 15-19: Moderately severe depression
  - 20-27: Severe depression

- **MBI**: 0-30 điểm per dimension (burnout)
  - 0-10: Low burnout risk
  - 11-20: Moderate burnout risk
  - 21-30: High burnout risk

## Status
✅ Hoàn thành và đang chạy trên http://localhost:3000
✅ Swagger docs tại http://localhost:3000/api
✅ Migration đã chạy thành công
✅ Tất cả endpoints hoạt động bình thường