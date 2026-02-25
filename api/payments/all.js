// api/payments/all.js  ─  GET todos los pagos (admin)
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método no permitido' });
  const user = await verifyToken(req);
  if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };

  const payments = await query(`
    SELECT py.*,
           l.codigo AS lote_codigo, l.ubicacion,
           u.nombre AS cliente_nombre, u.apellido AS cliente_apellido,
           u.email  AS cliente_email
    FROM payments py
    JOIN purchases p ON py.compra_id = p.id
    JOIN lots  l     ON p.lote_id    = l.id
    JOIN users u     ON py.cliente_id = u.id
    ORDER BY py.fecha_pago DESC, py.id DESC
  `);
  res.json({ success: true, data: payments });
});
