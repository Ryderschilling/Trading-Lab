import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Required environment variables: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkPublishableKey) {
  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. " +
    "Please configure this in your Vercel project settings."
  );
}

if (!clerkSecretKey) {
  throw new Error(
    "Missing required environment variable: CLERK_SECRET_KEY. " +
    "Please configure this in your Vercel project settings."
  );
}

// Define routes that don't need Clerk authentication
const isPublicRoute = createRouteMatcher([
  '/visual-editor(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip Clerk for public routes (like visual editor)
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // For other routes, Clerk will handle authentication
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    // Also skip visual-editor page to avoid Clerk issues
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|visual-editor).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
