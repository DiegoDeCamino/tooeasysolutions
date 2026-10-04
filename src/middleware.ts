import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { OPS_ENABLED, isOpsPath } from "@/lib/flags";

export async function middleware(request: NextRequest) {
  if (!OPS_ENABLED) {
    // Platform switched off: never touch Supabase, and hide its routes behind a 404.
    if (isOpsPath(request.nextUrl.pathname)) {
      return NextResponse.rewrite(new URL("/__not-available", request.url));
    }
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except static assets, images, the service worker and the manifest.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|images/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
