"use strict";

// v2.21.35変更：難易度・やる気の絵文字マップは廃止。tasks.jsのDIFFICULTY_META/MOTIVATION_META・
// createMetaIconBadgeHtml()/createMetaIconButtonsHtml()を共通利用する

let studyLogsTaskMap = {};
let studyLogsGroupMap = {};
let allTasksForLog = [];
let allBooksForLog = [];

// v2.21.32追加：ダッシュボードと同じ 週/月/年/全 の期間管理に変更
// （dashboard.jsのcurrentPeriod/viewDateと名前が被らないようlogsプレフィックスを付ける）
let logsCurrentPeriod = "week";
let logsViewDate = new Date();

function formatLogDateTime(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatLogDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function createStudyLogRowHtml(log) {
  const taskTitle = studyLogsTaskMap[log.task_id] || (log.task_id ? `#${log.task_id}` : "－");
  // 変更： / 60 を削除して、そのままの数値を小数点第1位で表示
  const hours = Number(log.study_time || 0).toFixed(1);
  const difficultyHtml = log.difficulty ? createMetaIconBadgeHtml("difficulty", log.difficulty) : "－";
  const motivationHtml = log.motivation ? createMetaIconBadgeHtml("motivation", log.motivation) : "－";

  return `
  <td>${formatLogDate(log.log_date)}</td>
      <td>${taskTitle}</td>
      <td>${hours} h</td>
      <td>${log.progress_value != null ? Number(log.progress_value) : "－"}</td>
      <td>${difficultyHtml}</td>
      <td>${motivationHtml}</td>
      <td class="task-table-dim">${formatLogDateTime(log.created_at)}</td>
      <td style="display: flex; gap: 8px;">
        <button type="button" class="btn btn-secondary btn-edit-log" data-id="${log.id}" style="padding:4px 10px; font-size:0.75rem;">編集</button>
        <button type="button" class="btn btn-danger btn-study-log-delete" data-log-id="${log.id}" style="padding:4px 10px; font-size:0.75rem;">削除</button>
      </td>
    </tr>
  `;
}

// =================================================================
// 💡 期間トグル（週/月/年/全）の管理 v2.21.32追加
//    dashboard.jsと同ロジックだが、名前衝突を避けるためlogsプレフィックス
// =================================================================
function getLogsWeekStart(date) {
  const dayOfWeek = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getLogsPeriodRange(period, baseDate) {
  if (period === "week") {
    const monday = getLogsWeekStart(baseDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  }
  if (period === "month") {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    return {
      start: new Date(year, month, 1, 0, 0, 0, 0),
      end: new Date(year, month + 1, 0, 23, 59, 59, 999),
    };
  }
  if (period === "year") {
    const year = baseDate.getFullYear();
    return {
      start: new Date(year, 0, 1, 0, 0, 0, 0),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }
  return null; // "all"
}

function isLogsCurrentPeriod() {
  const today = new Date();
  if (logsCurrentPeriod === "week") {
    return (
      getLogsWeekStart(logsViewDate).getTime() ===
      getLogsWeekStart(today).getTime()
    );
  } else if (logsCurrentPeriod === "month") {
    return (
      logsViewDate.getFullYear() === today.getFullYear() &&
      logsViewDate.getMonth() === today.getMonth()
    );
  } else if (logsCurrentPeriod === "year") {
    return logsViewDate.getFullYear() === today.getFullYear();
  }
  return true;
}

function updateLogsPeriodLabel() {
  const label = document.getElementById("log-period-label");
  if (!label) return;
  let text = "";

  if (logsCurrentPeriod === "week") {
    const monday = getLogsWeekStart(logsViewDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    text = `${monday.getMonth() + 1}/${monday.getDate()} 〜 ${sunday.getMonth() + 1}/${sunday.getDate()}`;
  } else if (logsCurrentPeriod === "month") {
    text = `${logsViewDate.getFullYear()}年${logsViewDate.getMonth() + 1}月`;
  } else if (logsCurrentPeriod === "year") {
    text = `${logsViewDate.getFullYear()}年`;
  } else if (logsCurrentPeriod === "all") {
    text = "全期間";
  }

  label.textContent = text;

  const nextBtn = document.getElementById("log-period-next-btn");
  if (nextBtn) {
    nextBtn.disabled = logsCurrentPeriod === "all" || isLogsCurrentPeriod();
  }
}

function shiftLogsPeriod(direction) {
  if (logsCurrentPeriod === "week") {
    logsViewDate.setDate(logsViewDate.getDate() + 7 * direction);
  } else if (logsCurrentPeriod === "month") {
    logsViewDate.setMonth(logsViewDate.getMonth() + direction);
  } else if (logsCurrentPeriod === "year") {
    logsViewDate.setFullYear(logsViewDate.getFullYear() + direction);
  }
  renderStudyLogsTable();
}

function logsDateToIsoWeekString(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function logsIsoWeekStringToMonday(value) {
  const [yearStr, weekStr] = value.split("-W");
  const year = Number(yearStr);
  const week = Number(weekStr);
  if (!year || !week) return null;
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay() || 7;
  simple.setDate(simple.getDate() - dayOfWeek + 1);
  return simple;
}

function openLogsPeriodPicker() {
  if (logsCurrentPeriod === "all") return;

  const weekPicker = document.getElementById("log-period-week-picker");
  const monthPicker = document.getElementById("log-period-month-picker");
  const yearPicker = document.getElementById("log-period-year-picker");

  let target = null;

  if (logsCurrentPeriod === "week" && weekPicker) {
    weekPicker.value = logsDateToIsoWeekString(logsViewDate);
    target = weekPicker;
  } else if (logsCurrentPeriod === "month" && monthPicker) {
    const y = logsViewDate.getFullYear();
    const m = String(logsViewDate.getMonth() + 1).padStart(2, "0");
    monthPicker.value = `${y}-${m}`;
    target = monthPicker;
  } else if (logsCurrentPeriod === "year" && yearPicker) {
    yearPicker.value = `${logsViewDate.getFullYear()}-01`;
    target = yearPicker;
  }

  if (!target) return;
  if (typeof target.showPicker === "function") {
    target.showPicker();
  } else {
    target.focus();
    target.click();
  }
}


// =================================================================
// 💡 テーブル描画とカレンダー/期間フィルタリング処理
// =================================================================
async function renderStudyLogsTable() {
  const tbody = document.getElementById("study-logs-table-body");
  if (!tbody) return;

  const [logs, tasks] = await Promise.all([
    api("/api/study-logs"),
    api("/api/tasks"),
  ]);

  studyLogsTaskMap = {};
  tasks.forEach((t) => {
    studyLogsTaskMap[t.id] = t.title;
  });

  // v2.21.32修正：週/月/年/全のトグルに対応した期間範囲フィルタリングに変更
  updateLogsPeriodLabel();

  const currentRange =
    logsCurrentPeriod === "all"
      ? null
      : getLogsPeriodRange(logsCurrentPeriod, logsViewDate);

      const filteredLogs = logs.filter((log) => {
        if (!log.log_date) return false;
        if (!currentRange) return true;
    
        const logDate = new Date(log.log_date);
        return logDate >= currentRange.start && logDate <= currentRange.end;
      });
    
      // v2.21.32で描画前のクリア処理が抜けていたため復元
      // （再描画のたびに行が積み重なって重複表示されるバグの修正）
      tbody.innerHTML = "";
      if (filteredLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--color-text-tertiary);padding:var(--space-24);">該当する記録がありません</td></tr>`;
        return;
      }
    
      filteredLogs.forEach((log) => {
        tbody.insertAdjacentHTML("beforeend", createStudyLogRowHtml(log));
      });

  tbody.querySelectorAll(".btn-study-log-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const logId = btn.dataset.logId;
      if (!confirm("この記録を削除しますか？")) return;
      await api(`/api/study-logs/${logId}`, "DELETE");
      await renderStudyLogsTable();
    });
  });
}

async function initStudyLogsPage() {
  await renderStudyLogsTable();
}

// =================================================================
// 💡 手動記録・編集モーダルの制御
// =================================================================
let editingLogId = null;

// v2.21.35追加：追加/編集ログモーダルの難易度・やる気アイコンボタン選択（トグル）
document.addEventListener("click", (e) => {
  const metaBtn = e.target.closest("#add-log-modal .step-meta-icon-btn");
  if (!metaBtn) return;
  const row = metaBtn.closest(".step-meta-icon-row");
  const wasActive = metaBtn.classList.contains("active");
  row.querySelectorAll(".step-meta-icon-btn").forEach((btn) => btn.classList.remove("active"));
  if (!wasActive) metaBtn.classList.add("active");
});

document.addEventListener("click", async (e) => {
  const btnOpenModal = e.target.closest("#btn-open-add-log-modal");
  if (btnOpenModal) {
    editingLogId = null;
    const modal = document.getElementById("add-log-modal");
    if (!modal) return;

    const titleEl = modal.querySelector(".modal-header h3");
    if (titleEl) titleEl.innerHTML = `<span class="icon-btn-inline">${PENCIL_ICON}</span>学習ログの新規手動記録`;

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    document.getElementById("add-log-date").value = `${y}-${m}-${d}`;

    await loadSelectOptionsForLog();

    document.getElementById("add-log-task-id").value = "";
    document.getElementById("add-log-book-id").value = "";
    document.getElementById("add-log-time").value = "";
    document.getElementById("add-log-progress").value = "";
    // v2.21.35変更：難易度・やる気はアイコンボタンとして再描画（未選択状態）
    document.getElementById("add-log-difficulty-buttons").innerHTML = createMetaIconButtonsHtml("difficulty", null);
    document.getElementById("add-log-motivation-buttons").innerHTML = createMetaIconButtonsHtml("motivation", null);

    modal.classList.remove("hidden");
    return;
  }

  const btnEditLog = e.target.closest(".btn-edit-log");
  if (btnEditLog) {
    const logId = btnEditLog.dataset.id;
    if (!logId) return;

    editingLogId = parseInt(logId, 10);
    const modal = document.getElementById("add-log-modal");
    if (!modal) return;

    try {
      const log = await api(`/api/study-logs/${logId}`);
      await loadSelectOptionsForLog();

      const titleEl = modal.querySelector(".modal-header h3");
      if (titleEl) titleEl.innerHTML = `<span class="icon-btn-inline">${PENCIL_ICON}</span>学習ログの編集`;

      const formattedDate = log.log_date ? log.log_date.slice(0, 10) : "";
      document.getElementById("add-log-date").value = formattedDate;
      document.getElementById("add-log-task-id").value = log.task_id || "";
      document.getElementById("add-log-book-id").value = log.book_id || "";

      // 保存済みの子タスク・書籍の紐づきに応じて、もう片方のセレクトも絞り込む（v2.21.34追加）
      if (log.book_id) {
        syncLogSelectFilters("book");
      } else if (log.task_id) {
        syncLogSelectFilters("task");
      }

      // 変更： 小数点や0も正しく表示されるように ?? を使用
      document.getElementById("add-log-time").value = log.study_time ?? "";
      document.getElementById("add-log-progress").value = log.progress_value || "";
      // v2.21.35変更：難易度・やる気はアイコンボタンとして再描画（保存済みの値を選択状態にする）
      document.getElementById("add-log-difficulty-buttons").innerHTML = createMetaIconButtonsHtml("difficulty", log.difficulty || null);
      document.getElementById("add-log-motivation-buttons").innerHTML = createMetaIconButtonsHtml("motivation", log.motivation || null);

      modal.classList.remove("hidden");
    } catch (err) {
      console.error("ログ詳細の取得に失敗しました:", err);
      alert("❌ ログデータの取得に失敗しました。");
    }
    return;
  }

  if (e.target.closest("#btn-close-add-log-modal") || e.target.closest("#btn-cancel-add-log") || e.target.id === "add-log-modal") {
    const modal = document.getElementById("add-log-modal");
    if (modal) modal.classList.add("hidden");
    editingLogId = null;
    return;
  }

  const btnSave = e.target.closest("#btn-save-add-log");
  if (btnSave) {
    const logDate = document.getElementById("add-log-date").value;
    const taskId = document.getElementById("add-log-task-id").value;
    const bookId = document.getElementById("add-log-book-id").value;
    // 変更： 小数点を受け取るために parseFloat に変更
    const studyTime = parseFloat(document.getElementById("add-log-time").value);
    const progressValue = parseInt(document.getElementById("add-log-progress").value, 10) || 0;
    const activeDifficultyBtn = document.querySelector('#add-log-difficulty-buttons .step-meta-icon-btn.active');
    const activeMotivationBtn = document.querySelector('#add-log-motivation-buttons .step-meta-icon-btn.active');
    const difficulty = activeDifficultyBtn ? activeDifficultyBtn.dataset.value : "";
    const motivation = activeMotivationBtn ? activeMotivationBtn.dataset.value : "";

    if (!logDate) {
      alert("学習日を入力してください。");
      return;
    }
    // 変更： 小数点（0.5など）を許可するため !studyTime を削除し、メッセージを変更
    if (isNaN(studyTime) || studyTime <= 0) {
      alert("学習時間を正しい数値（例: 0.5、1.5）で入力してください。");
      return;
    }

    try {
      const body = {
        log_date: logDate,
        task_id: taskId ? parseInt(taskId, 10) : null,
        step_id: null,
        book_id: bookId ? parseInt(bookId, 10) : null,
        study_time: studyTime,
        progress_value: progressValue,
        difficulty: difficulty ? parseInt(difficulty, 10) : null,
        motivation: motivation ? parseInt(motivation, 10) : null
      };

      if (editingLogId) {
        await api(`/api/study-logs/${editingLogId}`, "PUT", body);
      } else {
        await api("/api/study-logs", "POST", body);
      }

      const modal = document.getElementById("add-log-modal");
      if (modal) modal.classList.add("hidden");
      editingLogId = null;
      
      renderStudyLogsTable();
    } catch (err) {
      console.error("ログ保存エラー:", err);
      alert("学習ログの保存中にエラーが発生しました。");
    }
  }
});

async function loadSelectOptionsForLog() {
  try {
    const [groups, tasks, books] = await Promise.all([
      api("/api/groups"),
      api("/api/tasks"),
      api("/api/books")
    ]);

    studyLogsGroupMap = {};
    groups.forEach(g => { studyLogsGroupMap[g.id] = g.title; });

    allTasksForLog = tasks;
    allBooksForLog = books;

    renderTaskOptionsForLog(null, "");
    renderBookOptionsForLog(null, "");
  } catch (err) {
    console.error("セレクトボックスのデータ取得に失敗しました:", err);
  }
}

// 💡 子タスク⇔書籍の相互絞り込み（v2.21.34追加）
// filterBookId を渡すと、その書籍に紐づく子タスクのみに絞り込んで描画する
function renderTaskOptionsForLog(filterBookId, selectedValue) {
  const taskSelect = document.getElementById("add-log-task-id");
  if (!taskSelect) return;

  const list = filterBookId
    ? allTasksForLog.filter(t => String(t.book_id) === String(filterBookId))
    : allTasksForLog;

  taskSelect.innerHTML = '<option value="">（タスクに紐づけない・一般学習）</option>';
  list.forEach(task => {
    const parentTitle = studyLogsGroupMap[task.group_id] || "未分類";
    const option = document.createElement("option");
    option.value = task.id;
    option.textContent = `[${parentTitle}] ＞ ${task.title}`;
    taskSelect.appendChild(option);
  });

  const stillValid = selectedValue && list.some(t => String(t.id) === String(selectedValue));
  taskSelect.value = stillValid ? selectedValue : "";
}

// filterBookId を渡すと、その書籍のみに絞り込んで描画する
function renderBookOptionsForLog(filterBookId, selectedValue) {
  const bookSelect = document.getElementById("add-log-book-id");
  if (!bookSelect) return;

  const list = filterBookId
    ? allBooksForLog.filter(b => String(b.id) === String(filterBookId))
    : allBooksForLog;

  bookSelect.innerHTML = '<option value="">（書籍に紐づけない）</option>';
  list.forEach(book => {
    const option = document.createElement("option");
    option.value = book.id;
    option.textContent = book.title;
    bookSelect.appendChild(option);
  });

  const stillValid = selectedValue && list.some(b => String(b.id) === String(selectedValue));
  bookSelect.value = stillValid ? selectedValue : "";
}

// 子タスク選択 or 書籍選択の変更をもう片方に反映する
function syncLogSelectFilters(source) {
  const taskSelect = document.getElementById("add-log-task-id");
  const bookSelect = document.getElementById("add-log-book-id");
  if (!taskSelect || !bookSelect) return;

  if (source === "task") {
    const taskId = taskSelect.value;
    if (!taskId) {
      renderBookOptionsForLog(null, bookSelect.value);
      return;
    }
    const task = allTasksForLog.find(t => String(t.id) === String(taskId));
    if (task && task.book_id) {
      renderBookOptionsForLog(task.book_id, task.book_id);
    } else {
      renderBookOptionsForLog(null, bookSelect.value);
    }
  } else if (source === "book") {
    const bookId = bookSelect.value;
    renderTaskOptionsForLog(bookId || null, taskSelect.value);
  }
}

document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "add-log-task-id") {
    syncLogSelectFilters("task");
  }
  if (e.target && e.target.id === "add-log-book-id") {
    syncLogSelectFilters("book");
  }
});

