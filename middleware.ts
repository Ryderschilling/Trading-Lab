import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes that should NOT require auth
const isPublicRoute = createRouteMatcher([
  "/", // landing
  "/terms(.*)",
  "/privacy(.*)",
  "/disclaimer(.*)",
  "/ai-policy(.*)",
  "/visual-editor(.*)",
]);

export default clerkMiddleware(async (_auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};