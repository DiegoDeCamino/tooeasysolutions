import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const BUCKET = "media";
export type UploadScope = "enquiries" | "projects" | "receipts";
export type UploadTarget = { path: string; token: string };

const MAX_FILES = 10;

/** Mint one-shot signed upload URLs under `${scope}/${scopeId}/`. Caller must authorise first. */
export async function createUploadTargets(scope: UploadScope, scopeId: string, count: number): Promise<UploadTarget[]> {
  const n = Math.min(MAX_FILES, Math.max(1, Math.floor(count)));
  const storage = createAdminClient().storage.from(BUCKET);
  return Promise.all(
    Array.from({ length: n }, async () => {
      const path = `${scope}/${scopeId}/${randomUUID()}.jpg`;
      const { data, error } = await storage.createSignedUploadUrl(path);
      if (error || !data) throw new Error(error?.message ?? "Could not prepare upload");
      return { path: data.path, token: data.token };
    }),
  );
}

/** Only accept paths the caller was allowed to upload to. */
export function pathsInScope(paths: unknown, scope: UploadScope, scopeId: string): string[] {
  if (!Array.isArray(paths)) return [];
  const prefix = `${scope}/${scopeId}/`;
  return paths
    .filter((p): p is string => typeof p === "string" && p.startsWith(prefix) && !p.includes(".."))
    .slice(0, MAX_FILES);
}

/** Signed read URLs for private media, keyed by path. */
export async function signedUrls(paths: (string | null | undefined)[], expiresIn = 60 * 60): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (!unique.length) return {};
  const { data } = await createAdminClient().storage.from(BUCKET).createSignedUrls(unique, expiresIn);
  const out: Record<string, string> = {};
  for (const row of data ?? []) if (row.path && row.signedUrl) out[row.path] = row.signedUrl;
  return out;
}
