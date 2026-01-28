# Quick Start Guide - iOS App Submission

## What's Been Done ✅

1. ✅ Capacitor installed and iOS platform added
2. ✅ Next.js configured for static export
3. ✅ All Robinhood branding removed
4. ✅ App name: "Trading Lab", Bundle ID: `com.tradinglab.app`
5. ✅ Guest mode added to home page
6. ✅ iOS project structure created

## Critical Issue ⚠️

**Server actions don't work with static export.** You must choose one:

### Option 1: Quick Demo Mode (Fastest)
Replace server actions with localStorage. Good for App Store review.

### Option 2: Remote API (Production Ready)
Set up a backend API and use Capacitor HTTP plugin.

## Quick Commands

```bash
# Build the app (after fixing server actions)
npm run build

# Sync to iOS
npx cap sync

# Open in Xcode
npx cap open ios
```

## In Xcode

1. **Add App Icons:**
   - Right-click `AppIcon.appiconset` → Show in Finder
   - Add your 1024x1024 icon

2. **Test:**
   - Select simulator
   - Press ⌘R to run

3. **Archive:**
   - Product → Archive
   - Distribute App → App Store Connect

## Full Documentation

- `APP_STORE_READINESS.md` - Complete checklist
- `IOS_SUBMISSION_GUIDE.md` - Detailed instructions
- `BUILD_NOTES.md` - Technical details

## Need Help?

The main blocker is server actions. See `APP_STORE_READINESS.md` for solutions.






