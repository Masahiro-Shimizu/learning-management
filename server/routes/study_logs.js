"use strict";

const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/study-logs - ログ一覧取得（Python分析側からの参照・確認用）
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM study_logs ORDER BY log_date DESC, id DESC",
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/study-logs - ログ新規作成
router.post("/", async (req, res, next) => {
  try {
    const {
      log_date,
      task_id = null,
      step_id = null,
      book_id = null,
      study_time,
      progress_value = 1,
    } = req.body;

    if (!log_date || !study_time || study_time <= 0) {
      return res
        .status(400)
        .json({ error: "log_date と study_time（正の値）は必須です" });
    }

    const [result] = await db.query(
      `INSERT INTO study_logs (log_date, task_id, step_id, book_id, study_time, progress_value)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [log_date, task_id, step_id, book_id, study_time, progress_value],
    );

    const [rows] = await db.query("SELECT * FROM study_logs WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;