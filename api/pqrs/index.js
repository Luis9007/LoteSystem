// api/pqrs/index.js  ─  POST crear PQRS
const { query } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método no permitido' });

  const user = await verifyToken(req);
  const { tipo, asunto, descripcion } = req.body || {};

  const TIPOS = ['Peticion', 'Queja', 'Reclamo', 'Sugerencia'];
  if (!TIPOS.includes(tipo)) throw { status: 400, message: `Tipo inválido. Opciones: ${TIPOS.join(', ')}` };
  if (!asunto)     throw { status: 400, message: 'El asunto es requerido' };
  if (!descripcion) throw { status: 400, message: 'La descripción es requerida' };

  const result = await query(
    'INSERT INTO pqrs (cliente_id, tipo, asunto, descripcion) VALUES (?, ?, ?, ?)',
    [user.id, tipo, asunto.trim(), descripcion.trim()]
  );

  res.status(201).json({
    success: true,
    message: 'PQRS enviada exitosamente. Le responderemos pronto.',
    id: result.insertId,
  });
});
