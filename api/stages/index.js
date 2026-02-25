// api/stages/index.js  ─  GET todas / POST crear (admin)
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {

  // ── GET ─ público ─────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const stages = await query(`
      SELECT ps.*, COUNT(l.id) AS num_lotes
      FROM project_stages ps
      LEFT JOIN lots l ON ps.id = l.etapa_id
      GROUP BY ps.id
      ORDER BY ps.orden ASC
    `);
    return res.json({ success: true, data: stages });
  }

  // ── POST ─ solo admin ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const user = await verifyToken(req);
    if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };

    const { nombre, descripcion, orden, fecha_inicio, fecha_fin } = req.body || {};
    if (!nombre || orden === undefined)
      throw { status: 400, message: 'Nombre y orden son requeridos' };

    const result = await query(
      'INSERT INTO project_stages (nombre, descripcion, orden, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?)',
      [nombre.trim(), descripcion || null, orden, fecha_inicio || null, fecha_fin || null]
    );
    return res.status(201).json({ success: true, message: 'Etapa creada exitosamente', id: result.insertId });
  }

  res.status(405).json({ success: false, message: 'Método no permitido' });
});
