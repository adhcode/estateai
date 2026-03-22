# Quick Fix: WhatsApp Image Upload

## The Problem
WhatsApp can't download images from your local server (404 error). You need a cloud image hosting service.

## The Solution (30 seconds)

### Step 1: Get Free ImgBB API Key
1. Go to https://api.imgbb.com/
2. Click "Get API Key"
3. Sign up with your email
4. Copy your API key

### Step 2: Add to .env
Open `backend/.env` and add:
```env
IMGBB_API_KEY=paste_your_key_here
```

### Step 3: Restart Backend
```bash
# Stop your backend (Ctrl+C)
# Start it again
cd backend
npm run start:dev
```

### Step 4: Test
```bash
cd backend
node test-image-upload.js
```

You should see:
```
✅ ImgBB upload successful!
📸 Image URL: https://i.ibb.co/...
```

## Done!
Now when you generate a visitor code via WhatsApp, the image will upload to ImgBB and work perfectly.

## Why ImgBB?
- Free tier (32MB storage, unlimited bandwidth)
- Reliable and fast
- No rate limits on free tier
- Images are permanent
- Perfect for this use case

## Alternative: Use Imgur (Has Rate Limits)
The system will try Imgur first (no config needed), but it has rate limits. If you see "429 Too Many Requests", just get the ImgBB key above.

## Still Having Issues?
Check `IMAGE_UPLOAD_FIX.md` for detailed troubleshooting.
