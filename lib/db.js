const mysql = require("mysql2/promise");

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 5,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}

module.exports = getPool;
