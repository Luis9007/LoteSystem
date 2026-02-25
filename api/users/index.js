// api/users/index.js  ─  GET todos / POST crear (admin)
const bcrypt = require('bcrypt');
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  const user = await verifyToken(req);
  if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const users = await query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.cedula, u.activo,
              u.created_at, r.nombre AS rol
       FROM users u JOIN roles r ON u.rol_id = r.id
       ORDER BY u.created_at DESC`
    );
    return res.json({ success: true, data: users });
  }

  // ── POST ─ crear usuario ───────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { nombre, apellido, email, password, telefono, cedula, direccion, rol_id } = req.body || {};
    if (!nombre || !apellido || !email || !password)
      throw { status: 400, message: 'Nombre, apellido, email y contraseña son requeridos' };

    const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length) throw { status: 400, message: 'El email ya está registrado' };

    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (rol_id, nombre, apellido, email, telefono, cedula, direccion, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [rol_id || 2, nombre.trim(), apellido.trim(), email.toLowerCase().trim(),
       telefono || null, cedula || null, direccion || null, password_hash]
    );
    return res.status(201).json({ success: true, message: 'Usuario creado exitosamente', id: result.insertId });
  }

  res.status(405).json({ success: false, message: 'Método no permitido' });
});
