"use strict";

const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/mandalas - マンダラ一覧取得
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM mandalas ORDER BY updated_at DESC",
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// 🔴【修正】GET /api/mandalas/cells/:cellId/tasks - セルに紐づくタスク一覧
router.get("/cells/:cellId/tasks", async (req, res, next) => {
  const { cellId } = req.params;
  try {
    const [tasks] = await db.query(
      `SELECT t.* FROM tasks t 
       JOIN mandala_cell_tasks mct ON t.id = mct.task_id 
       WHERE mct.cell_id = ?`,
      [cellId],
    );
    res.json(tasks || []);
  } catch (error) {
    next(error);
  }
});

// 🔴【修正】POST /api/mandalas/cells/:cellId/tasks - セルにタスクを紐づけ
router.post("/cells/:cellId/tasks", async (req, res, next) => {
  const { cellId } = req.params;
  const { task_id } = req.body;
  try {
    await db.query(
      `INSERT INTO mandala_cell_tasks (cell_id, task_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE cell_id = cell_id`,
      [cellId, task_id],
    );
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

// 🔴【修正】DELETE /api/mandalas/cells/:cellId/tasks/:taskId - 紐づけ解除
router.delete("/cells/:cellId/tasks/:taskId", async (req, res, next) => {
  const { cellId, taskId } = req.params;
  try {
    await db.query(
      `DELETE FROM mandala_cell_tasks WHERE cell_id = ? AND task_id = ?`,
      [cellId, taskId],
    );
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

// GET /api/mandalas/:id - マンダラ1件取得（セル含む）
router.get("/:id", async (req, res, next) => {
  try {
    const [mandalas] = await db.query("SELECT * FROM mandalas WHERE id = ?", [
      req.params.id,
    ]);
    if (mandalas.length === 0)
      return res.status(404).json({ error: "マンダラが見つかりません" });

    const [cells] = await db.query(
      "SELECT * FROM mandala_cells WHERE mandala_id = ? ORDER BY row_index ASC, col_index ASC",
      [req.params.id],
    );

    res.json({ ...mandalas[0], cells });
  } catch (err) {
    next(err);
  }
});

// POST /api/mandalas - マンダラ新規作成
router.post("/", async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "title は必須です" });

    const [result] = await db.query("INSERT INTO mandalas (title) VALUES (?)", [
      title,
    ]);
    const id = result.insertId;

    const cellValues = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        cellValues.push([id, r, c, ""]);
      }
    }
    await db.query(
      "INSERT INTO mandala_cells (mandala_id, row_index, col_index, content) VALUES ?",
      [cellValues],
    );

    const [rows] = await db.query("SELECT * FROM mandalas WHERE id = ?", [id]);
    const [cells] = await db.query(
      "SELECT * FROM mandala_cells WHERE mandala_id = ? ORDER BY row_index ASC, col_index ASC",
      [id],
    );
    res.status(201).json({ ...rows[0], cells });
  } catch (err) {
    next(err);
  }
});

// PUT /api/mandalas/:id - マンダラタイトル更新
router.put("/:id", async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "title は必須です" });

    await db.query("UPDATE mandalas SET title = ? WHERE id = ?", [
      title,
      req.params.id,
    ]);
    const [rows] = await db.query("SELECT * FROM mandalas WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "マンダラが見つかりません" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/mandalas/:id - マンダラ削除
router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await db.query("DELETE FROM mandalas WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "マンダラが見つかりません" });
    res.json({ message: "削除しました", id: Number(req.params.id) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/mandalas/:id/cells - セル一括更新
router.put("/:id/cells", async (req, res, next) => {
  try {
    const { cells } = req.body;
    if (!Array.isArray(cells))
      return res.status(400).json({ error: "cells は配列です" });

    for (const cell of cells) {
      await db.query(
        "UPDATE mandala_cells SET content = ? WHERE mandala_id = ? AND row_index = ? AND col_index = ?",
        [cell.content ?? "", req.params.id, cell.row_index, cell.col_index],
      );
    }

    await db.query(
      "UPDATE mandalas SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [req.params.id],
    );

    const [updatedCells] = await db.query(
      "SELECT * FROM mandala_cells WHERE mandala_id = ? ORDER BY row_index ASC, col_index ASC",
      [req.params.id],
    );
    res.json(updatedCells);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
