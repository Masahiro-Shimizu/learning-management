'use strict';
require('dotenv').config();
const mysql = require('mysql2/promise');

const getEnvOrDefault = (key, defaultValue) => {
  const value = process.env[key];
  return value === undefined ? defaultValue : value;
};

const dbConfig = {
  host: getEnvOrDefault('DB_HOST', 'localhost'),
  port: Number(getEnvOrDefault('DB_PORT', 8889)),
  user: getEnvOrDefault('DB_USER', 'root'),
  password: getEnvOrDefault('DB_PASSWORD', 'root'),
  database: getEnvOrDefault('DB_NAME', 'learning_management'),
};

const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
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
    console.error('❌  MySQL接続失敗');
    console.error('接続先:', `${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    console.error('ユーザー:', dbConfig.user);
    console.error('詳細:', {
      message: err && err.message,
      code: err && err.code,
      errno: err && err.errno,
      syscall: err && err.syscall,
      address: err && err.address,
      port: err && err.port,
      stack: err && err.stack,
    });
    process.exit(1);
  }
})();
module.exports = pool;
