"use strict";

const DIFFICULTY_EMOJI = { 1: "😄", 2: "🙂", 3: "😐", 4: "😣", 5: "😫" };
const MOTIVATION_EMOJI = { 1: "😴", 2: "😑", 3: "🙂", 4: "😊", 5: "🔥" };

let studyLogsTaskMap = {};
let currentLogFilter = "all";
let searchDateString = "";

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
  const difficultyHtml = log.difficulty ? DIFFICULTY_EMOJI[log.difficulty] || "" : "－";
  const motivationHtml = log.motivation ? MOTIVATION_EMOJI[log.motivation] || "" : "－";

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

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const filteredLogs = logs.filter(log => {
    if (!log.log_date) return false;

    const toLocalDateStr = (dateInput) => {
      const d = new Date(dateInput);
      if (Number.isNaN(d.getTime())) {
        return String(dateInput).slice(0, 10);
      }
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const logDateStr = toLocalDateStr(log.log_date);

    // ① カレンダーで日付が指定されている場合
    if (searchDateString) {
      return logDateStr === searchDateString;
    }

    // ② 期間ボタンの条件
    if (currentLogFilter === "all") return true;
    
    const logDate = new Date(log.log_date);
    if (currentLogFilter === "year") {
      return logDate.getFullYear() === now.getFullYear();
    }
    if (currentLogFilter === "month") {
      return logDate.getFullYear() === now.getFullYear() && logDate.getMonth() === now.getMonth();
    }
    if (currentLogFilter === "week") {
      return logDate >= startOfWeek;
    }
    return true;
  });

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

document.addEventListener("click", async (e) => {
  const btnOpenModal = e.target.closest("#btn-open-add-log-modal");
  if (btnOpenModal) {
    editingLogId = null;
    const modal = document.getElementById("add-log-modal");
    if (!modal) return;

    const titleEl = modal.querySelector(".modal-header h3");
    if (titleEl) titleEl.textContent = "✍️ 学習ログの新規手動記録";

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
    document.getElementById("add-log-difficulty").value = "";
    document.getElementById("add-log-motivation").value = "";

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
      if (titleEl) titleEl.textContent = "✏️ 学習ログの編集";

      const formattedDate = log.log_date ? log.log_date.slice(0, 10) : "";
      document.getElementById("add-log-date").value = formattedDate;
      document.getElementById("add-log-task-id").value = log.task_id || "";
      document.getElementById("add-log-book-id").value = log.book_id || "";
      // 変更： 小数点や0も正しく表示されるように ?? を使用
      document.getElementById("add-log-time").value = log.study_time ?? "";
      document.getElementById("add-log-progress").value = log.progress_value || "";
      document.getElementById("add-log-difficulty").value = log.difficulty || "";
      document.getElementById("add-log-motivation").value = log.motivation || "";

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
    const difficulty = document.getElementById("add-log-difficulty").value;
    const motivation = document.getElementById("add-log-motivation").value;

    if (!logDate) {
      alert("📅 学習日を入力してください。");
      return;
    }
    // 変更： 小数点（0.5など）を許可するため !studyTime を削除し、メッセージを変更
    if (isNaN(studyTime) || studyTime <= 0) {
      alert("⏱️ 学習時間を正しい数値（例: 0.5、1.5）で入力してください。");
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
      alert("❌ 学習ログの保存中にエラーが発生しました。");
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

    const groupMap = {};
    groups.forEach(g => { groupMap[g.id] = g.title; });

    const taskSelect = document.getElementById("add-log-task-id");
    const bookSelect = document.getElementById("add-log-book-id");

    if (taskSelect) {
      taskSelect.innerHTML = '<option value="">（タスクに紐づけない・一般学習）</option>';
      tasks.forEach(task => {
        const parentTitle = groupMap[task.group_id] || "未分類";
        const option = document.createElement("option");
        option.value = task.id;
        option.textContent = `[${parentTitle}] ＞ ${task.title}`;
        taskSelect.appendChild(option);
      });
    }

    if (bookSelect) {
      bookSelect.innerHTML = '<option value="">（書籍に紐づけない）</option>';
      books.forEach(book => {
        const option = document.createElement("option");
        option.value = book.id;
        option.textContent = book.title;
        bookSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error("セレクトボックスのデータ取得に失敗しました:", err);
  }
}

// =================================================================
// 💡 イベント制御（カレンダー日付指定 ＆ 期間タブ）
// =================================================================
document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "search-log-date") {
    searchDateString = e.target.value;
    if (searchDateString) {
      document.querySelectorAll(".btn-log-filter").forEach(btn => {
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-secondary");
      });
    }
    renderStudyLogsTable();
  }
});

document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "search-log-date") {
    searchDateString = e.target.value;
    renderStudyLogsTable();
  }
});

document.addEventListener("click", (e) => {
  const filterBtn = e.target.closest(".btn-log-filter");
  if (filterBtn) {
    const searchInput = document.getElementById("search-log-date");
    if (searchInput) searchInput.value = "";
    searchDateString = ""; 

    document.querySelectorAll(".btn-log-filter").forEach(btn => {
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-secondary");
    });
    filterBtn.classList.remove("btn-secondary");
    filterBtn.classList.add("btn-primary");
    
    currentLogFilter = filterBtn.dataset.range;
    renderStudyLogsTable();
  }
});