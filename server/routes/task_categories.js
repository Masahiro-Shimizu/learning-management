"use strict";

const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/task-categories - カテゴリ一覧取得
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM task_categories ORDER BY sort_order ASC, id ASC",
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/task-categories - カテゴリ新規作成
router.post("/", async (req, res, next) => {
  try {
    const { name, sort_order } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "カテゴリ名は必須です" });
    }

    const [result] = await db.query(
      "INSERT INTO task_categories (name, sort_order) VALUES (?, ?)",
      [name.trim(), sort_order ?? 0],
    );

    const [rows] = await db.query(
      "SELECT * FROM task_categories WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    // UNIQUE制約違反（同名のカテゴリが既に存在）
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "同じ名前のカテゴリが既に存在します" });
    }
    next(err);
  }
});

// PUT /api/task-categories/:id - カテゴリ更新
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sort_order } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "カテゴリ名は必須です" });
    }

    // 「(言語不問)」は名称変更不可
    if (Number(id) === 1) {
      return res.status(409).json({ error: "「(言語不問)」は編集できません" });
    }

    const [result] = await db.query(
      "UPDATE task_categories SET name = ?, sort_order = ? WHERE id = ?",
      [name.trim(), sort_order ?? 0, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "指定されたカテゴリが見つかりません" });
    }

    const [rows] = await db.query(
      "SELECT * FROM task_categories WHERE id = ?",
      [id],
    );

    res.json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "同じ名前のカテゴリが既に存在します" });
    }
    next(err);
  }
});

// DELETE /api/task-categories/:id - カテゴリ削除
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // 「(言語不問)」は削除不可
    if (Number(id) === 1) {
      return res.status(409).json({ error: "「(言語不問)」は削除できません" });
    }

    // 使用中チェック
    const [usageRows] = await db.query(
      "SELECT COUNT(*) AS count FROM tasks WHERE category_id = ?",
      [id],
    );

    if (usageRows[0].count > 0) {
      return res.status(409).json({
        error: `このカテゴリは${usageRows[0].count}件のタスクで使用されているため削除できません`,
      });
    }

    const [result] = await db.query(
      "DELETE FROM task_categories WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "指定されたカテゴリが見つかりません" });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
