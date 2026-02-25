// api/lots/status.js  ─  PATCH cambiar estado del lote  /api/lots/:id/status
// Vercel pasa el parámetro dinámico :id en req.query.id gracias al rewrite en vercel.json
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'PATCH') return res.status(405).json({ success: false, message: 'Método no permitido' });

  const user = await verifyToken(req);
  if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };

  const { id } = req.query;
  const { estado } = req.body || {};

  const validStates = ['Disponible', 'Reservado', 'Vendido'];
  if (!validStates.includes(estado))
    throw { status: 400, message: 'Estado inválido. Opciones: Disponible, Reservado, Vendido' };

  await query('UPDATE lots SET estado = ? WHERE id = ?', [estado, id]);
  res.json({ success: true, message: `Estado del lote cambiado a ${estado}` });
});
