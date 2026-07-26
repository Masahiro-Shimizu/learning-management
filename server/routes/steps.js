"use strict";

const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/steps/tasks/:id - 子タスクに紐づくステップ一覧取得
router.get("/tasks/:id", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM task_steps WHERE task_id = ? ORDER BY sort_order ASC, id ASC`,
      [req.params.id],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/steps/tasks/:id - ステップ新規作成
router.post("/tasks/:id", async (req, res, next) => {
  try {
    const { title, sort_order = 0 } = req.body;

    if (!title) return res.status(400).json({ error: "title は必須です" });

    const [result] = await db.query(
      `INSERT INTO task_steps (task_id, title, sort_order) VALUES (?, ?, ?)`,
      [req.params.id, title, sort_order],
    );
    const [rows] = await db.query("SELECT * FROM task_steps WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/steps - 全ステップ一覧取得（カンバン等での進捗バッジ表示用）
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM task_steps ORDER BY task_id ASC, sort_order ASC, id ASC`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// PUT /api/steps/:id - ステップ更新
router.put("/:id", async (req, res, next) => {
  try {
    const allowedFields = [
      "title",
      "is_completed",
      "sort_order",
      "start_planned_date",
      "end_planned_date",
      "start_date",
      "end_date",
      "planned_study_time",
      "study_time",
    ];

    const fields = [];
    const values = [];
    for (const field of allowedFields) {
      if (field in req.body) {
        fields.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }
    if (fields.length === 0)
      return res.status(400).json({ error: "更新するフィールドがありません" });

    values.push(req.params.id);
    await db.query(
      `UPDATE task_steps SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    const [rows] = await db.query("SELECT * FROM task_steps WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "ステップが見つかりません" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/steps/:id - ステップ削除
router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await db.query("DELETE FROM task_steps WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "ステップが見つかりません" });
    res.json({ message: "ステップを削除しました", id: Number(req.params.id) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
