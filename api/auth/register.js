// api/auth/register.js
const bcrypt = require('bcrypt');
const { query } = require('../../lib/db');
const { handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método no permitido' });

  const { nombre, apellido, email, password, telefono, cedula, direccion } = req.body || {};

  if (!nombre || !apellido || !email || !password)
    throw { status: 400, message: 'Nombre, apellido, email y contraseña son requeridos' };

  if (password.length < 8)
    throw { status: 400, message: 'La contraseña debe tener mínimo 8 caracteres' };

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
    throw { status: 400, message: 'La contraseña debe tener mayúsculas, minúsculas y números' };

  const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (existing.length) throw { status: 400, message: 'El email ya está registrado' };

  if (cedula) {
    const existCed = await query('SELECT id FROM users WHERE cedula = ?', [cedula]);
    if (existCed.length) throw { status: 400, message: 'La cédula ya está registrada' };
  }

  const password_hash = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (rol_id, nombre, apellido, email, telefono, cedula, direccion, password_hash)
     VALUES (2, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre.trim(), apellido.trim(), email.toLowerCase().trim(),
     telefono || null, cedula || null, direccion || null, password_hash]
  );

  res.status(201).json({ success: true, message: 'Usuario registrado exitosamente', userId: result.insertId });
});
