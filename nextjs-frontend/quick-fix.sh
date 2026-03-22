#!/bin/bash

echo "🚀 Quick Setup for EstateAI Next.js Frontend"
echo "============================================="

# Fix dependencies
echo "🔧 Fixing dependencies..."
rm -rf node_modules package-lock.json .next

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if backend is running
echo "🔍 Checking backend connection..."
if curl -s http://localhost:3001/api/auth/profile > /dev/null 2>&1; then
    echo "✅ Backend is running!"
else
    echo "⚠️  Backend not detected. Please start it first:"
    echo "   cd ../backend && npm run start:dev"
    echo ""
fi

# Setup super admin if needed
echo "👤 Setting up Super Admin account..."
curl -X POST http://localhost:3001/api/auth/setup-super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@estateai.com",
    "password": "admin123",
    "firstName": "Super",
    "lastName": "Admin"
  }' 2>/dev/null

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "🚀 Start the frontend:"
echo "   npm run dev"
echo ""
echo "🔑 Super Admin Login:"
echo "   Email: admin@estateai.com"
echo "   Password: admin123"
echo ""
echo "🌐 Access at: http://localhost:3000"
echo ""
echo "📋 Test Features:"
echo "   1. Login as Super Admin"
echo "   2. Go to 'Manage Estates'"
echo "   3. Create a new estate"
echo "   4. View estate statistics"
echo ""