// api/auth/login.js
const bcrypt = require('bcrypt');
const { query } = require('../../lib/db');
const { signToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método no permitido' });

  const { email, password } = req.body || {};
  if (!email || !password) throw { status: 400, message: 'Email y contraseña son requeridos' };

  const users = await query(
    `SELECT u.*, r.nombre AS rol
     FROM users u JOIN roles r ON u.rol_id = r.id
     WHERE u.email = ? AND u.activo = TRUE`,
    [email.toLowerCase().trim()]
  );

  if (!users.length) throw { status: 401, message: 'Credenciales inválidas' };

  const user = users[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw { status: 401, message: 'Credenciales inválidas' };

  const token = signToken({ id: user.id, email: user.email, rol: user.rol });

  // No exponer datos sensibles
  const { password_hash, reset_token, reset_token_expiry, ...userSafe } = user;

  res.json({ success: true, message: 'Inicio de sesión exitoso', token, user: userSafe });
});