// =================================================================
// 💡 イベント制御（カレンダー日付指定 ＆ 期間タブ）
// =================================================================
// v2.21.32追加：週/月/年/全トグル
document.addEventListener("click", (e) => {
  const periodBtn = e.target.closest(".btn-log-period");
  if (periodBtn) {
    document.querySelectorAll(".btn-log-period").forEach((b) => {
      b.classList.remove("active");
    });
    periodBtn.classList.add("active");

    logsCurrentPeriod = periodBtn.dataset.logPeriod;
    logsViewDate = new Date();
    renderStudyLogsTable();
  }
});

document
  .getElementById("log-period-prev-btn")
  ?.addEventListener("click", () => shiftLogsPeriod(-1));
document
  .getElementById("log-period-next-btn")
  ?.addEventListener("click", () => shiftLogsPeriod(1));

document
  .getElementById("log-period-label-wrap")
  ?.addEventListener("click", openLogsPeriodPicker);
document
  .getElementById("log-period-label-wrap")
  ?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLogsPeriodPicker();
    }
  });

document
  .getElementById("log-period-week-picker")
  ?.addEventListener("change", (e) => {
    const monday = logsIsoWeekStringToMonday(e.target.value);
    if (!monday) return;
    logsViewDate = monday;
    renderStudyLogsTable();
  });

document
  .getElementById("log-period-month-picker")
  ?.addEventListener("change", (e) => {
    const value = e.target.value;
    if (!value) return;
    const [y, m] = value.split("-").map(Number);
    logsViewDate = new Date(y, m - 1, 1);
    renderStudyLogsTable();
  });

document
  .getElementById("log-period-year-picker")
  ?.addEventListener("change", (e) => {
    const value = e.target.value;
    if (!value) return;
    const [y] = value.split("-").map(Number);
    logsViewDate = new Date(y, 0, 1);
    renderStudyLogsTable();
  });