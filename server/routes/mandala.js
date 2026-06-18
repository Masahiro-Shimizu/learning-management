"use strict";

const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/mandalas - マンダラ一覧取得
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM mandalas ORDER BY updated_at DESC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/mandalas/:id - マンダラ1件取得（セル含む）
router.get("/:id", async (req, res, next) => {
  try {
    const [mandalas] = await db.query(
      "SELECT * FROM mandalas WHERE id = ?",
      [req.params.id]
    );
    if (mandalas.length === 0)
      return res.status(404).json({ error: "マンダラが見つかりません" });

    const [cells] = await db.query(
      "SELECT * FROM mandala_cells WHERE mandala_id = ? ORDER BY row_index ASC, col_index ASC",
      [req.params.id]
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

    const [result] = await db.query(
      "INSERT INTO mandalas (title) VALUES (?)",
      [title]
    );
    const id = result.insertId;

    // 9×9の空セルを一括挿入
    const cellValues = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        cellValues.push([id, r, c, ""]);
      }
    }
    await db.query(
      "INSERT INTO mandala_cells (mandala_id, row_index, col_index, content) VALUES ?",
      [cellValues]
    );

    const [rows] = await db.query("SELECT * FROM mandalas WHERE id = ?", [id]);
    const [cells] = await db.query(
      "SELECT * FROM mandala_cells WHERE mandala_id = ? ORDER BY row_index ASC, col_index ASC",
      [id]
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

    await db.query("UPDATE mandalas SET title = ? WHERE id = ?", [title, req.params.id]);
    const [rows] = await db.query("SELECT * FROM mandalas WHERE id = ?", [req.params.id]);
    if (rows.length === 0)
      return res.status(404).json({ error: "マンダラが見つかりません" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/mandalas/:id - マンダラ削除（セルはCASCADE）
router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await db.query("DELETE FROM mandalas WHERE id = ?", [req.params.id]);
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
    const { cells } = req.body; // [{ row_index, col_index, content }]
    if (!Array.isArray(cells)) return res.status(400).json({ error: "cells は配列です" });

    for (const cell of cells) {
      await db.query(
        "UPDATE mandala_cells SET content = ? WHERE mandala_id = ? AND row_index = ? AND col_index = ?",
        [cell.content ?? "", req.params.id, cell.row_index, cell.col_index]
      );
    }

    // updated_at を更新
    await db.query("UPDATE mandalas SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);

    const [updatedCells] = await db.query(
      "SELECT * FROM mandala_cells WHERE mandala_id = ? ORDER BY row_index ASC, col_index ASC",
      [req.params.id]
    );
    res.json(updatedCells);
  } catch (err) {
    next(err);
  }
});

module.exports = router;