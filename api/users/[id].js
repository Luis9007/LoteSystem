// api/users/[id].js  ─  GET / PUT (admin)
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  const user = await verifyToken(req);
  if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };

  const { id } = req.query;

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const rows = await query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.cedula,
              u.direccion, u.activo, u.created_at, r.nombre AS rol
       FROM users u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
      [id]
    );
    if (!rows.length) throw { status: 404, message: 'Usuario no encontrado' };
    return res.json({ success: true, data: rows[0] });
  }

  // ── PUT ───────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { nombre, apellido, telefono, cedula, direccion, rol_id, activo } = req.body || {};
    await query(
      `UPDATE users SET nombre=?, apellido=?, telefono=?, cedula=?, direccion=?, rol_id=?, activo=?
       WHERE id=?`,
      [nombre, apellido, telefono || null, cedula || null, direccion || null,
       rol_id || 2, activo !== undefined ? activo : true, id]
    );
    return res.json({ success: true, message: 'Usuario actualizado exitosamente' });
  }

  res.status(405).json({ success: false, message: 'Método no permitido' });
});
