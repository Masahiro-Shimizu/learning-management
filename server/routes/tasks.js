"use strict";

const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, b.title AS book_title
      FROM tasks t
      LEFT JOIN books b ON t.book_id = b.id
      ORDER BY t.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, b.title AS book_title
       FROM tasks t
       LEFT JOIN books b ON t.book_id = b.id
       WHERE t.id = ?`,
      [req.params.id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "タスクが見つかりません" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      group_id = 1,
      title,
      type,
      granularity = null,
      book_id = null,
      status = "未着手",
      start_planned_date = null,
      end_planned_date = null,
      start_date = null,
      end_date = null,
      study_time = null,
      planned_study_time = null,
      memo = null,
    } = req.body;

    if (!title || !type)
      return res.status(400).json({ error: "title と type は必須です" });

    const [result] = await db.query(
      `INSERT INTO tasks (group_id, title, type, granularity, book_id, status, start_planned_date, end_planned_date, start_date, end_date, study_time, planned_study_time, memo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        group_id,
        title,
        type,
        granularity,
        book_id,
        status,
        start_planned_date,
        end_planned_date,
        start_date,
        end_date,
        study_time,
        planned_study_time,
        memo,
      ],
    );
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [
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
      "group_id",
      "title",
      "type",
      "granularity",
      "book_id",
      "status",
      "start_planned_date",
      "end_planned_date",
      "start_date",
      "end_date",
      "study_time",
      "planned_study_time",
      "memo",
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
      `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "タスクが見つかりません" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await db.query("DELETE FROM tasks WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "タスクが見つかりません" });
    res.json({ message: "タスクを削除しました", id: Number(req.params.id) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
