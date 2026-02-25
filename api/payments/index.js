// api/payments/index.js  ─  POST registrar pago
const { query, getConnection } = require('../../lib/db');
const { verifyToken, handler } = require('../../lib/auth');
const { generatePaymentPDF } = require('../../lib/pdf');
const { sendPaymentEmail } = require('../../lib/email');

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método no permitido' });

  const user    = await verifyToken(req);
  const isAdmin = user.rol === 'Administrador';
  const { compra_id, monto, fecha_pago, metodo_pago, referencia, notas } = req.body || {};

  if (!compra_id || !monto || !metodo_pago)
    throw { status: 400, message: 'compra_id, monto y metodo_pago son requeridos' };

  const METODOS = ['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque'];
  if (!METODOS.includes(metodo_pago))
    throw { status: 400, message: `Método de pago inválido. Opciones: ${METODOS.join(', ')}` };

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Obtener compra con datos del cliente y lote (bloqueo para transacción)
    const purchaseSql = isAdmin
      ? `SELECT p.*,
           l.codigo AS lote_codigo, l.ubicacion AS lote_ubicacion, l.area AS lote_area,
           u.nombre AS cliente_nombre, u.apellido AS cliente_apellido,
           u.email  AS cliente_email,  u.cedula  AS cliente_cedula,
           u.telefono AS cliente_telefono
         FROM purchases p
         JOIN lots  l ON p.lote_id    = l.id
         JOIN users u ON p.cliente_id = u.id
         WHERE p.id = ? FOR UPDATE`
      : `SELECT p.*,
           l.codigo AS lote_codigo, l.ubicacion AS lote_ubicacion, l.area AS lote_area,
           u.nombre AS cliente_nombre, u.apellido AS cliente_apellido,
           u.email  AS cliente_email,  u.cedula  AS cliente_cedula,
           u.telefono AS cliente_telefono
         FROM purchases p
         JOIN lots  l ON p.lote_id    = l.id
         JOIN users u ON p.cliente_id = u.id
         WHERE p.id = ? AND p.cliente_id = ? FOR UPDATE`;

    const [purchaseRows] = await conn.execute(
      purchaseSql,
      isAdmin ? [compra_id] : [compra_id, user.id]
    );

    if (!purchaseRows.length) {
      await conn.rollback();
      throw { status: 404, message: 'Compra no encontrada' };
    }

    const purchase = purchaseRows[0];

    if (purchase.estado === 'Completado') {
      await conn.rollback();
      throw { status: 400, message: 'Esta compra ya está completamente pagada' };
    }

    const numeroCuota = purchase.cuotas_pagadas + 1;
    const fechaPago   = fecha_pago || new Date().toISOString().split('T')[0];

    const [result] = await conn.execute(
      `INSERT INTO payments (compra_id, cliente_id, numero_cuota, monto, fecha_pago, metodo_pago, referencia, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [compra_id, purchase.cliente_id, numeroCuota, monto, fechaPago,
       metodo_pago, referencia || null, notas || null]
    );

    // Obtener saldos actualizados (el trigger ya los actualizó)
    const [updated] = await conn.execute(
      'SELECT total_pagado, saldo_pendiente, cuotas_pagadas, num_cuotas FROM purchases WHERE id = ?',
      [compra_id]
    );

    await conn.commit();

    // Generar PDF y enviar correo (fuera de la transacción para no bloquear)
    const pdfData = {
      id: result.insertId,
      ...purchase,
      numero_cuota:    numeroCuota,
      monto,
      fecha_pago:      fechaPago,
      metodo_pago,
      referencia,
      total_pagado:    updated[0].total_pagado,
      saldo_pendiente: updated[0].saldo_pendiente,
      cuotas_pagadas:  updated[0].cuotas_pagadas,
      num_cuotas:      updated[0].num_cuotas,
      valor_total:     purchase.valor_total,
    };

    let correoEnviado = false;
    try {
      const pdfBuffer = await generatePaymentPDF(pdfData);
      if (purchase.cliente_email) {
        await sendPaymentEmail({
          to:         purchase.cliente_email,
          clientName: `${purchase.cliente_nombre} ${purchase.cliente_apellido}`,
          paymentData: pdfData,
          pdfBuffer,
        });
        correoEnviado = true;
        await query('UPDATE payments SET correo_enviado = TRUE WHERE id = ?', [result.insertId]);
      }
    } catch (e) {
      console.error('[PDF/Email] Error:', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: {
        pago_id:         result.insertId,
        numero_cuota:    numeroCuota,
        correo_enviado:  correoEnviado,
        total_pagado:    updated[0].total_pagado,
        saldo_pendiente: updated[0].saldo_pendiente,
      },
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});
