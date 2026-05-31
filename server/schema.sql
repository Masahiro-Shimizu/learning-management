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

CREATE TABLE IF NOT EXISTS tasks (
  id             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  group_id       INT UNSIGNED    NOT NULL DEFAULT 1,
  title          VARCHAR(255)    NOT NULL,
  type           ENUM('本','動画','記事','手を動かす練習') NOT NULL,
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
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;