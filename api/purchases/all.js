// api/purchases/all.js  ─  GET todas las compras (admin)
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método no permitido' });
  const user = await verifyToken(req);
  if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };

  const purchases = await query(`
    SELECT p.*,
           l.codigo AS lote_codigo, l.ubicacion, l.area,
           u.nombre AS cliente_nombre, u.apellido AS cliente_apellido,
           u.email  AS cliente_email, u.cedula
    FROM purchases p
    JOIN lots  l ON p.lote_id    = l.id
    JOIN users u ON p.cliente_id = u.id
    ORDER BY p.created_at DESC
  `);
  res.json({ success: true, data: purchases });
});
