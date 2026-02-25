// api/users/toggle.js  ─  PATCH activar/desactivar usuario  /api/users/:id/toggle
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'PATCH') return res.status(405).json({ success: false, message: 'Método no permitido' });

  const user = await verifyToken(req);
  if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };

  const { id } = req.query;

  if (parseInt(id) === user.id)
    throw { status: 400, message: 'No puedes desactivar tu propia cuenta' };

  const rows = await query('SELECT activo FROM users WHERE id = ?', [id]);
  if (!rows.length) throw { status: 404, message: 'Usuario no encontrado' };

  const newStatus = !rows[0].activo;
  await query('UPDATE users SET activo = ? WHERE id = ?', [newStatus, id]);

  res.json({
    success: true,
    message: `Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`,
    activo: newStatus,
  });
});
