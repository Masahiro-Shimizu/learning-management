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

// GET /api/books/:id/progress - 残ページ数（study_logsの積み上げから算出）
// ※ /:id より前に置く必要はない（パスの形が違うため衝突しない）が、
//   分かりやすさのため /:id の直後に配置している
router.get("/:id/progress", async (req, res, next) => {
  try {
    const [[book]] = await db.query(
      "SELECT total_pages FROM books WHERE id = ?",
      [req.params.id],
    );
    if (!book) return res.status(404).json({ error: "書籍が見つかりません" });

    const [[{ pagesCompleted }]] = await db.query(
      `SELECT COALESCE(SUM(progress_value), 0) AS pagesCompleted
       FROM study_logs WHERE book_id = ?`,
      [req.params.id],
    );
    const [[{ pageCountSum }]] = await db.query(
      `SELECT COALESCE(SUM(page_count), 0) AS pageCountSum
       FROM tasks WHERE book_id = ?`,
      [req.params.id],
    );

    // v2.21.34追加：章（タスク）ごとのページ数記録状況
    // 「完了」かつ page_count 設定済みの章で、study_logs合計が page_count 未満のものを
    // isShort=true として返す（下回りのみ警告方針。超過・page_count未設定は対象外）
    const [chapterRows] = await db.query(
      `SELECT
         t.id AS taskId,
         t.page_count AS pageCount,
         t.status AS status,
         COALESCE(SUM(sl.progress_value), 0) AS logged
       FROM tasks t
       LEFT JOIN study_logs sl ON sl.task_id = t.id
       WHERE t.book_id = ?
       GROUP BY t.id`,
      [req.params.id],
    );
    const chapters = chapterRows.map((row) => {
      const pageCount = row.pageCount != null ? Number(row.pageCount) : null;
      const logged = Number(row.logged);
      const isShort =
        row.status === "完了" && pageCount != null && logged < pageCount;
      return {
        taskId: row.taskId,
        pageCount,
        logged,
        isShort,
      };
    });

    const totalPages = book.total_pages;
    res.json({
      totalPages,
      pagesCompleted: Number(pagesCompleted),
      pageCountSum: Number(pageCountSum),
      isMismatched: totalPages != null && totalPages !== Number(pageCountSum),
      remainingPages:
        totalPages != null
          ? Math.max(totalPages - Number(pagesCompleted), 0)
          : null,
      chapters,
    });
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
      understood_memo = null,
      unclear_points = null,
    } = req.body;
    if (!title || !author)
      return res.status(400).json({ error: "title と author は必須です" });

    const [result] = await db.query(
      "INSERT INTO books (title, author, cover_url, memo, total_chapters, understood_memo, unclear_points) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        author,
        cover_url,
        memo,
        total_chapters,
        understood_memo,
        unclear_points,
      ],
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
      "total_pages",
      "understood_memo",
      "unclear_points",
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