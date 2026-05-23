'use strict';
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host:     'localhost',
  port:     8889,
  user:     'root',
  password: 'root',
  database: 'learning_management',
  charset:  'utf8mb4',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  timezone: '+09:00',
});
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅  MySQL接続成功');
    conn.release();
  } catch (err) {
    console.error('❌  MySQL接続失敗:', err.message);
    process.exit(1);
  }
})();
module.exports = pool;
