// api/purchases/[id].js  ─  GET detalle de una compra
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método no permitido' });

  const user = await verifyToken(req);
  const { id } = req.query;

  const rows = await query(
    `SELECT p.*,
            l.codigo AS lote_codigo, l.ubicacion, l.area, l.valor AS lote_valor,
            u.nombre AS cliente_nombre, u.apellido AS cliente_apellido, u.email AS cliente_email
     FROM purchases p
     JOIN lots  l ON p.lote_id    = l.id
     JOIN users u ON p.cliente_id = u.id
     WHERE p.id = ?`,
    [id]
  );

  if (!rows.length) throw { status: 404, message: 'Compra no encontrada' };

  const purchase = rows[0];
  if (user.rol !== 'Administrador' && purchase.cliente_id !== user.id)
    throw { status: 403, message: 'Acceso denegado' };

  const payments = await query(
    'SELECT * FROM payments WHERE compra_id = ? ORDER BY numero_cuota',
    [id]
  );

  res.json({ success: true, data: { ...purchase, pagos: payments } });
});
