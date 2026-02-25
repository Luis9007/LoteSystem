// api/stages/[id].js  ─  PUT actualizar etapa (admin)
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).json({ success: false, message: 'Método no permitido' });

  const user = await verifyToken(req);
  if (user.rol !== 'Administrador') throw { status: 403, message: 'Acceso denegado' };

  const { id } = req.query;
  const { nombre, descripcion, orden, fecha_inicio, fecha_fin, activo } = req.body || {};

  await query(
    'UPDATE project_stages SET nombre=?, descripcion=?, orden=?, fecha_inicio=?, fecha_fin=?, activo=? WHERE id=?',
    [nombre, descripcion || null, orden, fecha_inicio || null, fecha_fin || null,
     activo !== undefined ? activo : true, id]
  );

  res.json({ success: true, message: 'Etapa actualizada exitosamente' });
});
