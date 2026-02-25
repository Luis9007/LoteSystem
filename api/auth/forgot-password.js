// api/auth/forgot-password.js
const crypto = require('crypto');
const { query } = require('../../lib/db');
const { sendPasswordResetEmail } = require('../../lib/email');
const { handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método no permitido' });

  const { email } = req.body || {};
  // Respuesta genérica por seguridad (no revelar si el email existe)
  const GENERIC_OK = { success: true, message: 'Si el email existe, recibirás las instrucciones' };

  if (!email) return res.json(GENERIC_OK);

  const users = await query('SELECT * FROM users WHERE email = ? AND activo = TRUE', [email.toLowerCase().trim()]);
  if (!users.length) return res.json(GENERIC_OK);

  const user = users[0];
  const resetToken  = crypto.randomBytes(32).toString('hex');
  const expiry      = new Date(Date.now() + 3_600_000); // 1 hora

  await query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
    [resetToken, expiry, user.id]);

  const baseUrl  = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/pages/reset-password.html?token=${resetToken}`;

  await sendPasswordResetEmail({ to: user.email, clientName: user.nombre, resetUrl }).catch(console.error);

  res.json(GENERIC_OK);
});
