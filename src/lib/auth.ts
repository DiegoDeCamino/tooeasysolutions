import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type Profile = Tables<"profiles">;
export type Viewer = { userId: string; email: string; profile: Profile };

const STAFF = ["admin", "supervisor", "worker"] as const;

export function isStaffRole(role: Profile["role"]) {
  return (STAFF as readonly string[]).includes(role);
}

/** The signed-in user and their profile, cached per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;
  return { userId: user.id, email: user.email ?? profile.email, profile };
});

export async function requireStaff(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (!viewer.profile.active || !isStaffRole(viewer.profile.role)) redirect("/login?denied=1");
  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireStaff();
  if (viewer.profile.role !== "admin") redirect("/app");
  return viewer;
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function ok(): ActionResult;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T) {
  return { ok: true as const, data };
}

export function fail(error: string, fieldErrors?: Record<string, string>) {
  return { ok: false as const, error, fieldErrors };
}

/** Turn a zod error into { field: message } for inline form errors. */
export function zodFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
