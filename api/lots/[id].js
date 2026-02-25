// api/lots/[id].js  ─  GET (público) / PUT / DELETE (admin)
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  const { id } = req.query;
  if (!id) throw { status: 400, message: 'ID de lote requerido' };

  // ── GET ─ detalle de un lote (público) ────────────────────────────────────
  if (req.method === 'GET') {
    const rows = await query(
      `SELECT l.*, ps.nombre AS etapa_nombre
       FROM lots l LEFT JOIN project_stages ps ON l.etapa_id = ps.id
       WHERE l.id = ?`,
      [id]
    );
    if (!rows.length) throw { status: 404, message: 'Lote no encontrado' };
    return res.json({ success: true, data: rows[0] });
  }

  // Las siguientes rutas requieren admin
  const user = await verifyToken(req);
  if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };

  // ── PUT ─ actualizar lote ─────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { codigo, etapa_id, area, ubicacion, coordenadas, valor, valor_cuota, num_cuotas, estado, descripcion } = req.body || {};
    if (!codigo || !area || !ubicacion || !valor)
      throw { status: 400, message: 'Campos requeridos: codigo, area, ubicacion, valor' };

    await query(
      `UPDATE lots SET codigo=?, etapa_id=?, area=?, ubicacion=?, coordenadas=?,
       valor=?, valor_cuota=?, num_cuotas=?, estado=?, descripcion=?
       WHERE id=?`,
      [codigo.trim(), etapa_id || null, area, ubicacion, coordenadas || null,
       valor, valor_cuota, num_cuotas, estado || 'Disponible', descripcion || null, id]
    );
    return res.json({ success: true, message: 'Lote actualizado exitosamente' });
  }

  // ── DELETE ─ eliminar lote ────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const purchases = await query('SELECT id FROM purchases WHERE lote_id = ?', [id]);
    if (purchases.length)
      throw { status: 400, message: 'No se puede eliminar un lote con compras asociadas' };
    await query('DELETE FROM lots WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Lote eliminado exitosamente' });
  }

  res.status(405).json({ success: false, message: 'Método no permitido' });
});
