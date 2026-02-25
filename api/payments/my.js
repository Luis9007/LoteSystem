// api/payments/my.js  ─  GET historial de pagos del cliente
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método no permitido' });
  const user = await verifyToken(req);

  const payments = await query(
    `SELECT py.*,
            l.codigo AS lote_codigo, l.ubicacion,
            p.num_cuotas, p.valor_total, p.total_pagado, p.saldo_pendiente
     FROM payments py
     JOIN purchases p ON py.compra_id = p.id
     JOIN lots l      ON p.lote_id    = l.id
     WHERE py.cliente_id = ?
     ORDER BY py.fecha_pago DESC, py.id DESC`,
    [user.id]
  );
  res.json({ success: true, data: payments });
});
