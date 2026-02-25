// api/purchases/account.js  ─  GET estado de cuenta
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método no permitido' });
  const user = await verifyToken(req);

  // Admin puede ver la cuenta de cualquier cliente pasando ?clienteId=X
  const clienteId = (user.rol === 'Administrador' && req.query.clienteId)
    ? req.query.clienteId
    : user.id;

  const purchases = await query(
    `SELECT p.*, l.codigo AS lote_codigo, l.ubicacion, l.area,
            (SELECT COUNT(*) FROM payments py WHERE py.compra_id = p.id) AS total_pagos
     FROM purchases p
     JOIN lots l ON p.lote_id = l.id
     WHERE p.cliente_id = ?`,
    [clienteId]
  );

  const summary = await query(
    `SELECT
       SUM(valor_total)     AS deuda_total,
       SUM(total_pagado)    AS pagado_total,
       SUM(saldo_pendiente) AS saldo_total,
       COUNT(*)             AS num_compras
     FROM purchases WHERE cliente_id = ?`,
    [clienteId]
  );

  res.json({ success: true, data: { compras: purchases, resumen: summary[0] } });
});
