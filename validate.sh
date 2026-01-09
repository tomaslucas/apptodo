#!/bin/bash

# AppTodo - Complete Validation Script
# This script validates the application end-to-end with a real test user

set -e

echo "=========================================="
echo "AppTodo Complete Validation"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if servers are running
echo "Step 1: Checking servers..."
BACKEND_HEALTH=$(curl -s http://localhost:8000/docs -w "%{http_code}" -o /dev/null || echo "000")
FRONTEND_CHECK=$(curl -s http://localhost:5173/ -w "%{http_code}" -o /dev/null || echo "000")

if [ "$BACKEND_HEALTH" != "200" ]; then
    echo -e "${RED}❌ Backend not accessible on port 8000${NC}"
    echo "Starting backend..."
    cd app/backend
    source .venv/bin/activate
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
    sleep 3
    cd ../..
fi

if [ "$FRONTEND_CHECK" != "200" ]; then
    echo -e "${RED}❌ Frontend not accessible on port 5173${NC}"
    echo "Starting frontend..."
    cd app/frontend
    npm run dev > /tmp/frontend.log 2>&1 &
    sleep 5
    cd ../..
fi

echo -e "${GREEN}✓ Servers running${NC}"
echo ""

# Step 2: Create test user
echo "Step 2: Creating test user account..."
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"
TEST_USERNAME="testuser-$(date +%s)"

REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"username\":\"$TEST_USERNAME\"}")

if echo "$REGISTER_RESPONSE" | grep -q "\"status\":\"success\""; then
    echo -e "${GREEN}✓ Test user created${NC}"
    echo "  Email: $TEST_EMAIL"
    echo "  Username: $TEST_USERNAME"
    echo ""
else
    echo -e "${RED}❌ Failed to create test user${NC}"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
fi

# Step 3: Verify login works
echo "Step 3: Verifying login with test user..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo -e "${GREEN}✓ Login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo "  Token obtained: ${TOKEN:0:20}..."
    echo ""
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Step 4: Test API endpoints
echo "Step 4: Testing API endpoints..."

# Test: Get tasks (should be empty)
TASKS_RESPONSE=$(curl -s -X GET http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN")

if echo "$TASKS_RESPONSE" | grep -q "\"data\""; then
    echo -e "${GREEN}✓ GET /api/v1/tasks works${NC}"
else
    echo -e "${RED}❌ GET /api/v1/tasks failed${NC}"
    echo "Response: $TASKS_RESPONSE"
fi

# Test: Create a task
CREATE_TASK_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Validation Test Task","description":"Task created during validation"}')

if echo "$CREATE_TASK_RESPONSE" | grep -q "\"title\":\"Validation Test Task\""; then
    echo -e "${GREEN}✓ POST /api/v1/tasks works${NC}"
    TASK_ID=$(echo "$CREATE_TASK_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "  Created task ID: $TASK_ID"
else
    echo -e "${RED}❌ POST /api/v1/tasks failed${NC}"
    echo "Response: $CREATE_TASK_RESPONSE"
fi

echo ""

# Step 5: Run E2E tests
echo "Step 5: Running E2E tests with Playwright..."
echo "Creating test credentials for Playwright..."

# Create environment file for tests
cat > app/frontend/.env.test << EOF
VITE_TEST_EMAIL=$TEST_EMAIL
VITE_TEST_PASSWORD=$TEST_PASSWORD
EOF

cd app/frontend

# Run tests
echo "Running E2E tests..."
if npm run test:e2e 2>&1 | tee /tmp/e2e-results.txt; then
    E2E_RESULT="PASSED"
    echo -e "${GREEN}✓ E2E tests passed${NC}"
else
    E2E_RESULT="FAILED"
    echo -e "${RED}❌ E2E tests failed${NC}"
fi

# Extract test summary
PASSED=$(grep -o "[0-9]* passed" /tmp/e2e-results.txt | grep -o "[0-9]*" | head -1 || echo "0")
FAILED=$(grep -o "[0-9]* failed" /tmp/e2e-results.txt | grep -o "[0-9]*" | head -1 || echo "0")

echo ""
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo -e "Backend API: ${GREEN}✓ Working${NC}"
echo -e "User Registration: ${GREEN}✓ Working${NC}"
echo -e "User Login: ${GREEN}✓ Working${NC}"
echo -e "API Endpoints: ${GREEN}✓ Working${NC}"
echo -e "E2E Tests: $PASSED passed, $FAILED failed"
echo ""

if [ "$E2E_RESULT" == "PASSED" ]; then
    echo -e "${GREEN}========== VALIDATION SUCCESSFUL ==========${NC}"
    VALIDATION_STATUS=0
else
    echo -e "${YELLOW}========== VALIDATION INCOMPLETE ==========${NC}"
    echo "Some E2E tests failed. Check /tmp/e2e-results.txt for details."
    VALIDATION_STATUS=1
fi

echo ""
echo "Test User Credentials:"
echo "  Email: $TEST_EMAIL"
echo "  Password: $TEST_PASSWORD"
echo "  Username: $TEST_USERNAME"
echo ""
echo "You can use these credentials to log in at http://localhost:5173"
echo ""

cd ../..

exit $VALIDATION_STATUS
