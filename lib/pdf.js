// lib/pdf.js — Generador de comprobantes PDF con PDFKit
const PDFDocument = require('pdfkit');

function generatePaymentPDF(p) {
  return new Promise((resolve, reject) => {
    try {
      const doc  = new PDFDocument({ margin: 50, size: 'A4' });
      const bufs = [];
      doc.on('data',  chunk => bufs.push(chunk));
      doc.on('end',   ()    => resolve(Buffer.concat(bufs)));
      doc.on('error', err   => reject(err));

      const W = doc.page.width;
      const BLUE = '#2c7be5';

      // ── Encabezado ───────────────────────────────────────────
      doc.rect(0, 0, W, 90).fill(BLUE);
      doc.fillColor('white')
         .fontSize(18).font('Helvetica-Bold')
         .text('SISTEMA DE LOTES DE TERRENO', 50, 18, { align: 'center' });
      doc.fontSize(11).font('Helvetica')
         .text('COMPROBANTE DE PAGO', 50, 44, { align: 'center' });
      doc.fontSize(9)
         .text(`N.° ${String(p.id).padStart(6, '0')}`, 50, 64, { align: 'center' });

      let y = 108;

      // ── Helper sección ────────────────────────────────────────
      const section = (title) => {
        doc.moveTo(50, y).lineTo(545, y).lineWidth(1).stroke(BLUE);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(BLUE).text(title, 50, y + 6);
        y += 24;
      };

      // ── Helper fila ───────────────────────────────────────────
      const row = (label, value) => {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#555')
           .text(label, 50, y, { width: 150, continued: false });
        doc.fontSize(9).font('Helvetica').fillColor('#222')
           .text(String(value ?? 'N/A'), 205, y);
        y += 18;
      };

      // ── Cliente ───────────────────────────────────────────────
      section('INFORMACIÓN DEL CLIENTE');
      row('Nombre:',    `${p.cliente_nombre} ${p.cliente_apellido}`);
      row('Email:',     p.cliente_email);
      row('Cédula:',    p.cliente_cedula);
      row('Teléfono:',  p.cliente_telefono);
      y += 4;

      // ── Lote ──────────────────────────────────────────────────
      section('INFORMACIÓN DEL LOTE');
      row('Código:',      p.lote_codigo);
      row('Ubicación:',   p.lote_ubicacion);
      row('Área:',        `${p.lote_area} m²`);
      row('Valor total:', `$${parseFloat(p.valor_total).toLocaleString('es-CO')}`);
      y += 4;

      // ── Pago ──────────────────────────────────────────────────
      section('DETALLE DEL PAGO');

      // Cuadro de monto destacado
      doc.rect(50, y, 495, 52).fill('#e8f1ff').stroke(BLUE);
      doc.fillColor(BLUE).fontSize(10).font('Helvetica-Bold')
         .text('MONTO PAGADO', 50, y + 8, { align: 'center' });
      doc.fontSize(20).text(`$${parseFloat(p.monto).toLocaleString('es-CO')}`, 50, y + 24, { align: 'center' });
      y += 62;

      row('Cuota N.°:',      `${p.numero_cuota} de ${p.num_cuotas}`);
      row('Fecha de pago:',  new Date(p.fecha_pago).toLocaleDateString('es-CO', { dateStyle: 'long' }));
      row('Método de pago:', p.metodo_pago);
      if (p.referencia) row('Referencia:', p.referencia);
      y += 4;

      // ── Resumen de cuenta ─────────────────────────────────────
      section('RESUMEN DE CUENTA');
      const tableRows = [
        ['Total pagado',    `$${parseFloat(p.total_pagado).toLocaleString('es-CO')}`],
        ['Saldo pendiente', `$${parseFloat(p.saldo_pendiente).toLocaleString('es-CO')}`],
        ['Cuotas pagadas',  `${p.cuotas_pagadas} de ${p.num_cuotas}`],
        ['Progreso',        `${Math.round((p.cuotas_pagadas / p.num_cuotas) * 100)}%`],
      ];
      tableRows.forEach(([label, val], i) => {
        doc.rect(50, y, 495, 20).fill(i % 2 === 0 ? '#f8f9fa' : 'white').stroke('#dee2e6');
        doc.fillColor('#222').fontSize(9).font('Helvetica-Bold')
           .text(label, 60, y + 5, { width: 220 });
        doc.font('Helvetica').text(val, 280, y + 5, { width: 255, align: 'right' });
        y += 20;
      });

      // ── Pie de página ─────────────────────────────────────────
      const pH = doc.page.height;
      doc.rect(0, pH - 50, W, 50).fill(BLUE);
      doc.fillColor('white').fontSize(8).font('Helvetica')
         .text('Este documento es un comprobante oficial de pago.', 50, pH - 38, { align: 'center' })
         .text(`Generado: ${new Date().toLocaleString('es-CO')}  |  Sistema de Lotes de Terreno`, 50, pH - 24, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePaymentPDF };
