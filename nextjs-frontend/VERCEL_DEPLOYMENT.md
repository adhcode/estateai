# Vercel Deployment Guide

## Prerequisites
- Backend deployed on Railway: `https://web-production-dea05.up.railway.app`
- Vercel account

## Deployment Steps

### 1. Install Vercel CLI (optional)
```bash
npm i -g vercel
```

### 2. Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Set the **Root Directory** to: `nextjs-frontend`
4. Framework Preset: Next.js (auto-detected)
5. Add Environment Variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://web-production-dea05.up.railway.app/api`
6. Click "Deploy"

### 3. Deploy via CLI (Alternative)

```bash
cd nextjs-frontend
vercel --prod
```

When prompted:
- Set up and deploy: Yes
- Which scope: (select your account)
- Link to existing project: No
- Project name: (accept default or customize)
- Directory: `./` (already in nextjs-frontend)
- Override settings: No

## Environment Variables

The following environment variable is required:

```
NEXT_PUBLIC_API_URL=https://web-production-dea05.up.railway.app/api
```

This is already configured in:
- `.env.production` (for local production builds)
- `vercel.json` (for Vercel deployment)

## Post-Deployment

### Update Backend CORS

After deploying to Vercel, update your Railway backend environment variable:

```
FRONTEND_URL=https://your-app.vercel.app
```

This ensures:
- CORS allows requests from your Vercel domain
- QR codes and visitor cards link to the correct frontend URL

### Test the Deployment

1. Visit your Vercel URL
2. Try logging in
3. Test creating a visitor code
4. Verify all API calls work

## Troubleshooting

### API calls failing with CORS errors
- Make sure `FRONTEND_URL` is set in Railway backend
- Check that the backend CORS configuration includes your Vercel domain

### 404 on API routes
- Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Check that the URL includes `/api` at the end

### Build failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript has no errors

## Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy on every push to main branch
- Create preview deployments for pull requests
- Run builds and show deployment status in GitHub

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `FRONTEND_URL` in Railway to match your custom domain
