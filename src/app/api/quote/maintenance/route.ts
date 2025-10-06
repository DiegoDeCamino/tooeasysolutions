import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/sendEmail";
import { verifyTurnstile } from "@/lib/verifyTurnstile";

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { token } = data || {};
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(token);
    if (!valid) return new NextResponse("captcha_failed", { status: 400 });
  }
  const selectedKinds = Object.entries(data.kinds || {})
    .filter(([, value]) => value)
    .map(([key]) => {
      const labels: Record<string, string> = {
        maintenance: '🔧 Mantenimiento del hogar',
        landscaping: '🌳 Paisajismo',
        gardening: '🌱 Jardinería',
        carpentry: '🪚 Carpintería'
      };
      return labels[key] || key;
    });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; }
        .section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #FF6B35; }
        .section h2 { margin-top: 0; color: #FF6B35; font-size: 20px; }
        .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: bold; min-width: 180px; color: #555; }
        .info-value { color: #333; flex: 1; }
        .details-box { background: white; padding: 15px; border-radius: 5px; border: 1px solid #e0e0e0; white-space: pre-wrap; }
        .badge { background-color: #fff3cd; color: #856404; padding: 6px 12px; border-radius: 12px; font-size: 14px; display: inline-block; margin: 3px; }
        .badge-flex { background-color: #d4edda; color: #155724; padding: 4px 12px; border-radius: 12px; font-size: 14px; display: inline-block; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #777; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🛠️ Nueva Cotización de Mantenimiento</h1>
        <p>Recibido el ${new Date().toLocaleString('es-AU', { timeZone: 'Australia/Perth' })}</p>
      </div>

      <div class="section">
        <h2>📍 Ubicación</h2>
        <div class="info-row">
          <div class="info-label">Dirección:</div>
          <div class="info-value">${data.address || '<em>No especificada</em>'}</div>
        </div>
      </div>

      <div class="section">
        <h2>🔧 Tipo de Servicio Solicitado</h2>
        ${selectedKinds.length > 0 ? `
          <div style="margin-top: 10px;">
            ${selectedKinds.map(kind => `<span class="badge">${kind}</span>`).join('')}
          </div>
        ` : '<p><em>No se seleccionaron servicios</em></p>'}
      </div>

      ${data.details && data.details.trim() ? `
        <div class="section">
          <h2>📝 Detalles Adicionales</h2>
          <div class="details-box">${data.details}</div>
        </div>
      ` : ''}

      <div class="section">
        <h2>📅 Fecha Preferida</h2>
        <div class="info-row">
          <div class="info-label">Fecha de servicio:</div>
          <div class="info-value">${data.date ? new Date(data.date).toLocaleDateString('es-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '<em>No especificada</em>'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Flexibilidad:</div>
          <div class="info-value">
            <span class="badge-flex">${data.flex ? '✅ Fecha flexible' : '📅 Fecha fija'}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>👤 Información del Cliente</h2>
        <div class="info-row">
          <div class="info-label">Nombre:</div>
          <div class="info-value"><strong>${data.name}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Email:</div>
          <div class="info-value"><a href="mailto:${data.email}">${data.email}</a></div>
        </div>
        ${data.phone ? `
          <div class="info-row">
            <div class="info-label">Teléfono:</div>
            <div class="info-value"><a href="tel:${data.phone}">${data.phone}</a></div>
          </div>
        ` : ''}
      </div>

      <div class="footer">
        <p><strong>Too Easy Parcel Delivery</strong></p>
        <p>tooeasyparceldelivery@gmail.com • 0432 689 687</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ subject: "🛠️ Nueva Cotización de Mantenimiento", html });
  return NextResponse.json({ ok: true });
}



