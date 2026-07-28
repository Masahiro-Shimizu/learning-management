"use strict";

// v2.21.28追加：学習実績ログ一覧ページ

const DIFFICULTY_EMOJI = { 1: "😄", 2: "🙂", 3: "😐", 4: "😣", 5: "😫" };
const MOTIVATION_EMOJI = { 1: "😴", 2: "😑", 3: "🙂", 4: "😊", 5: "🔥" };

let studyLogsTaskMap = {};

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
  const hours = (Number(log.study_time || 0) / 60).toFixed(1);
  const difficultyHtml = log.difficulty ? DIFFICULTY_EMOJI[log.difficulty] || "" : "－";
  const motivationHtml = log.motivation ? MOTIVATION_EMOJI[log.motivation] || "" : "－";

  return `
    <tr data-log-id="${log.id}">
      <td>${formatLogDate(log.log_date)}</td>
      <td>${taskTitle}</td>
      <td>${hours}h</td>
      <td>${log.progress_value ?? "－"}</td>
      <td>${difficultyHtml}</td>
      <td>${motivationHtml}</td>
      <td class="task-table-dim">${formatLogDateTime(log.created_at)}</td>
      <td>
        <button type="button" class="btn btn-danger btn-study-log-delete" data-log-id="${log.id}" style="padding:4px 10px;font-size:0.75rem;">削除</button>
      </td>
    </tr>
  `;
}

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

  tbody.innerHTML = "";
  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--color-text-tertiary);padding:var(--space-24);">まだ記録がありません</td></tr>`;
    return;
  }

  logs.forEach((log) => {
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

let studyLogsPageInitialized = false;

async function initStudyLogsPage() {
  if (studyLogsPageInitialized) return;
  studyLogsPageInitialized = true;
  await renderStudyLogsTable();
}
