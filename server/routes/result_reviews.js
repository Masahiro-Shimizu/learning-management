"use strict";

const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/result-reviews - 全振り返り一覧取得
// フロント側で period_type・日付範囲によるフィルタ（自分の期間／参考表示用の子期間）を行う
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM result_reviews ORDER BY start_date DESC",
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/result-reviews - 振り返りの新規作成・更新（upsert）
// period_type + start_date + end_date の組み合わせで一意に特定し、既存があれば上書きする
router.post("/", async (req, res, next) => {
  try {
    const {
      period_type,
      start_date,
      end_date,
      goal = null,
      achievement = null,
      good_points = null,
      reflection = null,
      memo = null,
      mood = null,
    } = req.body;

    if (!period_type || !start_date || !end_date) {
      return res
        .status(400)
        .json({ error: "period_type・start_date・end_date は必須です" });
    }
    if (!["week", "month", "year"].includes(period_type)) {
      return res.status(400).json({ error: "period_type が不正です" });
    }

    await db.query(
      `INSERT INTO result_reviews
        (period_type, start_date, end_date, goal, achievement, good_points, reflection, memo, mood)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        goal = VALUES(goal),
        achievement = VALUES(achievement),
        good_points = VALUES(good_points),
        reflection = VALUES(reflection),
        memo = VALUES(memo),
        mood = VALUES(mood)`,
      [
        period_type,
        start_date,
        end_date,
        goal,
        achievement,
        good_points,
        reflection,
        memo,
        mood,
      ],
    );

    const [rows] = await db.query(
      "SELECT * FROM result_reviews WHERE period_type = ? AND start_date = ? AND end_date = ?",
      [period_type, start_date, end_date],
    );
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/result-reviews/:id - 振り返り削除
router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await db.query("DELETE FROM result_reviews WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "振り返りが見つかりません" });
    res.json({ message: "削除しました", id: Number(req.params.id) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
