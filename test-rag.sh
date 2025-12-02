#!/bin/bash

# Test RAG Top-K Query Functions
# Đảm bảo server đang chạy trước khi test

BASE_URL="http://localhost:3000"
TOKEN="" # Add your JWT token here

echo "==================================="
echo "Testing RAG Top-K Query Functions"
echo "==================================="

# Get JWT token first (nếu cần authenticate)
echo -e "\n1. Login to get token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token. Using public endpoints..."
else
  echo "Token obtained: ${TOKEN:0:20}..."
fi

# Test 1: Insert documents
echo -e "\n2. Inserting test documents..."
curl -X POST "$BASE_URL/api/chat/insert-document" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "conversation_id": "test-conv-1",
    "text": "Machine learning is a subset of artificial intelligence that enables computers to learn from data without explicit programming."
  }' | jq .

sleep 1

curl -X POST "$BASE_URL/api/chat/insert-document" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "conversation_id": "test-conv-1",
    "text": "Neural networks are computing systems inspired by biological neural networks that constitute animal brains."
  }' | jq .

sleep 1

curl -X POST "$BASE_URL/api/chat/insert-document" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "conversation_id": "test-conv-1",
    "text": "Deep learning uses multiple layers of neural networks to progressively extract higher-level features from raw input."
  }' | jq .

sleep 1

curl -X POST "$BASE_URL/api/chat/insert-document" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "conversation_id": "test-conv-1",
    "text": "Natural language processing (NLP) is a branch of AI that helps computers understand, interpret and manipulate human language."
  }' | jq .

sleep 1

curl -X POST "$BASE_URL/api/chat/insert-document" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "conversation_id": "test-conv-1",
    "text": "Computer vision enables computers to derive meaningful information from digital images, videos and other visual inputs."
  }' | jq .

# Test 2: Query top-k documents
echo -e "\n3. Testing Query Top-K (k=3)..."
curl -X POST "$BASE_URL/api/chat/query-rag" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "What is machine learning?",
    "k": 3
  }' | jq .

sleep 2

# Test 3: Generate RAG response
echo -e "\n4. Testing RAG Response Generation..."
curl -X POST "$BASE_URL/api/chat/rag" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "Explain neural networks",
    "k": 3
  }' | jq .

sleep 2

# Test 4: Stream RAG response
echo -e "\n5. Testing RAG Stream Response..."
curl -X POST "$BASE_URL/api/chat/rag-stream" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "What is deep learning?",
    "k": 2
  }' -N

echo -e "\n\n==================================="
echo "Testing Complete!"
echo "==================================="
