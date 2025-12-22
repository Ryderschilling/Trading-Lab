# 🚀 Deployment Checklist for Vercel

## ⚠️ Issues to Fix Before Deploying

### 1. **Clerk Middleware Compatibility**
The middleware might need updating for Clerk v5. Check the latest Clerk documentation.

**Current:** Using `authMiddleware` which may be deprecated in v5.
**Fix:** Update to use `clerkMiddleware` if using Clerk v5+.

### 2. **Environment Variables Required**
Make sure to set these in Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. **Database Setup**
- **Option A:** Use Vercel Postgres (recommended)
  - Add Vercel Postgres integration in dashboard
  - DATABASE_URL will be auto-set
  - Run `npx prisma db push` in build or manually

- **Option B:** Use external PostgreSQL
  - Set DATABASE_URL manually
  - Ensure database is accessible from Vercel

### 4. **Prisma Generate in Build**
The build needs to generate Prisma client. Update `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

### 5. **Missing Dependencies Check**
✅ All dependencies are in package.json
✅ No hardcoded local paths
✅ Server actions properly marked with "use server"

### 6. **API Routes**
✅ Calendar API routes are properly set up
✅ All routes use proper Next.js App Router format

## ✅ What Should Work Out of the Box

- ✅ All imports are correct
- ✅ Server actions properly marked
- ✅ Client components properly marked
- ✅ TypeScript configuration correct
- ✅ Tailwind CSS configured
- ✅ All UI components present
- ✅ No missing files

## 📋 Pre-Deployment Steps

1. **Test Build Locally:**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run build
   ```

2. **Check for Build Errors:**
   - If build fails, fix TypeScript errors
   - Check for missing dependencies
   - Verify all environment variables are set

3. **Update Middleware (if needed):**
   ```typescript
   // If Clerk v5, use this:
   import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
   
   const isPublicRoute = createRouteMatcher(["/"]);
   
   export default clerkMiddleware((auth, request) => {
     if (!isPublicRoute(request)) {
       auth().protect();
     }
   });
   ```

4. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit: Trading Lab application"
   git push origin main
   ```

5. **Deploy to Vercel:**
   - Import project from GitHub
   - Add all environment variables
   - Add Vercel Postgres (if using)
   - Deploy!

## 🔧 Common Issues & Fixes

### Issue: Build fails with Prisma error
**Fix:** Ensure `prisma generate` runs before build. Add to `package.json`:
```json
"postinstall": "prisma generate"
```

### Issue: Clerk authentication not working
**Fix:** Check middleware syntax for your Clerk version. May need to update to `clerkMiddleware`.

### Issue: Environment variables not available
**Fix:** Make sure all env vars are set in Vercel dashboard and restart deployment.

### Issue: Database connection fails
**Fix:** 
- Check DATABASE_URL is correct
- Ensure database allows connections from Vercel IPs
- For Vercel Postgres, use the connection string from dashboard

### Issue: API routes return 404
**Fix:** Check that API routes are in `app/api/` directory and export proper handlers.

## ✨ After Deployment

1. Test authentication flow
2. Upload a test trade
3. Check dashboard loads correctly
4. Test calendar view
5. Verify AI assistant works (needs OpenAI API key)

## 📝 Notes

- The app uses Server Actions which require Next.js 14+
- All data is user-scoped via Clerk authentication
- Stats recalculate automatically on trade upload
- AI assistant requires OpenAI API key to function

