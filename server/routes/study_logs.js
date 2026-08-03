"use strict";

const express = require("express");
const router = express.Router();
const db = require("../db");

// ==========================================
// 1. 学習ログ一覧を取得
// エンドポイント: GET /api/study-logs
// ==========================================
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM study_logs ORDER BY log_date DESC, id DESC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. ダッシュボード用：日別学習時間の集計データを取得
// エンドポイント: GET /api/study-logs/daily-summary
// ※ :id より前に定義する必要があります
// ==========================================
router.get("/daily-summary", async (req, res, next) => {
  try {
    const query = `
      SELECT 
        DATE_FORMAT(log_date, '%Y-%m-%d') AS date, 
        SUM(study_time) AS total_minutes
      FROM study_logs
      GROUP BY log_date
      ORDER BY log_date ASC
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. ID指定で学習ログ1件の詳細を取得（編集モーダル初期値用）
// エンドポイント: GET /api/study-logs/:id
// ==========================================
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM study_logs WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "指定された学習ログが存在しません" });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. POST /api/study-logs - ログ新規作成
// ==========================================
router.post("/", async (req, res, next) => {
  try {
    const {
      log_date,
      task_id = null,
      step_id = null,
      book_id = null,
      study_time,
      progress_value = 1,
      difficulty = null,
      motivation = null,
    } = req.body;

    if (!log_date || study_time === undefined || study_time === null || study_time < 0) {
      return res
        .status(400)
        .json({ error: "log_date と study_time（0以上の値）は必須です" });
    }

    const [result] = await db.query(
      `INSERT INTO study_logs (log_date, task_id, step_id, book_id, study_time, progress_value, difficulty, motivation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [log_date, task_id, step_id, book_id, study_time, progress_value, difficulty, motivation]
    );

    const [rows] = await db.query("SELECT * FROM study_logs WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 5. PUT /api/study-logs/:id - ログ更新（編集保存用）
// ==========================================
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      log_date,
      task_id = null,
      step_id = null,
      book_id = null,
      study_time,
      progress_value = 1,
      difficulty = null,
      motivation = null,
    } = req.body;

    if (!log_date || study_time === undefined || study_time === null || study_time < 0) {
      return res
        .status(400)
        .json({ error: "log_date と study_time（0以上の値）は必須です" });
    }

    const [result] = await db.query(
      `UPDATE study_logs 
       SET log_date = ?, task_id = ?, step_id = ?, book_id = ?, study_time = ?, progress_value = ?, difficulty = ?, motivation = ?
       WHERE id = ?`,
      [log_date, task_id, step_id, book_id, study_time, progress_value, difficulty, motivation, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "更新対象のログが見つかりません" });
    }

    const [rows] = await db.query("SELECT * FROM study_logs WHERE id = ?", [id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 6. DELETE /api/study-logs/:id - ログ削除
// ==========================================
router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await db.query("DELETE FROM study_logs WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "ログが見つかりません" });
    res.json({ message: "削除しました", id: Number(req.params.id) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;