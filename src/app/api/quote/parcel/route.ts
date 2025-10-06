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

  interface ParcelRow {
    itemType: string;
    quantity: number;
    kg: number;
    width: number;
    length: number;
    height: number;
    unit: string;
  }

  // Filter out empty rows
  const validRows = (data.rows || []).filter((row: ParcelRow) => 
    row.itemType && row.itemType.trim() !== ""
  );

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
        .info-value { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background-color: #FF6B35; color: white; padding: 12px; text-align: left; font-weight: bold; }
        td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        .badge { background-color: #d4edda; color: #155724; padding: 4px 12px; border-radius: 12px; font-size: 14px; display: inline-block; }
        .badge.danger { background-color: #f8d7da; color: #721c24; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #777; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📦 Nueva Cotización de Parcel</h1>
        <p>Recibido el ${new Date().toLocaleString('es-AU', { timeZone: 'Australia/Perth' })}</p>
      </div>

      <div class="section">
        <h2>📍 Información de Entrega</h2>
        <div class="info-row">
          <div class="info-label">Origen:</div>
          <div class="info-value">${data.from || '<em>No especificado</em>'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Tipo de recogida:</div>
          <div class="info-value">${data.fromType === 'home' ? '🏠 Domicilio' : '🏢 Negocio'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Destino:</div>
          <div class="info-value">${data.to || '<em>No especificado</em>'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Tipo de entrega:</div>
          <div class="info-value">${data.toType === 'home' ? '🏠 Domicilio' : '🏢 Negocio'}</div>
        </div>
      </div>

      <div class="section">
        <h2>📋 Detalles de los Paquetes</h2>
        ${validRows.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Cantidad</th>
                <th>Tipo de Artículo</th>
                <th>Peso (kg)</th>
                <th>Dimensiones</th>
              </tr>
            </thead>
            <tbody>
              ${validRows.map((row: ParcelRow) => `
                <tr>
                  <td><strong>${row.quantity}</strong></td>
                  <td>${row.itemType}</td>
                  <td>${row.kg} kg</td>
                  <td>${row.width} × ${row.length} × ${row.height} ${row.unit}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p><em>No se especificaron artículos</em></p>'}
        
        <div class="info-row" style="margin-top: 15px;">
          <div class="info-label">Mercancías peligrosas:</div>
          <div class="info-value">
            <span class="badge${data.dangerousGoods ? ' danger' : ''}">
              ${data.dangerousGoods ? '⚠️ SÍ' : '✅ NO'}
            </span>
          </div>
        </div>
        ${data.budget ? `
          <div class="info-row">
            <div class="info-label">Presupuesto del cliente:</div>
            <div class="info-value"><strong>$${data.budget}</strong></div>
          </div>
        ` : ''}
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

  await sendEmail({ subject: "📦 Nueva Cotización de Parcel", html });
  return NextResponse.json({ ok: true });
}



