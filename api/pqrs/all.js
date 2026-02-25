// api/pqrs/all.js  ─  GET todas las PQRS (admin)
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método no permitido' });
  const user = await verifyToken(req);
  if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };

  const { estado, tipo } = req.query;
  let sql = `
    SELECT p.*,
           CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre, c.email AS cliente_email,
           CONCAT(a.nombre, ' ', a.apellido) AS admin_nombre
    FROM pqrs p
    JOIN  users c ON p.cliente_id = c.id
    LEFT JOIN users a ON p.admin_id  = a.id
    WHERE 1=1`;
  const params = [];

  if (estado) { sql += ' AND p.estado = ?'; params.push(estado); }
  if (tipo)   { sql += ' AND p.tipo = ?';   params.push(tipo);   }

  // Primero pendientes, luego en proceso, luego resueltos
  sql += ' ORDER BY FIELD(p.estado, "Pendiente", "En proceso", "Resuelto"), p.created_at DESC';

  const pqrs = await query(sql, params);
  res.json({ success: true, data: pqrs });
});
