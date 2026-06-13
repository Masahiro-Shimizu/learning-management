"use strict";

const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*,
        COUNT(t.id) AS task_count,
        SUM(t.status = '完了') AS completed_count
      FROM books b
      LEFT JOIN tasks t ON t.book_id = b.id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * FROM books WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "書籍が見つかりません" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      title,
      author,
      cover_url = null,
      memo = null,
      total_chapters = null,
    } = req.body;
    if (!title || !author)
      return res.status(400).json({ error: "title と author は必須です" });

    const [result] = await db.query(
      "INSERT INTO books (title, author, cover_url, memo, total_chapters) VALUES (?, ?, ?, ?, ?)",
      [title, author, cover_url, memo, total_chapters],
    );
    const [rows] = await db.query("SELECT * FROM books WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const allowedFields = [
      "title",
      "author",
      "cover_url",
      "memo",
      "total_chapters",
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
      `UPDATE books SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    const [rows] = await db.query("SELECT * FROM books WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "書籍が見つかりません" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await db.query("DELETE FROM books WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "書籍が見つかりません" });
    res.json({ message: "書籍を削除しました", id: Number(req.params.id) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
