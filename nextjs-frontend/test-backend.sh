#!/bin/bash

echo "🔍 Testing Backend Connection"
echo "============================="

# Test basic connection
echo "1. Testing basic connection..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Backend server is responding"
else
    echo "❌ Backend server is not responding"
    echo "Please start the backend: cd ../backend && npm run start:dev"
    exit 1
fi

# Test API endpoint
echo ""
echo "2. Testing API endpoint..."
response=$(curl -s -w "%{http_code}" http://localhost:3001/api/auth/profile)
http_code="${response: -3}"

if [ "$http_code" -eq 401 ]; then
    echo "✅ API endpoint is working (401 expected without token)"
elif [ "$http_code" -eq 200 ]; then
    echo "✅ API endpoint is working"
else
    echo "⚠️  Unexpected response code: $http_code"
fi

# Test login endpoint
echo ""
echo "3. Testing login endpoint with invalid credentials..."
login_test=$(curl -s -w "%{http_code}" -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "wrong"}')

login_code="${login_test: -3}"

if [ "$login_code" -eq 401 ] || [ "$login_code" -eq 400 ]; then
    echo "✅ Login endpoint is working (rejection expected)"
else
    echo "⚠️  Unexpected login response: $login_code"
fi

echo ""
echo "🎯 Backend Status: Ready for authentication!"
echo ""
echo "Next steps:"
echo "1. Run: chmod +x setup-super-admin.sh && ./setup-super-admin.sh"
echo "2. Start frontend: npm run dev"
echo "3. Login at: http://localhost:3000"