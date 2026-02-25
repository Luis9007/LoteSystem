// api/purchases/my.js  ─  GET mis compras (cliente)
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método no permitido' });
  const user = await verifyToken(req);

  const purchases = await query(
    `SELECT p.*, l.codigo AS lote_codigo, l.ubicacion, l.area, l.valor AS lote_valor,
            ps.nombre AS etapa_nombre
     FROM purchases p
     JOIN lots l ON p.lote_id = l.id
     LEFT JOIN project_stages ps ON l.etapa_id = ps.id
     WHERE p.cliente_id = ?
     ORDER BY p.created_at DESC`,
    [user.id]
  );
  res.json({ success: true, data: purchases });
});
