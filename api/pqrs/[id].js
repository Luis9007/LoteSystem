// api/pqrs/[id].js  ─  GET detalle  /  PUT responder-gestionar (admin)
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  const user = await verifyToken(req);
  const { id } = req.query;

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const rows = await query(
      `SELECT p.*, CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre, c.email AS cliente_email
       FROM pqrs p JOIN users c ON p.cliente_id = c.id
       WHERE p.id = ?`,
      [id]
    );
    if (!rows.length) throw { status: 404, message: 'PQRS no encontrada' };
    if (user.rol !== 'Administrador' && rows[0].cliente_id !== user.id)
      throw { status: 403, message: 'Acceso denegado' };
    return res.json({ success: true, data: rows[0] });
  }

  // ── PUT ─ solo admin ───────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };
    const { estado, respuesta } = req.body || {};
    const ESTADOS = ['Pendiente', 'En proceso', 'Resuelto'];
    if (!ESTADOS.includes(estado)) throw { status: 400, message: 'Estado inválido' };

    await query(
      `UPDATE pqrs
       SET estado = ?, respuesta = ?, admin_id = ?,
           fecha_respuesta = CASE WHEN ? = 'Resuelto' THEN NOW() ELSE fecha_respuesta END
       WHERE id = ?`,
      [estado, respuesta || null, user.id, estado, id]
    );
    return res.json({ success: true, message: 'PQRS actualizada exitosamente' });
  }

  res.status(405).json({ success: false, message: 'Método no permitido' });
});
