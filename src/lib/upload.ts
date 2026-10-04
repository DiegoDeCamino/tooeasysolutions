"use client";

import { createBrowserClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import type { PickedPhoto } from "@/components/ui/Photos";

export type UploadTarget = { path: string; token: string };

/**
 * Compress and upload photos to pre-signed targets (one per photo).
 * Returns the paths that made it; failures are skipped so a form can still submit.
 */
export async function uploadPhotos(
  targets: UploadTarget[],
  photos: PickedPhoto[],
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  const storage = createBrowserClient().storage.from("media");
  let done = 0;
  const results = await Promise.all(
    photos.slice(0, targets.length).map(async (photo, i) => {
      const target = targets[i];
      const blob = await compressImage(photo.file);
      const { error } = await storage.uploadToSignedUrl(target.path, target.token, blob, {
        contentType: blob.type || "image/jpeg",
        upsert: false,
      });
      onProgress?.(++done, photos.length);
      return error ? null : target.path;
    }),
  );
  return results.filter((p): p is string => Boolean(p));
}
