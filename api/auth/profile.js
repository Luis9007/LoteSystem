// api/auth/profile.js  ─ GET = ver perfil  /  PUT = actualizar perfil
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  const user = await verifyToken(req);

  if (req.method === 'GET') {
    const rows = await query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.cedula,
              u.direccion, u.activo, u.created_at, r.nombre AS rol
       FROM users u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
      [user.id]
    );
    return res.json({ success: true, user: rows[0] });
  }

  if (req.method === 'PUT') {
    const { nombre, apellido, telefono, direccion } = req.body || {};
    if (!nombre || !apellido) throw { status: 400, message: 'Nombre y apellido son requeridos' };
    await query(
      'UPDATE users SET nombre = ?, apellido = ?, telefono = ?, direccion = ? WHERE id = ?',
      [nombre.trim(), apellido.trim(), telefono || null, direccion || null, user.id]
    );
    return res.json({ success: true, message: 'Perfil actualizado exitosamente' });
  }

  res.status(405).json({ success: false, message: 'Método no permitido' });
});
