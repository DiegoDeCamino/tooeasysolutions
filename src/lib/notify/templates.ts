export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type EmailParts = {
  heading: string;
  intro?: string;
  rows?: [string, string | number | null | undefined][];
  cta?: { label: string; url: string };
  outro?: string;
};

/** Simple, client-safe branded email. All values are escaped. */
export function emailLayout({ heading, intro, rows, cta, outro }: EmailParts) {
  const rowsHtml = (rows ?? [])
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(
      ([k, v]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #ece6db;color:#6a625b;font-size:14px;width:40%;vertical-align:top">${escapeHtml(k)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #ece6db;color:#2a2522;font-size:15px;font-weight:700">${escapeHtml(v)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f5f2ec;font-family:Nunito,Segoe UI,Helvetica,Arial,sans-serif;color:#2a2522">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ec;padding:24px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf9;border-radius:16px;overflow:hidden;border:1px solid #e2dcd1">
          <tr><td style="background:#0a7472;padding:18px 24px;color:#ffffff;font-size:15px;font-weight:800;letter-spacing:.2px">Too Easy Solutions</td></tr>
          <tr><td style="padding:28px 24px 8px">
            <h1 style="margin:0 0 10px;font-size:22px;line-height:1.25">${escapeHtml(heading)}</h1>
            ${intro ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#4a433e">${escapeHtml(intro)}</p>` : ""}
            ${rowsHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px">${rowsHtml}</table>` : ""}
            ${
              cta
                ? `<p style="margin:8px 0 24px"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#0a7472;color:#ffffff;text-decoration:none;font-weight:800;padding:13px 22px;border-radius:999px">${escapeHtml(cta.label)}</a></p>`
                : ""
            }
            ${outro ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:#6a625b">${escapeHtml(outro)}</p>` : ""}
          </td></tr>
          <tr><td style="padding:16px 24px;border-top:1px solid #ece6db;color:#8a827a;font-size:12px">
            Too Easy Solutions, South West WA. tooeasysolutionswa@gmail.com, 0432 689 687
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
