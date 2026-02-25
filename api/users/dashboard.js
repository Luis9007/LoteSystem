// api/users/dashboard.js  ─  GET estadísticas del dashboard (admin)
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método no permitido' });
  const user = await verifyToken(req);
  if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };

  const [clientes]  = await query('SELECT COUNT(*) AS total FROM users WHERE rol_id = 2');
  const [lots]      = await query(`
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) AS disponibles,
           SUM(CASE WHEN estado = 'Vendido'    THEN 1 ELSE 0 END) AS vendidos
    FROM lots`);
  const [purchases] = await query('SELECT COUNT(*) AS total, SUM(valor_total) AS valor_total FROM purchases');
  const [payments]  = await query('SELECT COUNT(*) AS total, SUM(monto) AS total_recaudado FROM payments');
  const [pqrs]      = await query(`
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) AS pendientes
    FROM pqrs`);

  res.json({
    success: true,
    data: {
      clientes:  clientes.total,
      lotes:     lots,
      compras:   purchases,
      pagos:     payments,
      pqrs,
    },
  });
});
