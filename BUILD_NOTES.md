# Build Notes for iOS App Store Submission

## Important Limitations

This app has been configured for static export to work with Capacitor for iOS submission. However, the following features require a backend API:

1. **Server Actions** - All server actions in `lib/actions/` require a Next.js server
2. **Database Operations** - Prisma database operations require a database connection
3. **Authentication** - Clerk authentication requires server-side handling

## Options for App Store Submission

### Option 1: Demo Mode (Recommended for Review)
Create a client-side only version that uses localStorage/IndexedDB for demo data. This allows the app to function for App Store review without a backend.

### Option 2: Remote API
Set up a separate backend API (Next.js API routes, Express, etc.) and update the app to call this API using Capacitor's HTTP plugin.

### Option 3: Hybrid Approach
Use Capacitor's HTTP plugin to call your existing web API if you have one deployed.

## Current Status

- ✅ Next.js configured for static export
- ✅ Capacitor initialized with iOS platform
- ✅ Robinhood branding removed
- ⚠️ Server actions disabled (need client-side alternative)
- ⚠️ API routes removed (need remote API)

## Next Steps

1. Implement client-side data layer (localStorage/IndexedDB) for demo mode
2. OR set up remote API and update app to use HTTP calls
3. Build the app: `npm run build`
4. Sync Capacitor: `npx cap sync`
5. Open in Xcode: `npx cap open ios`

