// api/pqrs/stats.js  ─  GET estadísticas PQRS (admin)
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método no permitido' });
  const user = await verifyToken(req);
  if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };

  const rows = await query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN estado = 'Pendiente'   THEN 1 ELSE 0 END) AS pendientes,
      SUM(CASE WHEN estado = 'En proceso'  THEN 1 ELSE 0 END) AS en_proceso,
      SUM(CASE WHEN estado = 'Resuelto'    THEN 1 ELSE 0 END) AS resueltos,
      SUM(CASE WHEN tipo   = 'Peticion'    THEN 1 ELSE 0 END) AS peticiones,
      SUM(CASE WHEN tipo   = 'Queja'       THEN 1 ELSE 0 END) AS quejas,
      SUM(CASE WHEN tipo   = 'Reclamo'     THEN 1 ELSE 0 END) AS reclamos,
      SUM(CASE WHEN tipo   = 'Sugerencia'  THEN 1 ELSE 0 END) AS sugerencias
    FROM pqrs
  `);
  res.json({ success: true, data: rows[0] });
});
