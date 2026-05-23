'use strict';

const express = require('express');
const path    = require('path');

const taskRoutes = require('./routes/tasks');
const bookRoutes = require('./routes/books');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/tasks', taskRoutes);
app.use('/api/books', bookRoutes);

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('🔥 サーバーエラー:', err);
  res.status(500).json({ error: 'サーバー内部エラーが発生しました' });
});

app.listen(PORT, () => {
  console.log(`🚀  サーバー起動中: http://localhost:${PORT}`);
  console.log(`📋  API確認: http://localhost:${PORT}/api/tasks`);
});