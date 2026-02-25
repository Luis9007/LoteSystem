// lib/auth.js
// Helpers de autenticación JWT y wrapper para funciones serverless de Vercel

const jwt = require('jsonwebtoken');
const { query } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_min_32_chars_change_me!';

// ── CORS ──────────────────────────────────────────────────────
function setCors(res) {
  const origin = process.env.FRONTEND_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.status(200).end();
    return true;
  }
  return false;
}

// ── JWT ───────────────────────────────────────────────────────
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
}

/**
 * Verifica el token del request y devuelve el usuario desde la DB.
 * Lanza un objeto { status, message } si falla.
 */
async function verifyToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    throw { status: 401, message: 'Token de acceso requerido' };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    if (e.name === 'TokenExpiredError') throw { status: 401, message: 'Token expirado' };
    throw { status: 401, message: 'Token inválido' };
  }

  const users = await query(
    `SELECT u.id, u.nombre, u.apellido, u.email, u.rol_id, r.nombre AS rol, u.activo
     FROM users u JOIN roles r ON u.rol_id = r.id
     WHERE u.id = ?`,
    [decoded.id]
  );

  if (!users.length || !users[0].activo) {
    throw { status: 401, message: 'Usuario no autorizado o desactivado' };
  }

  return users[0];
}

/**
 * Wrapper estándar para todas las funciones serverless.
 * - Aplica CORS automáticamente
 * - Maneja errores { status, message } y errores inesperados
 */
function handler(fn) {
  return async (req, res) => {
    setCors(res);
    if (handlePreflight(req, res)) return;

    try {
      await fn(req, res);
    } catch (err) {
      const status  = err.status  || 500;
      const message = err.message || 'Error interno del servidor';
      if (status === 500) {
        console.error('[API ERROR]', req.url, err);
      }
      res.status(status).json({ success: false, message });
    }
  };
}

module.exports = { signToken, verifyToken, setCors, handler };
