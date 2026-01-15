// =========================================================
// MICROFOUNDER NETWORK — ROUTE PROTECTION MIDDLEWARE
// Protects /admin and /lounge routes based on auth status
// =========================================================

import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "./lib/supabase/middleware";
import { isAdminEmail } from "./lib/auth/types";

// Routes that require authentication
const PROTECTED_ROUTES = ["/lounge", "/admin"];

// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route needs protection
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Create Supabase client for middleware
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  // Get current session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated - redirect to login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin routes
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  if (isAdminRoute) {
    const email = user.email || "";
    
    if (!isAdminEmail(email)) {
      // Not an admin - redirect to lounge
      return NextResponse.redirect(new URL("/lounge", request.url));
    }
  }

  // Check if user has a passport for /lounge access
  if (pathname.startsWith("/lounge")) {
    const { data: passport } = await supabase
      .from("mf_founder_passports")
      .select("id, status")
      .eq("email", user.email)
      .single();

    // No passport or not active - redirect to onboarding
    if (!passport || passport.status !== "active") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/lounge/:path*", "/admin/:path*"],
};
