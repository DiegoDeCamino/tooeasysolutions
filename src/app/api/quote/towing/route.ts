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
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2196F3 0%, #1565C0 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; }
        .section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196F3; }
        .section h2 { margin-top: 0; color: #2196F3; font-size: 20px; }
        .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: bold; min-width: 180px; color: #555; }
        .info-value { color: #333; flex: 1; }
        .badge { background-color: #d4edda; color: #155724; padding: 4px 12px; border-radius: 12px; font-size: 14px; display: inline-block; }
        .car-badge { background-color: #e3f2fd; color: #0d47a1; padding: 8px 16px; border-radius: 8px; font-size: 16px; display: inline-block; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #777; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚗 Nueva Solicitud de Grúa</h1>
        <p>Recibido el ${new Date().toLocaleString('es-AU', { timeZone: 'Australia/Perth' })}</p>
      </div>

      <div class="section">
        <h2>🚙 Vehículo</h2>
        <div class="info-row">
          <div class="info-label">Modelo y año:</div>
          <div class="info-value">
            ${data.model ? `<span class="car-badge">🚗 ${data.model}</span>` : '<em>No especificado</em>'}
          </div>
        </div>
      </div>

      <div class="section">
        <h2>📍 Ubicaciones</h2>
        <div class="info-row">
          <div class="info-label">Recoger en:</div>
          <div class="info-value">${data.from || '<em>No especificado</em>'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Entregar en:</div>
          <div class="info-value">${data.to || '<em>No especificado</em>'}</div>
        </div>
      </div>

      <div class="section">
        <h2>📅 Fecha de Servicio</h2>
        <div class="info-row">
          <div class="info-label">Fecha preferida:</div>
          <div class="info-value">${data.date ? new Date(data.date).toLocaleDateString('es-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '<em>No especificada</em>'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Flexibilidad:</div>
          <div class="info-value">
            <span class="badge">${data.flex ? '✅ Fecha flexible' : '📅 Fecha fija'}</span>
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

  await sendEmail({ subject: "🚗 Nueva Solicitud de Grúa", html });
  return NextResponse.json({ ok: true });
}



