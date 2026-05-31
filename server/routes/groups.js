"use strict";

const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM `groups` ORDER BY sort_order ASC, id ASC",
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * FROM `groups` WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "グループが見つかりません" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { title, memo = null, sort_order = null } = req.body;
    if (!title) return res.status(400).json({ error: "title は必須です" });

    const [result] = await db.query(
      "INSERT INTO `groups` (title, memo, sort_order) VALUES (?, ?, ?)",
      [title, memo, sort_order],
    );
    const [rows] = await db.query("SELECT * FROM `groups` WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const allowedFields = ["title", "memo", "sort_order"];
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
      `UPDATE \`groups\` SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    const [rows] = await db.query("SELECT * FROM `groups` WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "グループが見つかりません" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (req.params.id === "1") {
      return res.status(403).json({ error: "「未分類」は削除できません" });
    }
    const [result] = await db.query("DELETE FROM `groups` WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "グループが見つかりません" });
    res.json({ message: "グループを削除しました", id: Number(req.params.id) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
