import { randomBytes } from "node:crypto";

/** URL-safe random token for private links. */
export function randomToken(bytes = 24) {
  return randomBytes(bytes).toString("base64url");
}
