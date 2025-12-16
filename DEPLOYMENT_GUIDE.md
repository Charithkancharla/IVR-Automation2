# Cloudflare Pages Deployment Guide

## Prerequisites

Before deploying, you need:
1. ✅ Cloudflare account (free tier works)
2. ⚠️ Cloudflare API Token (needs to be configured)

## Step-by-Step Deployment

### 1. Configure Cloudflare API Key

**Go to Deploy Tab:**
1. Click on the **Deploy** tab in the sidebar
2. Follow instructions to create a Cloudflare API token
3. Minimum permissions required:
   - Account: Cloudflare Pages (Edit)
   - Account: D1 (Edit)
4. Save the API key

### 2. Create Production D1 Database

```bash
cd /home/user/webapp
npx wrangler d1 create ivr-testing-db
```

**Copy the output database_id** and update `wrangler.jsonc`:
```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "ivr-testing-db",
      "database_id": "YOUR_DATABASE_ID_HERE"
    }
  ]
}
```

### 3. Apply Database Migrations

```bash
npm run db:migrate:prod
```

### 4. Create Cloudflare Pages Project

```bash
npx wrangler pages project create ivr-automation-testing \
  --production-branch main \
  --compatibility-date 2025-12-11
```

### 5. Deploy to Production

```bash
npm run deploy:prod
```

This will:
- Build the application (`npm run build`)
- Upload to Cloudflare Pages
- Provide production URLs

### 6. Expected Output

```
✨ Deployment complete!

🌍 Deployment URLs:
Production: https://ivr-automation-testing.pages.dev
```

### 7. Seed Production Database (Optional)

```bash
npx wrangler d1 execute ivr-testing-db --file=./seed.sql
```

## Troubleshooting

### Error: "No API token configured"
- Go to Deploy tab and configure your Cloudflare API key
- Run `setup_cloudflare_api_key` to verify

### Error: "Database not found"
- Make sure you created the D1 database first
- Verify database_id is correct in wrangler.jsonc

### Error: "Project already exists"
- Use a different project name
- Or delete the existing project first

## Environment Variables (Optional)

If you need to set secrets:

```bash
npx wrangler pages secret put API_KEY --project-name ivr-automation-testing
```

## Custom Domain (Optional)

```bash
npx wrangler pages domain add yourdomain.com --project-name ivr-automation-testing
```

## Monitoring Your Deployment

After deployment:
1. Visit your production URL
2. Check all features are working
3. Monitor in Cloudflare Dashboard > Pages
4. View logs with: `npx wrangler pages deployment tail`

## Cost Estimate

**Cloudflare Free Tier:**
- ✅ 100,000 requests/day
- ✅ Unlimited bandwidth
- ✅ D1 Database: 5GB storage
- ✅ 100,000 reads/day
- ✅ 50,000 writes/day

**This is completely free for most use cases!**

## Next Steps After Deployment

1. Test all features on production URL
2. Update README.md with production URL
3. Configure custom domain (if needed)
4. Set up monitoring and alerts
5. Integrate telephony service (see TELEPHONY_INTEGRATION.md)
