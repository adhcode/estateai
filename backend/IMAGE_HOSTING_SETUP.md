# Image Hosting Setup for WhatsApp Visitor Cards

## Problem
WhatsApp requires publicly accessible URLs to send images. Local file paths or localhost URLs will fail with a 404 error.

## Solution
The system supports multiple cloud image hosting services with automatic fallback:

### 1. Telegraph (Recommended for Development)
- **Free**: No API key required
- **Setup**: Works out of the box
- **Limits**: No official rate limits documented
- **URL**: https://telegra.ph/upload

### 2. ImgBB (Recommended for Production)
- **Free Tier**: 32 MB storage, unlimited bandwidth
- **Setup**: 
  1. Sign up at https://api.imgbb.com/
  2. Get your API key
  3. Add to `.env`: `IMGBB_API_KEY=your_api_key_here`
- **Limits**: Free tier sufficient for most use cases

### 3. Cloudinary (Alternative)
- **Free Tier**: 25 GB storage, 25 GB bandwidth/month
- **Setup**:
  1. Sign up at https://cloudinary.com/
  2. Get your credentials from dashboard
  3. Add to `.env`:
     ```
     CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_api_secret
     ```
- **Limits**: Free tier very generous

## Configuration

### Environment Variables
Add these to your `backend/.env` file:

```env
# Image Hosting Configuration (for WhatsApp visitor cards)
# Telegraph: Free, no API key required (recommended for development)
# ImgBB: Free tier with API key - Get from https://api.imgbb.com/
# Cloudinary: Free tier - Get from https://cloudinary.com/
IMGBB_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## How It Works

The system tries services in this order:
1. **Telegraph** (always tried first, no config needed)
2. **ImgBB** (if `IMGBB_API_KEY` is set)
3. **Cloudinary** (if credentials are set)

If all services fail, the system will:
- Throw an error (preventing incomplete visitor code generation)
- Send text-only code without image (graceful degradation)
- Log detailed error messages for debugging

## Testing

### Test Telegraph Upload
```bash
# Should work immediately without configuration
curl -F "file=@test-image.png" https://telegra.ph/upload
```

### Test ImgBB Upload
```bash
# Replace YOUR_API_KEY with your actual key
curl -X POST \
  "https://api.imgbb.com/1/upload?key=YOUR_API_KEY" \
  -F "image=@test-image.png"
```

## Troubleshooting

### Error: "Media upload error - Downloading media from weblink failed with http code 404"
**Cause**: WhatsApp cannot access the image URL
**Solutions**:
1. Ensure Telegraph is accessible (check firewall/network)
2. Configure ImgBB API key as backup
3. Check logs for specific upload errors

### Error: "All cloud upload services failed"
**Cause**: All configured services are unavailable or misconfigured
**Solutions**:
1. Check internet connectivity
2. Verify API keys are correct
3. Check service status pages
4. Review backend logs for detailed errors

### Images Not Showing in WhatsApp
**Cause**: URL might be temporary or expired
**Solutions**:
1. Use ImgBB or Cloudinary for permanent storage
2. Telegraph URLs should be permanent but may have rate limits

## Production Recommendations

1. **Use ImgBB or Cloudinary** with proper API keys
2. **Set up monitoring** for upload failures
3. **Configure rate limiting** to avoid hitting service limits
4. **Enable error notifications** for upload failures
5. **Test regularly** to ensure services are working

## Cost Considerations

- **Telegraph**: Free, no limits known
- **ImgBB**: Free tier sufficient for small-medium estates
- **Cloudinary**: Free tier very generous, paid plans available

For large estates with high visitor volume, consider:
- Cloudinary paid plan ($89/month for 75GB)
- Self-hosted S3-compatible storage (MinIO, DigitalOcean Spaces)
- CDN integration for better performance
