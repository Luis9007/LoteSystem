// api/lots/stats.js  ─  GET estadísticas de lotes (admin)
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método no permitido' });

  const user = await verifyToken(req);
  if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };

  const rows = await query(`
    SELECT
      COUNT(*)                                                   AS total,
      SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END)   AS disponibles,
      SUM(CASE WHEN estado = 'Reservado'  THEN 1 ELSE 0 END)   AS reservados,
      SUM(CASE WHEN estado = 'Vendido'    THEN 1 ELSE 0 END)   AS vendidos,
      SUM(valor)                                                 AS valor_total_inventario,
      AVG(area)                                                  AS area_promedio
    FROM lots
  `);
  res.json({ success: true, data: rows[0] });
});
