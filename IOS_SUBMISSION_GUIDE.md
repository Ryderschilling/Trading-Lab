# iOS App Store Submission Guide

## Current Status

✅ **Completed:**
- Capacitor installed and configured
- iOS platform added
- Next.js configured for static export
- Robinhood branding removed
- App name: "Trading Lab"
- Bundle ID: `com.tradinglab.app`

⚠️ **Remaining Issues:**
- Server actions are not compatible with static export
- API routes have been removed (they don't work with static export)
- Database operations require a backend API

## Critical: Server Actions Limitation

The app currently uses Next.js server actions (`"use server"`) which are **not compatible** with static export. You have two options:

### Option 1: Implement Client-Side Data Layer (Recommended for Demo/Review)

Replace server actions with:
- **localStorage/IndexedDB** for client-side data storage
- **Client-side API calls** using Capacitor's HTTP plugin to a remote API
- **Mock data** for App Store review

### Option 2: Set Up Remote Backend API

1. Deploy your Next.js API routes to a separate server (Vercel, AWS, etc.)
2. Update all server action calls to use HTTP requests via Capacitor's HTTP plugin
3. Configure CORS on your backend to allow requests from the mobile app

## Build Instructions

### Step 1: Resolve Server Actions

Before building, you must either:
- Remove all `"use server"` directives from `lib/actions/*.ts` files, OR
- Replace server action calls with client-side alternatives

### Step 2: Build the App

```bash
npm run build
```

This will create the `out` directory with static files.

### Step 3: Sync Capacitor

```bash
npx cap sync
```

This copies the web assets to the iOS project.

### Step 4: Open in Xcode

```bash
npx cap open ios
```

## iOS Configuration in Xcode

### 1. App Display Name
- Open `ios/App/App/Info.plist`
- Set `CFBundleDisplayName` to "Trading Lab"

### 2. Bundle Identifier
- In Xcode, select the project
- Go to "Signing & Capabilities"
- Ensure Bundle Identifier is `com.tradinglab.app`

### 3. App Icons
- Add app icons to `ios/App/App/Assets.xcassets/AppIcon.appiconset`
- Required sizes: 1024x1024 (App Store), plus all standard iOS icon sizes

### 4. Launch Screen
- Configure in `ios/App/App/Assets.xcassets/LaunchImage.imageset`
- Or use the Storyboard in `ios/App/App/Base.lproj/LaunchScreen.storyboard`

### 5. Privacy Policy URL
- In Xcode: App Target → Info → URL Types
- Add a Privacy Policy URL (required for App Store)
- Example: `https://yourdomain.com/privacy-policy`

### 6. App Store Connect Information
- **App Name:** Trading Lab
- **Subtitle:** Advanced trading performance tracking and analytics
- **Category:** Finance
- **Privacy Policy URL:** (Required - add your URL)
- **Support URL:** (Optional but recommended)

## Apple Review Requirements

### ✅ Compliance Checklist

- [x] No trademarked names (Robinhood references removed)
- [x] App name is unique and non-infringing
- [ ] Privacy Policy URL added
- [ ] Guest/Demo mode available (login not blocking)
- [ ] No private APIs used
- [ ] Proper app icons and launch screen
- [ ] App builds and runs on iOS simulator

### Guest Mode Implementation

The home page now includes a "Continue as Guest" button that allows access without authentication. However, you'll need to:

1. Update dashboard and other pages to work without authentication
2. Use client-side data storage (localStorage) for guest users
3. Show appropriate messaging when features require authentication

## Testing

1. **Build for Simulator:**
   ```bash
   npx cap open ios
   # In Xcode: Product → Destination → Choose a simulator
   # Product → Run (⌘R)
   ```

2. **Test on Device:**
   - Connect iOS device
   - Select device in Xcode
   - Product → Run

3. **Archive for App Store:**
   - Product → Archive
   - Once archived, click "Distribute App"
   - Follow App Store Connect upload process

## Known Limitations

1. **Server Actions:** All server actions in `lib/actions/` need to be replaced with client-side code or HTTP calls
2. **Database:** Prisma database operations won't work - need remote API
3. **Authentication:** Clerk authentication may need adjustment for mobile
4. **API Routes:** Removed - need to implement as remote API

## Next Steps

1. **Immediate:** Implement client-side data layer or set up remote API
2. **Build:** Run `npm run build` and `npx cap sync`
3. **Test:** Test on iOS simulator and device
4. **Configure:** Set up app icons, launch screen, privacy policy
5. **Submit:** Archive and upload to App Store Connect

## Support Files

- `BUILD_NOTES.md` - Detailed build information
- `capacitor.config.ts` - Capacitor configuration
- `next.config.js` - Next.js static export configuration

## Questions?

For Capacitor issues: https://capacitorjs.com/docs
For App Store submission: https://developer.apple.com/app-store/review/



