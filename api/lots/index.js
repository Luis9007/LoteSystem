// api/lots/index.js  ─  GET = listar lotes (público)  /  POST = crear lote (admin)
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {

  // ── GET ─ listar lotes con filtros opcionales (sin auth) ───────────────────
  if (req.method === 'GET') {
    const { estado, etapa_id, min_area, max_area, min_valor, max_valor } = req.query;
    let sql = `
      SELECT l.*, ps.nombre AS etapa_nombre, ps.descripcion AS etapa_desc
      FROM lots l
      LEFT JOIN project_stages ps ON l.etapa_id = ps.id
      WHERE 1=1`;
    const params = [];

    if (estado)    { sql += ' AND l.estado = ?';    params.push(estado); }
    if (etapa_id)  { sql += ' AND l.etapa_id = ?';  params.push(etapa_id); }
    if (min_area)  { sql += ' AND l.area >= ?';      params.push(min_area); }
    if (max_area)  { sql += ' AND l.area <= ?';      params.push(max_area); }
    if (min_valor) { sql += ' AND l.valor >= ?';     params.push(min_valor); }
    if (max_valor) { sql += ' AND l.valor <= ?';     params.push(max_valor); }

    sql += ' ORDER BY l.estado ASC, l.id ASC';

    const lots = await query(sql, params);
    return res.json({ success: true, data: lots, total: lots.length });
  }

  // ── POST ─ crear lote (admin) ──────────────────────────────────────────────
  if (req.method === 'POST') {
    const user = await verifyToken(req);
    if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };

    const { codigo, etapa_id, area, ubicacion, coordenadas, valor, valor_cuota, num_cuotas, descripcion } = req.body || {};
    if (!codigo || !area || !ubicacion || !valor)
      throw { status: 400, message: 'Campos requeridos: codigo, area, ubicacion, valor' };

    const cuotaCalc = valor_cuota || (parseFloat(valor) / (parseInt(num_cuotas) || 12));

    try {
      const result = await query(
        `INSERT INTO lots (codigo, etapa_id, area, ubicacion, coordenadas, valor, valor_cuota, num_cuotas, descripcion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [codigo.trim(), etapa_id || null, area, ubicacion, coordenadas || null,
         valor, cuotaCalc, parseInt(num_cuotas) || 12, descripcion || null]
      );
      return res.status(201).json({ success: true, message: 'Lote creado exitosamente', id: result.insertId });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') throw { status: 400, message: 'El código del lote ya existe' };
      throw err;
    }
  }

  res.status(405).json({ success: false, message: 'Método no permitido' });
});
