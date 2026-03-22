#!/bin/bash
set -e

echo "🚀 Starting application..."

# Set fontconfig environment
export FONTCONFIG_PATH=/etc/fonts
export FONTCONFIG_FILE=/etc/fonts/fonts.conf

# Verify fontconfig
echo "📝 Fontconfig path: $FONTCONFIG_PATH"
echo "📝 Fontconfig file: $FONTCONFIG_FILE"

# List available fonts
echo "🔍 Available fonts:"
fc-list | grep -i dejavu || echo "⚠️ No DejaVu fonts found in system"

# Check bundled fonts
echo "🔍 Bundled fonts:"
ls -la /app/assets/fonts/ || echo "⚠️ No bundled fonts directory"

# Rebuild font cache one more time
echo "🔄 Rebuilding font cache..."
fc-cache -f -v

# Start the application
echo "✅ Starting NestJS application..."
exec npm run start:prod
