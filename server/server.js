"use strict";

const express = require("express");
const path = require("path");

const taskRoutes = require("./routes/tasks");
const bookRoutes = require("./routes/books");
const groupRoutes = require("./routes/groups");
const taskTypeRoutes = require("./routes/task_types");
const taskCategoriesRouter = require("./routes/task_categories");
const mandalaRoutes = require("./routes/mandala");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/tasks", taskRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/steps", require("./routes/steps"));
app.use("/api/task-types", taskTypeRoutes);
app.use("/api/task-categories", taskCategoriesRouter);
app.use("/api/mandalas", mandalaRoutes);
app.use("/api/result-reviews", require("./routes/result_reviews"));

app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use((err, req, res, next) => {
  console.error("🔥 サーバーエラー:", err);
  res.status(500).json({ error: "サーバー内部エラーが発生しました" });
});

app.listen(PORT, () => {
  console.log(`🚀  サーバー起動中: http://localhost:${PORT}`);
  console.log(`📋  API確認: http://localhost:${PORT}/api/tasks`);
});
