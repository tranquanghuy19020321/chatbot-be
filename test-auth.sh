#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  JWT Authentication Test Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Create User
echo -e "${YELLOW}[1/6] Creating new user...${NC}"
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123",
    "phone": "+84901234567"
  }')

if echo "$CREATE_RESPONSE" | grep -q '"email"'; then
    echo -e "${GREEN}✓ User created successfully${NC}"
    echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"
else
    echo -e "${YELLOW}⚠ User might already exist or error occurred${NC}"
    echo "$CREATE_RESPONSE"
fi

echo -e "\n${BLUE}----------------------------------------${NC}\n"

# Test 2: Login with correct credentials
echo -e "${YELLOW}[2/6] Logging in with correct credentials...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q '"access_token"'; then
    echo -e "${GREEN}✓ Login successful${NC}"
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"refresh_token":"[^"]*' | cut -d'"' -f4)
    echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo -e "\n${BLUE}----------------------------------------${NC}\n"

# Test 3: Refresh Token
echo -e "${YELLOW}[3/8] Testing refresh token...${NC}"
REFRESH_RESPONSE=$(curl -s -X POST $BASE_URL/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refresh_token\": \"$REFRESH_TOKEN\"
  }")

if echo "$REFRESH_RESPONSE" | grep -q '"access_token"'; then
    echo -e "${GREEN}✓ Token refreshed successfully${NC}"
    NEW_TOKEN=$(echo $REFRESH_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo "$REFRESH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REFRESH_RESPONSE"
else
    echo -e "${RED}✗ Refresh token failed${NC}"
    echo "$REFRESH_RESPONSE"
fi

echo -e "\n${BLUE}----------------------------------------${NC}\n"

# Test 4: Login with wrong password
echo -e "${YELLOW}[4/8] Testing login with wrong password...${NC}"
WRONG_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }')

if echo "$WRONG_LOGIN" | grep -q "401"; then
    echo -e "${GREEN}✓ Correctly rejected wrong password${NC}"
else
    echo -e "${RED}✗ Security issue: Wrong password accepted${NC}"
fi
echo "$WRONG_LOGIN" | python3 -m json.tool 2>/dev/null || echo "$WRONG_LOGIN"

echo -e "\n${BLUE}----------------------------------------${NC}\n"

# Test 5: Get profile with token
echo -e "${YELLOW}[5/8] Getting user profile with token...${NC}"
PROFILE_RESPONSE=$(curl -s -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q '"userId"'; then
    echo -e "${GREEN}✓ Profile retrieved successfully${NC}"
    echo "$PROFILE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PROFILE_RESPONSE"
else
    echo -e "${RED}✗ Failed to get profile${NC}"
    echo "$PROFILE_RESPONSE"
fi

echo -e "\n${BLUE}----------------------------------------${NC}\n"

# Test 6: Get users list with token
echo -e "${YELLOW}[6/8] Getting users list with token...${NC}"
USERS_RESPONSE=$(curl -s -X GET "$BASE_URL/users?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")

if echo "$USERS_RESPONSE" | grep -q '"data"'; then
    echo -e "${GREEN}✓ Users list retrieved successfully${NC}"
    echo "$USERS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$USERS_RESPONSE"
else
    echo -e "${RED}✗ Failed to get users list${NC}"
    echo "$USERS_RESPONSE"
fi

echo -e "\n${BLUE}----------------------------------------${NC}\n"

# Test 7: Try to access protected route without token
echo -e "${YELLOW}[7/8] Testing access without token...${NC}"
NO_TOKEN_RESPONSE=$(curl -s -X GET $BASE_URL/users)

if echo "$NO_TOKEN_RESPONSE" | grep -q "401"; then
    echo -e "${GREEN}✓ Correctly blocked access without token${NC}"
else
    echo -e "${RED}✗ Security issue: Access granted without token${NC}"
fi
echo "$NO_TOKEN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$NO_TOKEN_RESPONSE"

echo -e "\n${BLUE}----------------------------------------${NC}\n"

# Test 8: Logout
echo -e "${YELLOW}[8/8] Testing logout...${NC}"
LOGOUT_RESPONSE=$(curl -s -X POST $BASE_URL/auth/logout \
  -H "Authorization: Bearer $TOKEN")

if echo "$LOGOUT_RESPONSE" | grep -q "thành công"; then
    echo -e "${GREEN}✓ Logout successful${NC}"
    echo "$LOGOUT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGOUT_RESPONSE"
else
    echo -e "${RED}✗ Logout failed${NC}"
    echo "$LOGOUT_RESPONSE"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}  Test Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "Your JWT Access Token (valid for 1 hour):"
echo -e "${GREEN}$TOKEN${NC}\n"

echo -e "Your Refresh Token (valid for 7 days):"
echo -e "${GREEN}$REFRESH_TOKEN${NC}\n"

echo -e "To use this token in curl commands:"
echo -e "${YELLOW}curl -X GET $BASE_URL/users -H \"Authorization: Bearer $TOKEN\"${NC}\n"

echo -e "To view Swagger documentation:"
echo -e "${YELLOW}Open: http://localhost:3000/api${NC}\n"
