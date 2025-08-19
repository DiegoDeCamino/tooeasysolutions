export async function verifyTurnstile(token?: string | null) {
  if (!process.env.TURNSTILE_SECRET_KEY) return true; // If not configured, allow in dev
  if (!token) return false;
  try {
    const form = new URLSearchParams();
    form.append("secret", process.env.TURNSTILE_SECRET_KEY);
    form.append("response", token);
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const json = await resp.json();
    return Boolean(json.success);
  } catch (e) {
    console.error("Turnstile verify error", e);
    return false;
  }
}


