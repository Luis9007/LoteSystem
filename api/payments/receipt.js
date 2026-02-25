// api/payments/receipt.js  ─  GET descargar comprobante PDF  /api/payments/:id/receipt
// El parámetro :id viene en req.query.id vía rewrite de vercel.json
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');
const { generatePaymentPDF } = require('../../lib/pdf');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método no permitido' });

  const user = await verifyToken(req);
  const { id } = req.query;

  const rows = await query(
    `SELECT py.*,
            p.valor_total, p.num_cuotas, p.total_pagado, p.saldo_pendiente, p.cuotas_pagadas,
            l.codigo AS lote_codigo,   l.ubicacion AS lote_ubicacion, l.area AS lote_area,
            u.nombre AS cliente_nombre, u.apellido AS cliente_apellido,
            u.email  AS cliente_email,  u.cedula  AS cliente_cedula,
            u.telefono AS cliente_telefono
     FROM payments py
     JOIN purchases p ON py.compra_id = p.id
     JOIN lots  l     ON p.lote_id    = l.id
     JOIN users u     ON py.cliente_id = u.id
     WHERE py.id = ?`,
    [id]
  );

  if (!rows.length) throw { status: 404, message: 'Pago no encontrado' };

  const payment = rows[0];
  if (user.rol !== 'Administrador' && payment.cliente_id !== user.id)
    throw { status: 403, message: 'Acceso denegado' };

  const pdfBuffer = await generatePaymentPDF(payment);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="comprobante_pago_${id}.pdf"`);
  res.send(pdfBuffer);
});
