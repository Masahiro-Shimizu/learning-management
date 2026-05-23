
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

CREATE TABLE IF NOT EXISTS tasks (
  id             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
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
  CONSTRAINT fk_tasks_book
    FOREIGN KEY (book_id) REFERENCES books (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
