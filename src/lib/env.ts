export function siteUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

export const features = {
  get resend() {
    return Boolean(process.env.RESEND_API_KEY);
  },
  get stripe() {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  },
  get push() {
    return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  },
};
