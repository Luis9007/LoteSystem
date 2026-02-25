#!/usr/bin/env node
// database/initDB.js
// Ejecutar UNA SOLA VEZ para crear las tablas e insertar datos iniciales:
//   node database/initDB.js

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function buildConfig() {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host:     url.hostname,
      port:     parseInt(url.port) || 3306,
      user:     url.username,
      password: url.password,
      database: url.pathname.replace('/', ''),
      ssl:      { rejectUnauthorized: false },
      multipleStatements: true,
    };
  }
  return {
    host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
    user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'lotes_db',
    ssl:      process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    multipleStatements: true,
  };
}

async function main() {
  console.log('🚀 Iniciando configuración de la base de datos...\n');
  const config = await buildConfig();
  console.log(`📡 Conectando a: ${config.host}:${config.port} / ${config.database}`);

  const conn = await mysql.createConnection(config);
  console.log('✅ Conexión exitosa\n');

  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ No se encontró database/schema.sql');
    process.exit(1);
  }

  let sql = fs.readFileSync(schemaPath, 'utf8');

  // Eliminar líneas USE / CREATE DATABASE para compatibilidad con DBs externas
  sql = sql
    .split('\n')
    .filter(line => !line.trim().toUpperCase().startsWith('USE ') &&
                    !line.trim().toUpperCase().startsWith('CREATE DATABASE'))
    .join('\n');

  console.log('📋 Ejecutando schema.sql...');
  await conn.query(sql);
  console.log('✅ Schema aplicado exitosamente\n');

  // Verificar tablas creadas
  const [tables] = await conn.query('SHOW TABLES');
  console.log('📦 Tablas creadas:');
  tables.forEach(t => console.log('   •', Object.values(t)[0]));

  await conn.end();
  console.log('\n🎉 Base de datos lista. Credenciales por defecto:');
  console.log('   Admin: admin@lotesystem.com / Admin123!');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  console.error('Verifica tus variables de entorno en .env.local\n');
  process.exit(1);
});
