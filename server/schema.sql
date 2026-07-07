CREATE DATABASE IF NOT EXISTS learning_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE learning_management;

CREATE TABLE IF NOT EXISTS books (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  title        VARCHAR(255)    NOT NULL,
  author       VARCHAR(255)    NOT NULL,
  cover_url    VARCHAR(1000),
  memo         TEXT,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS groups (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  title        VARCHAR(255)    NOT NULL,
  memo         TEXT,
  sort_order   INT UNSIGNED,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 「未分類」グループを初期データとして挿入（削除不可の扱い）
INSERT INTO groups (id, title, sort_order) VALUES (1, '未分類', 0);

CREATE TABLE IF NOT EXISTS task_types (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name         VARCHAR(50)     NOT NULL,
  sort_order   INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_task_types_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初期データ（本・動画のみ）
INSERT INTO task_types (id, name, sort_order) VALUES
  (1, '本', 0),
  (2, '動画', 1);

CREATE TABLE IF NOT EXISTS tasks (
  id             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  group_id       INT UNSIGNED    NOT NULL DEFAULT 1,
  title          VARCHAR(255)    NOT NULL,
  type_id        INT UNSIGNED    NOT NULL DEFAULT 1,
  granularity    ENUM('章単位','トピック単位'),
  book_id        INT UNSIGNED,
  status         ENUM('未着手','進行中','完了') NOT NULL DEFAULT '未着手',
  planned_date   DATE,
  completed_date DATE,
  study_time     SMALLINT UNSIGNED,
  memo           TEXT,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_tasks_group
    FOREIGN KEY (group_id) REFERENCES groups (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_tasks_book
    FOREIGN KEY (book_id) REFERENCES books (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_tasks_type
    FOREIGN KEY (type_id) REFERENCES task_types (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS task_steps (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  task_id      INT UNSIGNED    NOT NULL,
  title        VARCHAR(255)    NOT NULL,
  is_completed TINYINT(1)      NOT NULL DEFAULT 0,
  sort_order   INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_steps_task
    FOREIGN KEY (task_id) REFERENCES tasks (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- task_categories（言語/技術カテゴリマスタ）
-- =========================================
CREATE TABLE IF NOT EXISTS task_categories (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name         VARCHAR(50)     NOT NULL,
  sort_order   INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_task_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初期データ：「(言語不問)」（id=1固定・削除不可）
INSERT INTO task_categories (id, name, sort_order) VALUES
  (1, '(言語不問)', 0),
  (2,'Java', 1),
  (3,'Python', 2),
  (4,'JavaScript', 3);


-- =========================================
-- tasks（子タスク）にカテゴリ列を追加
-- =========================================
ALTER TABLE tasks
  ADD COLUMN category_id INT UNSIGNED NOT NULL DEFAULT 1 AFTER type_id,
  ADD CONSTRAINT fk_tasks_category
    FOREIGN KEY (category_id) REFERENCES task_categories (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

-- =========================================
-- result_reviews（週次・月次・年次の振り返り）v2.18.0追加
-- =========================================
CREATE TABLE IF NOT EXISTS result_reviews (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  period_type     ENUM('week','month','year') NOT NULL,
  start_date      DATE            NOT NULL,
  end_date        DATE            NOT NULL,
  goal            TEXT,
  achievement     TEXT,
  good_points     TEXT,
  reflection      TEXT,
  memo            TEXT,
  mood            VARCHAR(10),
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_result_reviews_period (period_type, start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- books（書籍マスタ）：メモ欄を「理解したこと」「不明点」に分割 v2.21.9追加
-- 既存の memo カラムはデータ保全のため残置するが、書籍詳細モーダルの
-- UIからは参照しなくなる（理解したこと／不明点の2項目に置き換え）。
-- =========================================
ALTER TABLE books
  ADD COLUMN understood_memo TEXT AFTER memo,
  ADD COLUMN unclear_points  TEXT AFTER understood_memo;