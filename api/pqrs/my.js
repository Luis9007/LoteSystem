// api/pqrs/my.js
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método no permitido' });
  const user = await verifyToken(req);

  const pqrs = await query(
    `SELECT p.*, CONCAT(u.nombre, ' ', u.apellido) AS admin_nombre
     FROM pqrs p LEFT JOIN users u ON p.admin_id = u.id
     WHERE p.cliente_id = ?
     ORDER BY p.created_at DESC`,
    [user.id]
  );
  res.json({ success: true, data: pqrs });
});
