// api/purchases/index.js  ─  POST crear compra
const { query, getConnection } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método no permitido' });

  const user = await verifyToken(req);
  const { lote_id, num_cuotas, notas } = req.body || {};

  if (!lote_id) throw { status: 400, message: 'lote_id es requerido' };

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Bloquear la fila para evitar compras simultáneas del mismo lote
    const [lots] = await conn.execute(
      'SELECT * FROM lots WHERE id = ? AND estado = "Disponible" FOR UPDATE',
      [lote_id]
    );

    if (!lots.length) {
      await conn.rollback();
      throw { status: 400, message: 'El lote no está disponible para compra' };
    }

    const lote      = lots[0];
    const cuotas    = parseInt(num_cuotas) || lote.num_cuotas;
    const valorCuota = parseFloat(lote.valor) / cuotas;

    const [result] = await conn.execute(
      `INSERT INTO purchases (cliente_id, lote_id, fecha_compra, valor_total, num_cuotas, valor_cuota, saldo_pendiente, notas)
       VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?)`,
      [user.id, lote_id, lote.valor, cuotas, valorCuota, lote.valor, notas || null]
    );

    await conn.execute('UPDATE lots SET estado = "Vendido" WHERE id = ?', [lote_id]);
    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Compra registrada exitosamente',
      data: {
        compra_id:   result.insertId,
        lote:        lote.codigo,
        valor_total: lote.valor,
        num_cuotas:  cuotas,
        valor_cuota: valorCuota,
      },
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});
