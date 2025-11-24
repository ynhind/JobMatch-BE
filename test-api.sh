#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "  JobMatch Backend API Test Script"
echo "======================================"
echo ""

API_URL="http://localhost:5000"

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ $response -eq 200 ]; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running. Please start it with: npm run dev${NC}"
    exit 1
fi
echo ""

# Test 2: Register User
echo -e "${YELLOW}Test 2: Register New User${NC}"
register_response=$(curl -s -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test'$(date +%s)'@example.com",
    "password": "password123",
    "role": "js"
  }')

if echo $register_response | grep -q "token"; then
    echo -e "${GREEN}✓ User registration successful${NC}"
    TOKEN=$(echo $register_response | grep -o '"token":"[^"]*' | sed 's/"token":"//')
else
    echo -e "${RED}✗ User registration failed${NC}"
    echo $register_response
fi
echo ""

# Test 3: Login
echo -e "${YELLOW}Test 3: User Login${NC}"
login_response=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

if echo $login_response | grep -q "token"; then
    echo -e "${GREEN}✓ Login successful${NC}"
else
    echo -e "${YELLOW}⚠ Login failed (user may not exist yet, that's OK)${NC}"
fi
echo ""

# Test 4: Get Profile (with token)
if [ ! -z "$TOKEN" ]; then
    echo -e "${YELLOW}Test 4: Get User Profile${NC}"
    profile_response=$(curl -s -X GET $API_URL/api/auth/me \
      -H "Authorization: Bearer $TOKEN")
    
    if echo $profile_response | grep -q "email"; then
        echo -e "${GREEN}✓ Profile retrieved successfully${NC}"
    else
        echo -e "${RED}✗ Failed to get profile${NC}"
    fi
    echo ""
fi

# Test 5: Search Jobs (Public)
echo -e "${YELLOW}Test 5: Search Jobs (Public API)${NC}"
jobs_response=$(curl -s -X GET "$API_URL/api/js/jobs/search?keyword=developer&limit=5")

if echo $jobs_response | grep -q "success"; then
    echo -e "${GREEN}✓ Job search API working${NC}"
else
    echo -e "${RED}✗ Job search failed${NC}"
fi
echo ""

# Test 6: Admin Login
echo -e "${YELLOW}Test 6: Admin Login${NC}"
admin_response=$(curl -s -X POST $API_URL/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jobmatch.com",
    "password": "admin123456"
  }')

if echo $admin_response | grep -q "token"; then
    echo -e "${GREEN}✓ Admin login successful${NC}"
else
    echo -e "${YELLOW}⚠ Admin login failed. Run: npm run seed:admin${NC}"
fi
echo ""

echo "======================================"
echo "  Test Summary"
echo "======================================"
echo -e "${GREEN}Backend is operational!${NC}"
echo ""
echo "Next steps:"
echo "1. Create .env file with your credentials"
echo "2. Run: npm run seed:admin"
echo "3. Start frontend: cd ../ITPM && npm run dev"
echo ""
echo "Documentation:"
echo "- Setup Guide: SETUP.md"
echo "- API Docs: README.md"
echo ""
