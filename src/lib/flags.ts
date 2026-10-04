/**
 * Master switch for the operations platform (bookings, crew app, carpentry projects).
 * Off unless NEXT_PUBLIC_OPS_ENABLED=true, so production keeps the plain marketing site
 * until Supabase, email and the domain are configured there.
 */
export const OPS_ENABLED = process.env.NEXT_PUBLIC_OPS_ENABLED === "true";

/** Routes that belong to the operations platform and are hidden while it's off. */
export const OPS_PATHS = ["/app", "/book", "/carpentry", "/b/", "/p/", "/join", "/login", "/account", "/reset-password", "/auth", "/api/stripe"];

export function isOpsPath(pathname: string) {
  return OPS_PATHS.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(`${p}/`)));
}
