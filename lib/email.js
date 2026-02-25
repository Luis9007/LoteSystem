// lib/email.js
const nodemailer = require('nodemailer');

function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendPaymentEmail({ to, clientName, paymentData, pdfBuffer }) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[Email] No configurado (EMAIL_USER / EMAIL_PASS no definidos)');
    return false;
  }

  await transporter.sendMail({
    from: `"Sistema Lotes Terreno" <${process.env.EMAIL_USER}>`,
    to,
    subject: `✅ Comprobante Cuota #${paymentData.numero_cuota} — Lote ${paymentData.lote_codigo}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <div style="background:#2c7be5;color:white;padding:24px;text-align:center">
          <h1 style="margin:0">🏡 Lotes de Terreno</h1>
          <p style="margin:6px 0 0">Comprobante de Pago</p>
        </div>
        <div style="padding:24px">
          <p>Estimado/a <strong>${clientName}</strong>,</p>
          <p>Tu pago fue registrado correctamente:</p>
          <div style="background:#f0f7ff;border-left:4px solid #2c7be5;padding:16px;border-radius:4px">
            <p style="margin:4px 0"><strong>Cuota #${paymentData.numero_cuota}</strong> de ${paymentData.num_cuotas} — Lote ${paymentData.lote_codigo}</p>
            <p style="margin:4px 0">Fecha: ${new Date(paymentData.fecha_pago).toLocaleDateString('es-CO')}</p>
            <p style="margin:4px 0">Método: ${paymentData.metodo_pago}</p>
            ${paymentData.referencia ? `<p style="margin:4px 0">Referencia: ${paymentData.referencia}</p>` : ''}
          </div>
          <p style="font-size:24px;color:#2c7be5;font-weight:bold;margin:16px 0">
            💰 $${parseFloat(paymentData.monto).toLocaleString('es-CO')}
          </p>
          <table style="width:100%;border-collapse:collapse">
            <tr style="background:#f8f9fa"><td style="padding:8px;font-weight:bold">Total pagado</td><td style="padding:8px">$${parseFloat(paymentData.total_pagado).toLocaleString('es-CO')}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">Saldo pendiente</td><td style="padding:8px">$${parseFloat(paymentData.saldo_pendiente).toLocaleString('es-CO')}</td></tr>
            <tr style="background:#f8f9fa"><td style="padding:8px;font-weight:bold">Cuotas</td><td style="padding:8px">${paymentData.cuotas_pagadas} de ${paymentData.num_cuotas}</td></tr>
          </table>
          <p style="color:#666;font-size:13px;margin-top:16px">El comprobante en PDF está adjunto.</p>
        </div>
        <div style="background:#f1f1f1;padding:12px;text-align:center;font-size:12px;color:#888">
          Sistema de Gestión de Lotes — Correo automático, no responder
        </div>
      </div>`,
    attachments: pdfBuffer ? [{
      filename: `comprobante_cuota${paymentData.numero_cuota}_${paymentData.lote_codigo}.pdf`,
      content:  pdfBuffer,
      contentType: 'application/pdf',
    }] : [],
  });
  return true;
}

async function sendPasswordResetEmail({ to, clientName, resetUrl }) {
  const transporter = createTransporter();
  if (!transporter) return false;

  await transporter.sendMail({
    from: `"Sistema Lotes Terreno" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🔐 Recuperación de Contraseña — Lotes de Terreno',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <div style="background:#2c7be5;color:white;padding:24px;text-align:center">
          <h2 style="margin:0">Recuperar Contraseña</h2>
        </div>
        <div style="padding:24px">
          <p>Hola <strong>${clientName}</strong>,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. El enlace es válido durante <strong>1 hora</strong>.</p>
          <p style="text-align:center;margin:24px 0">
            <a href="${resetUrl}" style="background:#2c7be5;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block">
              Restablecer Contraseña
            </a>
          </p>
          <p style="color:#888;font-size:13px">Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.</p>
        </div>
      </div>`,
  });
  return true;
}

module.exports = { sendPaymentEmail, sendPasswordResetEmail };
