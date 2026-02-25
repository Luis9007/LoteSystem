// api/auth/reset-password.js
const bcrypt = require('bcrypt');
const { query } = require('../../lib/db');
const { handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método no permitido' });

  const { token, password } = req.body || {};
  if (!token || !password) throw { status: 400, message: 'Token y contraseña son requeridos' };

  if (password.length < 8)
    throw { status: 400, message: 'La contraseña debe tener mínimo 8 caracteres' };

  const users = await query(
    'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
    [token]
  );
  if (!users.length) throw { status: 400, message: 'Token inválido o expirado' };

  const password_hash = await bcrypt.hash(password, 10);
  await query(
    'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
    [password_hash, users[0].id]
  );

  res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
});
