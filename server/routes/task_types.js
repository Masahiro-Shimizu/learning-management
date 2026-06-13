"use strict";

const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/task-types - 種別一覧取得
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM task_types ORDER BY sort_order ASC, id ASC",
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/task-types - 種別新規作成
router.post("/", async (req, res, next) => {
  try {
    const { name, sort_order } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "種別名は必須です" });
    }

    const [result] = await db.query(
      "INSERT INTO task_types (name, sort_order) VALUES (?, ?)",
      [name.trim(), sort_order ?? 0],
    );

    const [rows] = await db.query("SELECT * FROM task_types WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    // UNIQUE制約違反（同名の種別が既に存在）
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "同じ名前の種別が既に存在します" });
    }
    next(err);
  }
});

// PUT /api/task-types/:id - 種別更新
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sort_order } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "種別名は必須です" });
    }

    const [result] = await db.query(
      "UPDATE task_types SET name = ?, sort_order = ? WHERE id = ?",
      [name.trim(), sort_order ?? 0, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "指定された種別が見つかりません" });
    }

    const [rows] = await db.query("SELECT * FROM task_types WHERE id = ?", [
      id,
    ]);

    res.json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "同じ名前の種別が既に存在します" });
    }
    next(err);
  }
});

// DELETE /api/task-types/:id - 種別削除
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // 使用中チェック
    const [usageRows] = await db.query(
      "SELECT COUNT(*) AS count FROM tasks WHERE type_id = ?",
      [id],
    );

    if (usageRows[0].count > 0) {
      return res.status(409).json({
        error: `この種別は${usageRows[0].count}件のタスクで使用されているため削除できません`,
      });
    }

    const [result] = await db.query("DELETE FROM task_types WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "指定された種別が見つかりません" });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
