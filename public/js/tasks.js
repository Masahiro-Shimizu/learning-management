"use strict";

function minutesToHours(minutes) {
  if (!minutes) return "0.0";
  return (Math.round((Number(minutes) / 60) * 10) / 10).toFixed(1);
}

// new_str
const CALENDAR_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const CLOCK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>`;

// v2.21.35追加：✅の代替（実績バッジ用）
const CHECK_CIRCLE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>`;

// v2.21.35追加：体感の難易度・その日のやる気のアイコンセット（絵文字からの置き換え）
const SMILE_PLUS_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.267 2.08a10 10 0 108.653 8.653"/><path d="M15 10V9"/><path d="M16 5h6"/><path d="M16.472 15a6 6 0 01-8.943 0"/><path d="M19 2v6"/><path d="M9 10V9"/></svg>`;
const SMILE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 10V9"/><path d="M16.472 15a6 6 0 01-8.943 0"/><path d="M9 10V9"/><circle cx="12" cy="12" r="10"/></svg>`;
const MEH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 10V9"/><path d="M8 16h8"/><path d="M9 10V9"/><circle cx="12" cy="12" r="10"/></svg>`;
const FROWN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 10V9"/><path d="M9 10V9"/><path d="M9 16a5 5 0 016 0"/><circle cx="12" cy="12" r="10"/></svg>`;
const ANGRY_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 11V9.416"/><path d="M17 9a5 5 0 00-3 1"/><path d="M7 9a5 5 0 013 1"/><path d="M9 11V9.416"/><path d="M9 16a5 5 0 016.001 0"/><circle cx="12" cy="12" r="10"/></svg>`;
const MOON_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>`;
const CLOUD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`;
const SUN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
const ZAP_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"/></svg>`;
const FLAME_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/></svg>`;

// v2.21.35追加：難易度・やる気の値→アイコン/色/ラベルのメタ情報
const DIFFICULTY_META = [
  { value: 1, icon: SMILE_PLUS_ICON, color: "#5DCAA5", bg: "rgba(93,202,165,0.16)", label: "超簡単" },
  { value: 2, icon: SMILE_ICON, color: "#9FE1CB", bg: "rgba(159,225,203,0.14)", label: "やや易しい" },
  { value: 3, icon: MEH_ICON, color: "#B4B2A9", bg: "rgba(180,178,169,0.14)", label: "普通" },
  { value: 4, icon: FROWN_ICON, color: "#FAC775", bg: "rgba(250,199,117,0.16)", label: "やや難しい" },
  { value: 5, icon: ANGRY_ICON, color: "#F09595", bg: "rgba(240,149,149,0.16)", label: "激ムズ" },
];
const MOTIVATION_META = [
  { value: 1, icon: MOON_ICON, color: "#B4B2A9", bg: "rgba(180,178,169,0.14)", label: "やる気なし" },
  { value: 2, icon: CLOUD_ICON, color: "#85B7EB", bg: "rgba(133,183,235,0.16)", label: "微妙" },
  { value: 3, icon: SUN_ICON, color: "#FAC775", bg: "rgba(250,199,117,0.16)", label: "普通" },
  { value: 4, icon: ZAP_ICON, color: "#F0997B", bg: "rgba(240,153,123,0.16)", label: "やる気あり" },
  { value: 5, icon: FLAME_ICON, color: "#F09595", bg: "rgba(240,149,149,0.16)", label: "最高潮" },
];

// v2.21.35追加：難易度/やる気のアイコンボタン行を生成（step-detail・追加ログモーダル共通）
function createMetaIconButtonsHtml(metaType, selectedValue) {
  const items = metaType === "difficulty" ? DIFFICULTY_META : MOTIVATION_META;
  const buttons = items
    .map((item) => {
      const active = String(selectedValue) === String(item.value) ? " active" : "";
      return `
        <button type="button" class="step-meta-icon-btn${active}" data-value="${item.value}" title="${item.label}" aria-label="${item.label}">
          <span class="step-meta-icon-box" style="background:${item.bg};color:${item.color};">${item.icon}</span>
          <span class="step-meta-icon-label">${item.label}</span>
        </button>
      `;
    })
    .join("");
  return `<div class="step-meta-icon-row" data-meta="${metaType}">${buttons}</div>`;
}

// v2.21.35追加：学習ログ一覧テーブルなど、表示専用の小さいバッジを生成
function createMetaIconBadgeHtml(metaType, value) {
  if (!value) return "";
  const items = metaType === "difficulty" ? DIFFICULTY_META : MOTIVATION_META;
  const item = items.find((i) => Number(i.value) === Number(value));
  if (!item) return "";
  return `<span class="meta-icon-badge" style="background:${item.bg};color:${item.color};" title="${item.label}">${item.icon}</span>`;
}

// v2.21.35追加：アプリ全体の絵文字置き換え用アイコン
const CHECK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;
const TRIANGLE_ALERT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
const BOT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`;
const LIST_CHECKS_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/></svg>`;
const BOOK_OPEN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v16"/><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/></svg>`;
const LINK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
const ROCKET_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"/><path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"/></svg>`;
const BRAIN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/></svg>`;
const PENCIL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 21h8"/><path d="m15 5 4 4"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>`;

let taskTypeOptions = [];
let taskCategoryOptions = [];

async function loadTaskTypeOptions() {
  taskTypeOptions = await api("/api/task-types");
  const select = document.getElementById("task-type");
  select.innerHTML = "";
  taskTypeOptions.forEach((type) => {
    const option = document.createElement("option");
    option.value = type.id;
    option.textContent = type.name;
    select.appendChild(option);
  });
}

async function loadTaskCategoryOptions() {
  taskCategoryOptions = await api("/api/task-categories");
  const select = document.getElementById("task-category");
  select.innerHTML = "";
  taskCategoryOptions.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    select.appendChild(option);
  });
}

const TASK_TYPE_COLOR_CLASSES = [
  "book",
  "video",
  "article",
  "practice",
  "teal",
  "rose",
  "lime",
];

function getTypeInfo(typeName) {
  if (!typeName) return { label: "", class: "default" };
  let hash = 0;
  for (let i = 0; i < typeName.length; i++) {
    hash =
      (hash * 31 + typeName.charCodeAt(i)) % TASK_TYPE_COLOR_CLASSES.length;
  }
  return { label: typeName, class: TASK_TYPE_COLOR_CLASSES[hash] };
}

// ==========================================
// タスク・カテゴリ共通処理
// ==========================================

// ===== グラフ用カラーパレット（カテゴリ名固定・全ダッシュボードグラフ共通） =====
const CHART_COLORS = [
  "#4d7fd4",
  "#e6a817",
  "#3a9d6e",
  "#e05c5c",
  "#9b6fd4",
  "#4dc4d4",
  "#d46f9b",
  "#7fd46f",
];

// ===== カテゴリの色（GitHub言語色 + グラフ/バッジ共通） =====
const GITHUB_LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  HTML: "#e34c26",
  CSS: "#563d7c",
  "HTML&CSS": "#e34c26",
  React: "#61dafb",
  Shell: "#89e051",
  Dart: "#00B4AB",
  SQL: "#e38c00",
};

// hex → rgba変換（バッジの半透明背景生成に使用）
function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// カテゴリ名 → 色（hex）
function getCategoryChartColor(categoryName) {
  const name = categoryName || "(言語不問)";
  if (GITHUB_LANGUAGE_COLORS[name]) {
    return GITHUB_LANGUAGE_COLORS[name];
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % CHART_COLORS.length;
  }
  return CHART_COLORS[hash];
}

/**
 * カテゴリのバッジHTMLを生成する（GitHub色・グラフ共通カラー同期版）
 */
function createCategoryBadgeHtml(categoryName) {
  const label = categoryName || "(言語不問)";
  const color = getCategoryChartColor(label);
  return `<span class="task-category-badge" style="background-color:${hexToRgba(color, 0.18)};color:${color};">${label}</span>`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getTaskDisplayDate(task) {
  const raw =
    task.start_planned_date ||
    task.end_planned_date ||
    task.start_date ||
    task.end_date;
  return formatDateShort(raw);
}

function createTimeHtml(task) {
  const planned = task.planned_study_time;
  const actual = task.study_time;

  if (!planned && !actual) return "";

  if (planned && !actual) {
    const h = (Number(planned) / 60).toFixed(1);
    return h !== "0.0"
      ? `<span class="task-card-meta-item">${CLOCK_ICON}予定 ${h}h</span>`
      : "";
  }

  if (!planned && actual) {
    const h = (Number(actual) / 60).toFixed(1);
    return h !== "0.0"
      ? `<span class="task-card-meta-item task-card-meta-item--actual">${CLOCK_ICON}実績 ${h}h</span>`
      : "";
  }

  // 両方あり
  const ph = (Number(planned) / 60).toFixed(1);
  const ah = (Number(actual) / 60).toFixed(1);
  return `<span class="task-card-meta-item">${CLOCK_ICON}予定 ${ph}h / <span style="color: #16a34a;">実績 ${ah}h</span></span>`;
}

function createStepBadgeHtml(steps) {
  if (!steps || steps.length === 0) return "";
  const completed = steps.filter((s) => s.is_completed).length;
  return `<span class="task-card-meta-item task-step-badge">${completed}/${steps.length}</span>`;
}

function createStepMiniItemHtml(step) {
  const completed = step.is_completed ? "completed" : "";
  const metaParts = [];
  // new_str
  if (step.start_planned_date || step.end_planned_date) {
    const s = step.start_planned_date ? formatDateShort(step.start_planned_date) : "";
    const e = step.end_planned_date ? formatDateShort(step.end_planned_date) : "";
    metaParts.push(`<span class="mini-meta-icon">${CALENDAR_ICON}</span>${s && e ? `${s}〜${e}` : s || e}`);
  }
  if (step.start_date || step.end_date) {
    const s = step.start_date ? formatDateShort(step.start_date) : "";
    const e = step.end_date ? formatDateShort(step.end_date) : "";
    metaParts.push(`<span class="mini-meta-icon">${CHECK_CIRCLE_ICON}</span>${s && e ? `${s}〜${e}` : s || e}`);
  }
  if (step.planned_study_time) metaParts.push(`<span class="mini-meta-icon">${CLOCK_ICON}</span>予定${minutesToHours(step.planned_study_time)}h`);
  if (step.study_time) metaParts.push(`<span class="mini-meta-icon">${CLOCK_ICON}</span>実績${minutesToHours(step.study_time)}h`);
  const metaHtml = metaParts.length
    ? `<span class="task-card-step-mini-meta">${metaParts.join(" ")}</span>`
    : "";
  return `
    <li class="task-card-step-mini-item ${completed}">
      <span class="task-card-step-mini-dot"></span>
      <span class="task-card-step-mini-title">${step.title}</span>
      ${metaHtml}
    </li>
  `;
}

function createTaskCardHtml(task, steps = []) {
  const typeInfo = getTypeInfo(task.type_name);
  const categoryBadgeHtml = createCategoryBadgeHtml(task.category_name);
  const displayDate = getTaskDisplayDate(task);

  const dateHtml = displayDate
    ? `<span class="task-card-meta-item">${CALENDAR_ICON}${displayDate}</span>`
    : "";
  const timeHtml = createTimeHtml(task);
  const stepBadgeHtml = createStepBadgeHtml(steps);

  // v2.21.22追加：ステップ（孫タスク）の開閉表示
  const stepToggleHtml =
    steps.length > 0
      ? `
      <button type="button" class="task-card-step-toggle" data-task-id="${task.id}">
        <span class="task-card-step-toggle-arrow">▶</span> ステップ (${steps.filter((s) => s.is_completed).length}/${steps.length})
      </button>
      <ul class="task-card-step-mini-list hidden" data-task-id="${task.id}">
        ${steps.map(createStepMiniItemHtml).join("")}
      </ul>
    `
      : "";

  return `
    <article class="task-card task-card--${typeInfo.class}" data-task-id="${task.id}" tabindex="0">
      <div class="task-card-badges">
        <span class="task-type-badge task-type-badge--${typeInfo.class}">${typeInfo.label}</span>
        ${categoryBadgeHtml}
      </div>
      <p class="task-card-title">${task.title}</p>
      <div class="task-card-meta">
        ${dateHtml}
        ${timeHtml}
        ${stepBadgeHtml}
      </div>
      ${stepToggleHtml}
    </article>
  `;
}

function calcStatus(groupId, tasks) {
  const children = tasks.filter((t) => t.group_id === groupId);
  if (children.length === 0) return "未着手";

  const currentYear = new Date().getFullYear();
  const completedThisYear = (t) =>
    t.status === "完了" &&
    t.end_date &&
    new Date(t.end_date).getFullYear() === currentYear;

  if (children.every(completedThisYear)) return "完了";
  if (children.every((t) => t.status === "未着手")) return "未着手";
  return "進行中";
}

// ===== グループの並び替え =====

function sortGroupsByCreatedAtDesc(groups) {
  return [...groups].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });
}

function sortGroupsByEarliestPlannedDate(groups, tasks) {
  const withDate = [];
  const withoutDate = [];

  groups.forEach((group) => {
    const dates = tasks
      .filter(
        (t) => String(t.group_id) === String(group.id) && t.start_planned_date,
      )
      .map((t) => new Date(t.start_planned_date).getTime())
      .filter((time) => !Number.isNaN(time));

    if (dates.length === 0) {
      withoutDate.push(group);
    } else {
      withDate.push({ group, earliest: Math.min(...dates) });
    }
  });

  withDate.sort((a, b) => a.earliest - b.earliest);
  withoutDate.sort((a, b) => Number(a.id) - Number(b.id));

  return [...withDate.map((entry) => entry.group), ...withoutDate];
}

function groupStepsByTaskId(allSteps) {
  const map = {};
  allSteps.forEach((step) => {
    if (!map[step.task_id]) map[step.task_id] = [];
    map[step.task_id].push(step);
  });
  return map;
}

function createGroupCardHtml(group, childTasks, stepsByTaskId, status) {
  const childrenHTML = childTasks
    .map((t) => createTaskCardHtml(t, stepsByTaskId[t.id] || []))
    .join("");

  const totalChildren = childTasks.length;
  const completedChildren = childTasks.filter(
    (t) => t.status === "完了",
  ).length;
  const progressPercent =
    totalChildren > 0
      ? Math.round((completedChildren / totalChildren) * 100)
      : 0;

  const progressHTML = `
    <div class="group-card-progress">
      <div class="group-card-progress-bar">
        <i style="width: ${progressPercent}%;"></i>
      </div>
      <span class="group-card-progress-label">${progressPercent}%</span>
    </div>
  `;

  const statusClassMap = { 未着手: "todo", 進行中: "inprogress", 完了: "done" };
  const modifierClass = statusClassMap[status] || "todo";

  return `
    <div class="group-card group-card--${modifierClass}" data-group-id="${group.id}">
      <div class="group-card-header">
        <div style="flex: 1; min-width: 0;">
          <p class="group-card-title">${group.title}</p>
          ${progressHTML}
        </div>
        <button type="button" class="btn-edit-group" data-group-id="${group.id}" aria-label="親タスクを編集">編集</button>
      </div>
      <div class="group-card-children hidden">
        <button type="button" class="btn-add-task" data-group-id="${group.id}">+ 子タスク追加</button>
        ${childrenHTML}
      </div>
    </div>
  `;
}

// 💡 【修正】自動計算ロック機能を組み込んだモーダル展開処理
function openGroupModal(groupId = "") {
  document.getElementById("group-title").value = "";
  document.getElementById("group-memo").value = "";
  const colorInput = document.getElementById('group-color');
  if (colorInput) colorInput.value = '#8b5cf6';

  document.getElementById("group-modal").dataset.groupId = groupId;
  
  // 新規作成時は日付フィールドを空＆ロック解除
  setGroupModalDates({}, false);

  document.getElementById("btn-group-add-task-wrapper").classList.add("hidden");
  document.getElementById("group-modal").classList.remove("hidden");
  markGroupModalClean();
}

async function openGroupEditModal(groupId) {
  const groupDb = await api(`/api/groups/${groupId}`);
  
  // 既存タスクから自動計算情報を付与
  const tasks = lastTaskViewData ? lastTaskViewData.tasks : [];
  const [group] = calculateGroupMilestones([groupDb], tasks);

  document.getElementById("group-title").value = group.title;
  document.getElementById("group-memo").value = group.memo || "";
  const colorInput = document.getElementById('group-color');
  if (colorInput) colorInput.value = group.color || '#8b5cf6';

  document.getElementById("group-modal").dataset.groupId = groupId;
  
  // 自動計算データの設定と入力ロック判定
  setGroupModalDates(group, group.is_auto_calculated);

  document.getElementById("btn-group-add-task-wrapper").classList.add("hidden");
  document.getElementById("group-modal").classList.remove("hidden");
  markGroupModalClean();
}

// 💡 ヘルパー関数: モーダルの日付フィールド設定とロック制御
function setGroupModalDates(group, isAuto) {
  const plannedStartInput = document.getElementById('group-planned-start');
  const plannedEndInput   = document.getElementById('group-planned-end');
  const actualStartInput  = document.getElementById('group-actual-start');
  const actualEndInput    = document.getElementById('group-actual-end');
  const autoBadge         = document.getElementById('group-auto-badge');

  if(plannedStartInput) plannedStartInput.value = group.planned_start ? group.planned_start.slice(0, 10) : '';
  if(plannedEndInput)   plannedEndInput.value   = group.planned_end   ? group.planned_end.slice(0, 10)   : '';
  if(actualStartInput)  actualStartInput.value  = group.actual_start  ? group.actual_start.slice(0, 10)  : '';
  if(actualEndInput)    actualEndInput.value    = group.actual_end    ? group.actual_end.slice(0, 10)    : '';

  [plannedStartInput, plannedEndInput, actualStartInput, actualEndInput].forEach(input => {
    if (!input) return;
    input.disabled = isAuto;
    input.style.opacity = isAuto ? '0.6' : '1.0';
    input.style.cursor  = isAuto ? 'not-allowed' : 'pointer';
    input.style.backgroundColor = isAuto ? 'rgba(255, 255, 255, 0.03)' : '';
  });

  if (autoBadge) {
    if (isAuto) {
      autoBadge.classList.remove('hidden');
      autoBadge.title = `紐づく ${group.child_count || 0} 件の子タスクから自動計算されています`;
    } else {
      autoBadge.classList.add('hidden');
    }
  }
}

// ===== ステップ（孫タスク）関連 =====

function createStepItemHtml(step) {
  const completed = step.is_completed ? "completed" : "";
  const checked = step.is_completed ? "checked" : "";

  // サブテキスト（日付・時間が設定されている場合のみ表示）
  const metaParts = [];
  if (step.start_planned_date || step.end_planned_date) {
    const s = step.start_planned_date
      ? formatDateShort(step.start_planned_date)
      : "";
    const e = step.end_planned_date
      ? formatDateShort(step.end_planned_date)
      : "";
    // new_str
    metaParts.push(`<span class="mini-meta-icon">${CALENDAR_ICON}</span>${s && e ? `${s}〜${e}` : s || e}`);
  }

  // 【変更】実績開始日・実績終了日のバッジ表示
  if (step.start_date || step.end_date) {
    const as = step.start_date ? formatDateShort(step.start_date) : "";
    const ae = step.end_date ? formatDateShort(step.end_date) : "";
    metaParts.push(`<span class="mini-meta-icon">${CHECK_CIRCLE_ICON}</span>実績 ${as && ae ? `${as}〜${ae}` : as || ae}`);
  }

  if (step.planned_study_time) {
    metaParts.push(`<span class="mini-meta-icon">${CLOCK_ICON}</span>予定 ${minutesToHours(step.planned_study_time)}h`);
  }
  if (step.study_time) {
    metaParts.push(`<span class="mini-meta-icon">${CLOCK_ICON}</span>実績 ${minutesToHours(step.study_time)}h`);
  }
  const metaHtml =
    metaParts.length > 0
      ? `<div class="step-item-meta">${metaParts.map((p) => `<span>${p}</span>`).join("")}</div>`
      : "";

  const spd = step.start_planned_date
    ? formatDateForInput(step.start_planned_date)
    : "";
  const epd = step.end_planned_date
    ? formatDateForInput(step.end_planned_date)
    : "";

  // 【変更】実績日を「開始」と「終了」に分ける
  const asd = step.start_date ? formatDateForInput(step.start_date) : "";
  const aed = step.end_date ? formatDateForInput(step.end_date) : "";

  const pst = step.planned_study_time
    ? minutesToHours(step.planned_study_time)
    : "";
  const st = step.study_time ? minutesToHours(step.study_time) : "";
  const hasBook = !!document.getElementById("task-book-id")?.value;

  return `
    <li class="step-item ${completed}" data-step-id="${step.id}" data-original-study-time="${step.study_time || 0}" data-original-end-date="${step.end_date || ""}">
      <div class="step-item-row" style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" ${checked} aria-label="ステップ完了" />
        <div style="flex:1;min-width:0;">
          <span class="step-item-title">${step.title}</span>
          ${metaHtml}
        </div>
        <button type="button" class="btn-step-expand" aria-label="詳細を展開" title="日付・時間を編集">▼</button>
        <button type="button" class="btn-step-delete" aria-label="ステップ削除">×</button>
      </div>
      <div class="step-detail">
        <div class="step-detail-grid">
          <div class="step-detail-field">
            <label>開始予定日</label>
            <input type="date" class="step-field-spd" value="${spd}" />
          </div>
          <div class="step-detail-field">
            <label>終了予定日</label>
            <input type="date" class="step-field-epd" value="${epd}" />
          </div>
          <div class="step-detail-field">
            <label>実績開始日</label>
            <input type="date" class="step-field-asd" value="${asd}" />
          </div>
          <div class="step-detail-field">
            <label>実績終了日</label>
            <input type="date" class="step-field-aed" value="${aed}" />
          </div>
          <div class="step-detail-field">
            <label>予定学習時間（h）</label>
            <input type="number" step="0.1" min="0" class="step-field-pst" value="${pst}" />
          </div>
          <div class="step-detail-field">
            <label>実績学習時間（h）</label>
            <input type="number" step="0.1" min="0" class="step-field-st" value="${st}" />
          </div>
          ${hasBook ? `<div class="step-detail-field">
            <label>進んだページ/章数（任意）</label>
            <input type="number" step="1" min="0" class="step-field-progress" placeholder="例：5" />
          </div>` : ""}
        </div>
        <div class="step-detail-meta-row">
          <div class="step-detail-meta-group">
            <label>体感の難易度（任意）</label>
            ${createMetaIconButtonsHtml("difficulty", null)}
          </div>
          <div class="step-detail-meta-group">
            <label>その日のやる気（任意）</label>
            ${createMetaIconButtonsHtml("motivation", null)}
          </div>
        </div>
        <button type="button" class="btn btn-primary step-detail-save">保存</button>
      </div>
    </li>
  `;
}

// 変更後
async function renderStepList(taskId) {
  const stepList = document.getElementById("step-list");
  if (!stepList) return [];
  stepList.innerHTML = "";
  const steps = await api(`/api/steps/tasks/${taskId}`);
  steps.forEach((step) => {
    stepList.insertAdjacentHTML("beforeend", createStepItemHtml(step));
  });
  return steps;
}

// v2.21.17追加：ステップの実績日から子タスクの実績開始日・終了日を自動算出（ロールアップ）
// グループのcalculateGroupMilestones()と同じ考え方だが、実績終了日は「全ステップ完了」を
// 待たず、完了有無を問わず最新の実績日を採用する（進行中でも学習実績が日別グラフ等に反映されるようにするため）
function computeAutoActualDates(steps) {
  const hasSteps = steps.length > 0;
  if (!hasSteps) return { hasSteps, autoStartDate: null, autoEndDate: null };

  const starts = steps.map((s) => s.start_date).filter(Boolean).sort();
  const ends = steps.map((s) => s.end_date).filter(Boolean).sort();

  const autoStartDate = starts.length > 0 ? starts[0] : null;
  const autoEndDate = ends.length > 0 ? ends[ends.length - 1] : null;

  return { hasSteps, autoStartDate, autoEndDate };
}

// v2.21.17追加：実績日欄（開始日・終了日）のロック状態とバッジ表示を切り替える
function setTaskModalActualDateLock(isAuto, autoStartDate, autoEndDate) {
  const startInput = document.getElementById("task-start-date");
  const endInput = document.getElementById("task-end-date");
  const badge = document.getElementById("task-actual-date-auto-badge");

  if (isAuto) {
    if (startInput) startInput.value = autoStartDate ? formatDateForInput(autoStartDate) : "";
    if (endInput) endInput.value = autoEndDate ? formatDateForInput(autoEndDate) : "";
  }

  [startInput, endInput].forEach((input) => {
    if (!input) return;
    input.disabled = isAuto;
    input.style.opacity = isAuto ? "0.6" : "1.0";
    input.style.cursor = isAuto ? "not-allowed" : "pointer";
    input.style.backgroundColor = isAuto ? "rgba(255, 255, 255, 0.03)" : "";
  });

  if (badge) {
    badge.classList.toggle("hidden", !isAuto);
  }
}

// v2.21.30追加：残ページ数の表示（study_logs.progress_valueの合計から算出）
async function renderBookProgressInfo(bookId) {
  const el = document.getElementById("task-book-progress-info");
  if (!el) return;
  if (!bookId) {
    el.textContent = "";
    return;
  }
  const { totalPages, pagesCompleted, remainingPages } = await api(
    `/api/books/${bookId}/progress`,
  );
  el.textContent =
    totalPages != null
      ? `残り ${remainingPages}p ／ 全 ${totalPages}p（完了 ${pagesCompleted}p）`
      : "この書籍には総ページ数が未設定です";
}

// v2.21.30追加：書籍セレクト変更時に残ページ数表示とページ管理モード判定を更新
document.getElementById("task-book-id")?.addEventListener("change", async (e) => {
  const bookId = e.target.value;
  renderBookProgressInfo(bookId);
  document.getElementById("task-modal").dataset.bookTotalPages = bookId
    ? (await api(`/api/books/${bookId}`)).total_pages ?? ""
    : "";
});

// ステップ一覧からmodalの時間入力欄を上書きし、APIも更新する
// 変更後
async function syncStepTotalsToTask(taskId) {
  const steps = await api(`/api/steps/tasks/${taskId}`);

  const totalPlanned = steps.reduce(
    (sum, s) => sum + (Number(s.planned_study_time) || 0),
    0,
  );
  const totalActual = steps.reduce(
    (sum, s) => sum + (Number(s.study_time) || 0),
    0,
  );

  const plannedEl = document.getElementById("task-planned-study-time");
  const actualEl = document.getElementById("task-study-time");

  if (plannedEl) {
    plannedEl.value =
      totalPlanned > 0
        ? (Math.round((totalPlanned / 60) * 10) / 10).toFixed(1)
        : "";
  }
  if (actualEl) {
    actualEl.value =
      totalActual > 0
        ? (Math.round((totalActual / 60) * 10) / 10).toFixed(1)
        : "";
  }

  // v2.21.17追加：実績開始日・終了日の自動算出とロック表示
  const { hasSteps, autoStartDate, autoEndDate } = computeAutoActualDates(steps);
  setTaskModalActualDateLock(hasSteps, autoStartDate, autoEndDate);

  const body = {
    planned_study_time: totalPlanned || null,
    study_time: totalActual || null,
  };
  if (hasSteps) {
    body.start_date = formatDateForInput(autoStartDate);
    body.end_date = formatDateForInput(autoEndDate);
  }

  await api(`/api/tasks/${taskId}`, "PUT", body);
}

function showStepSection(show) {
  const section = document.querySelector(".step-section");
  section?.classList.toggle("hidden", !show);
}

function updateCardStepBadge(taskId) {
  const steps = Array.from(document.querySelectorAll("#step-list .step-item"));
  const total = steps.length;
  const completed = steps.filter((li) =>
    li.classList.contains("completed"),
  ).length;
  const text = `${completed}/${total}`;

  // ↓追加：タスクモーダル内の「ステップを管理」ボタンのサマリーバッジも同期
  const summaryBadge = document.getElementById("task-step-summary-badge");
  if (summaryBadge) summaryBadge.textContent = text;

  const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
  if (card) {
    let badge = card.querySelector(".task-step-badge");
    if (total === 0) {
      if (badge) badge.remove();
    } else if (badge) {
      badge.textContent = text;
    } else {
      const meta = card.querySelector(".task-card-meta");
      meta?.insertAdjacentHTML(
        "beforeend",
        `<span class="task-card-meta-item task-step-badge">${text}</span>`,
      );
    }
  }

  const row = document.querySelector(
    `#task-table-body .task-row[data-task-id="${taskId}"]`,
  );
  if (row) {
    const cell = row.querySelector("td:last-child");
    if (cell) {
      cell.innerHTML =
        total === 0
          ? `<span class="task-table-dim">－</span>`
          : `<span class="task-step-badge">${text}</span>`;
    }
  }
}

// 変更後
document.getElementById("step-list")?.addEventListener("change", async (e) => {
  if (e.target.type !== "checkbox") return;
  const li = e.target.closest(".step-item");
  const stepId = li.dataset.stepId;
  const isCompleted = e.target.checked;
  await api(`/api/steps/${stepId}`, "PUT", { is_completed: isCompleted });
  li.classList.toggle("completed", isCompleted);
  const taskId = document.getElementById("task-modal").dataset.taskId;
  updateCardStepBadge(taskId);
  await syncStepTotalsToTask(taskId); // v2.21.17追加：実績日ロールアップの再計算
});

document.getElementById("step-list")?.addEventListener("click", async (e) => {
  // v2.21.35変更：難易度・やる気のアイコンボタン選択（トグル）。SVGクリック対応のためclosest()を使用
  const metaIconBtn = e.target.closest(".step-meta-icon-btn");
  if (metaIconBtn) {
    const row = metaIconBtn.closest(".step-meta-icon-row");
    const wasActive = metaIconBtn.classList.contains("active");
    row.querySelectorAll(".step-meta-icon-btn").forEach((btn) => btn.classList.remove("active"));
    if (!wasActive) metaIconBtn.classList.add("active");
    return;
  }
  // 削除
  if (e.target.classList.contains("btn-step-delete")) {
    const li = e.target.closest(".step-item");
    const stepId = li.dataset.stepId;
    await api(`/api/steps/${stepId}`, "DELETE");
    li.remove();
    const taskId = document.getElementById("task-modal").dataset.taskId;
    updateCardStepBadge(taskId);
    await syncStepTotalsToTask(taskId);
    return;
  }

  // 展開トグル
  if (e.target.classList.contains("btn-step-expand")) {
    const btn = e.target;
    const li = btn.closest(".step-item");
    const detail = li.querySelector(".step-detail");
    const isOpen = detail.classList.toggle("open");
    btn.classList.toggle("open", isOpen);
    return;
  }

  // 詳細エリア内の保存ボタン
  if (e.target.classList.contains("step-detail-save")) {
    const li = e.target.closest(".step-item");
    const stepId = li.dataset.stepId;

    const spd = li.querySelector(".step-field-spd").value || null;
    const epd = li.querySelector(".step-field-epd").value || null;

    // 【変更】2つの実績開始・終了日の値を取得
    const asd = li.querySelector(".step-field-asd").value || null;
    const aed = li.querySelector(".step-field-aed").value || null;

    const pstVal = li.querySelector(".step-field-pst").value;
    const stVal = li.querySelector(".step-field-st").value;

    // 【改善】空文字保存時の NaN バグを防止
    const pst =
      pstVal && !isNaN(parseFloat(pstVal))
        ? Math.round(parseFloat(pstVal) * 60)
        : null;
    const st =
      stVal && !isNaN(parseFloat(stVal))
        ? Math.round(parseFloat(stVal) * 60)
        : null;
    const progressVal = li.querySelector(".step-field-progress")?.value;
    // v2.21.30変更：総ページ数が設定された書籍のタスクは、フォールバック値を
    // 1から0（記録なし）に変更する。目安ページ数(tasks.page_count)ではなく
    // 総ページ数(books.total_pages)の有無で判定する（chapter_idという概念は不採用のため）
    const pageTrackingEnabled = !!document.getElementById("task-modal").dataset.bookTotalPages;
    const enteredProgress =
      progressVal && !isNaN(parseFloat(progressVal)) && parseFloat(progressVal) > 0
        ? parseFloat(progressVal)
        : null;
    const progressValue = enteredProgress ?? (pageTrackingEnabled ? 0 : 1);
    const difficultyBtn = li.querySelector('.step-meta-icon-row[data-meta="difficulty"] .step-meta-icon-btn.active');
    const motivationBtn = li.querySelector('.step-meta-icon-row[data-meta="motivation"] .step-meta-icon-btn.active');
    const difficultyValue = difficultyBtn ? Number(difficultyBtn.dataset.value) : null;
    const motivationValue = motivationBtn ? Number(motivationBtn.dataset.value) : null;

    // 【改善】PUTの戻り値（更新後のデータ）を直接 updatedStep に格納する
    const updatedStep = await api(`/api/steps/${stepId}`, "PUT", {
      start_planned_date: spd,
      end_planned_date: epd,
      start_date: asd,
      end_date: aed,
      planned_study_time: pst,
      study_time: st,
    });

    // 【修正】ステップ行を再描画（抜け落ちていた newLi の定義を追加）
    const taskId = document.getElementById("task-modal").dataset.taskId;
    const originalStudyTime = Number(li.dataset.originalStudyTime) || 0;
    const newStudyTime = st || 0;
    const delta = newStudyTime - originalStudyTime;

    // 💡 【完全解決】外部の関数に頼らず、ここで直接「ローカルタイムの今日(YYYY-MM-DD)」を生成！
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;
    
    // 💡 【改修ポイント】終了日(aed)が無ければ開始日(asd)、それも無ければ「今日」を採用
    const targetLogDate = aed || asd || todayStr;

    // v2.21.30変更：ページ管理モードのタスクは、ページ数が実際に入力された場合のみ記録する
    const shouldLog = pageTrackingEnabled ? enteredProgress != null : delta > 0;
    if (delta > 0 && shouldLog) {
      const taskDataForLog = await api(`/api/tasks/${taskId}`);
      await api("/api/study-logs", "POST", {
        log_date: targetLogDate, // 自動判定した日付をセット
        task_id: taskId,
        step_id: stepId,
        book_id: taskDataForLog.book_id || null,
        // study_logs.study_time は「時間(h)」で保持するため、分単位のdeltaを変換する
        study_time: Math.round((delta / 60) * 100) / 100,
        progress_value: progressValue,
        difficulty: difficultyValue,
        motivation: motivationValue,
      });

      // v2.21.30追加：残ページ数表示をリアルタイムに反映
      if (pageTrackingEnabled) {
        renderBookProgressInfo(taskDataForLog.book_id);
      }
    }

    const tmp = document.createElement("ul");
    tmp.innerHTML = createStepItemHtml(updatedStep);

    const newLi = tmp.firstElementChild;
    li.replaceWith(newLi);

    // 【改善】保存後は詳細エリアが自動で閉じる状態（追加のopenクラス付与を廃止）

    // 自動集計：ステップ合計を子タスクに反映
    await syncStepTotalsToTask(taskId);
    return;
  }
});

// 新しいステップの追加処理
// 変更後
document.getElementById("btn-step-add")?.addEventListener("click", async () => {
  const input = document.getElementById("step-new-title");
  if (!input) return;
  const title = input.value.trim();
  if (!title) return;
  const taskId = document.getElementById("task-modal").dataset.taskId;
  const newStep = await api(`/api/steps/tasks/${taskId}`, "POST", { title });
  document
    .getElementById("step-list")
    ?.insertAdjacentHTML("beforeend", createStepItemHtml(newStep));
  input.value = "";
  updateCardStepBadge(taskId);
  await syncStepTotalsToTask(taskId); // v2.21.17追加：実績日ロールアップの再計算
});

// ----- ⑤ 「ステップから集計」ボタン（手動） -----
document
  .getElementById("btn-step-aggregate")
  ?.addEventListener("click", async () => {
    const taskId = document.getElementById("task-modal").dataset.taskId;
    if (!taskId) return;
    await syncStepTotalsToTask(taskId);
  });

  // ===== ステップ管理モーダル（task-modalから分離） =====
  function openStepModal() {
    const taskModal = document.getElementById("task-modal");
    if (taskModal) taskModal.style.visibility = "hidden"; // 裏のモーダルを非表示
    document.getElementById("step-modal")?.classList.remove("hidden");
  }
  function closeStepModal() {
    document.getElementById("step-modal")?.classList.add("hidden");
    const taskModal = document.getElementById("task-modal");
    if (taskModal) taskModal.style.visibility = ""; // タスクモーダルを再表示
  }
document.getElementById("btn-open-step-modal")?.addEventListener("click", openStepModal);
document.getElementById("btn-step-modal-close-x")?.addEventListener("click", closeStepModal);
document.getElementById("btn-step-modal-close")?.addEventListener("click", closeStepModal);
document.getElementById("step-modal")?.addEventListener("click", (e) => {
  if (e.target.id === "step-modal") closeStepModal();
});
// ===== タスクモーダル =====

async function openTaskEditModal(taskId) {
  const task = await api(`/api/tasks/${taskId}`);
  document.getElementById("task-modal").dataset.taskId = taskId;
  document.getElementById("task-modal").dataset.originalStudyTime = task.study_time || 0; // ★追加
  document.getElementById("task-modal").dataset.groupId = task.group_id;
  document.getElementById("task-title").value = task.title;
  document.getElementById("task-type").value = task.type_id;
  document.getElementById("task-category").value = task.category_id;
  document.getElementById("task-granularity").value = task.granularity || "";
  document.getElementById("task-book-id").value = task.book_id || "";
  // v2.21.30追加：書籍の総ページ数を取得し、ページ管理モードかどうかを判定・残ページ数を表示
  if (task.book_id) {
    const book = await api(`/api/books/${task.book_id}`);
    document.getElementById("task-modal").dataset.bookTotalPages = book.total_pages ?? "";
  } else {
    document.getElementById("task-modal").dataset.bookTotalPages = "";
  }
  renderBookProgressInfo(task.book_id);
  document.getElementById("task-status").value = task.status;
  document.getElementById("task-start-planned-date").value = formatDateForInput(
    task.start_planned_date,
  );
  document.getElementById("task-end-planned-date").value = formatDateForInput(
    task.end_planned_date,
  );
  document.getElementById("task-start-date").value = formatDateForInput(
    task.start_date,
  );
  document.getElementById("task-end-date").value = formatDateForInput(
    task.end_date,
  );
  document.getElementById("task-study-time").value = task.study_time
    ? minutesToHours(task.study_time)
    : "";
  document.getElementById("task-planned-study-time").value =
    task.planned_study_time ? minutesToHours(task.planned_study_time) : "";
  document.getElementById("task-memo").value = task.memo || "";

  document.getElementById("task-understood-memo").value = task.understood_memo || "";
  document.getElementById("task-unclear-points").value = task.unclear_points || "";

  const viewBookBtn = document.getElementById("btn-task-view-book");
  if (viewBookBtn) {
    if (task.book_id) {
      viewBookBtn.classList.remove("hidden");
      viewBookBtn.dataset.bookId = task.book_id;
    } else {
      viewBookBtn.classList.add("hidden");
      viewBookBtn.dataset.bookId = "";
    }
  }

  // 変更後
  showStepSection(true);
  const steps = await renderStepList(taskId);

  // v2.21.17追加：ステップの有無・実績日に応じて実績日欄をロック
  const { hasSteps, autoStartDate, autoEndDate } = computeAutoActualDates(steps);
  setTaskModalActualDateLock(hasSteps, autoStartDate, autoEndDate);

  updateCardStepBadge(taskId); // ステップ一覧描画直後にサマリーバッジも同期

  const duplicateBtn = document.getElementById("btn-task-duplicate");
  if (duplicateBtn) duplicateBtn.classList.remove("hidden");

  document.getElementById("task-modal").classList.remove("hidden");
  markTaskModalClean();
}

function bindKanbanEvents() {
  document.querySelectorAll(".group-card-header").forEach((header) => {
    header.addEventListener("click", () => {
      const card = header.closest(".group-card");
      const children = card.querySelector(".group-card-children");
      children.classList.toggle("hidden");
    });
  });

  document.querySelectorAll(".btn-edit-group").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openGroupEditModal(btn.dataset.groupId);
    });
  });

  document.querySelectorAll(".btn-add-task").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openTaskModal(btn.dataset.groupId);
    });
  });

  document.querySelectorAll(".task-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.stopPropagation();
      openTaskEditModal(card.dataset.taskId);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        openTaskEditModal(card.dataset.taskId);
      }
    });
  });

  // v2.21.22追加：ステップ（孫タスク）開閉トグル
  document.querySelectorAll(".task-card-step-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.taskId;
      const list = document.querySelector(
        `.task-card-step-mini-list[data-task-id="${taskId}"]`,
      );
      if (!list) return;
      const isHidden = list.classList.toggle("hidden");
      const arrow = btn.querySelector(".task-card-step-toggle-arrow");
      if (arrow) arrow.textContent = isHidden ? "▶" : "▼";
    });
  });
}

async function fetchTaskViewData() {
  // 💡 APIから取得（groupsは後で上書きするため let で宣言）
  let groups = await api("/api/groups");
  const tasks = await api("/api/tasks");
  const books = await api("/api/books");
  const allSteps = await api("/api/steps");
  const stepsByTaskId = groupStepsByTaskId(allSteps);

  // 💡 ここに追加：子タスクから親タスクのマイルストーン期間を自動計算（ロールアップ）！
  groups = calculateGroupMilestones(groups, tasks);

  await loadTaskTypeOptions();
  await loadTaskCategoryOptions();

  const bookSelect = document.getElementById("task-book-id");
  bookSelect.innerHTML = '<option value="">（なし）</option>';
  books.forEach((book) => {
    const option = document.createElement("option");
    option.value = book.id;
    option.textContent = book.title;
    bookSelect.appendChild(option);
  });

  return { groups, tasks, books, stepsByTaskId };
}

function renderKanban(data) {
  const { groups, tasks, stepsByTaskId } = data;

  const expandedGroupIds = new Set();
  document.querySelectorAll(".group-card").forEach((card) => {
    const children = card.querySelector(".group-card-children");
    if (children && !children.classList.contains("hidden")) {
      expandedGroupIds.add(card.dataset.groupId);
    }
  });

  document.querySelectorAll(".kanban-cards").forEach((container) => {
    container.innerHTML = "";
  });

  const statusCounts = { 未着手: 0, 進行中: 0, 完了: 0 };

  groups.forEach((group) => {
    const status = calcStatus(group.id, tasks);
    statusCounts[status]++;
    const childTasks = tasks.filter((t) => t.group_id === group.id);
    const container = document.querySelector(
      `.kanban-cards[data-status="${status}"]`,
    );
    container.insertAdjacentHTML(
      "beforeend",
      createGroupCardHtml(group, childTasks, stepsByTaskId, status),
    );
  });

  Object.entries(statusCounts).forEach(([status, count]) => {
    const badge = document.querySelector(`[data-count-for="${status}"]`);
    if (badge) badge.textContent = count;
  });

  document.querySelectorAll(".group-card").forEach((card) => {
    if (expandedGroupIds.has(card.dataset.groupId)) {
      const children = card.querySelector(".group-card-children");
      if (children) children.classList.remove("hidden");
    }
  });

  bindKanbanEvents();
}

// ===== テーブルビュー =====

const TASK_STATUS_DOT_CLASS = {
  未着手: "todo",
  進行中: "inprogress",
  完了: "done",
};

// ステータス大枠の開閉状態を管理するローカルストレージ用ヘルパー
function getCollapsedStatuses() {
  return JSON.parse(localStorage.getItem("collapsedTableStatuses") || "[]");
}

// v2.21.22追加：データベースビューでのステップ行の開閉状態
function getExpandedTableSteps() {
  return JSON.parse(localStorage.getItem("expandedTableSteps") || "[]");
}
function saveExpandedTableSteps(ids) {
  localStorage.setItem("expandedTableSteps", JSON.stringify(ids));
}
function saveCollapsedStatuses(statuses) {
  localStorage.setItem("collapsedTableStatuses", JSON.stringify(statuses));
}

function createGroupRowHtml(group, childCount, status) {
  const statusClassMap = { 未着手: "todo", 進行中: "inprogress", 完了: "done" };
  const modifierClass = statusClassMap[status] || "todo";

  return `
      <tr class="group-row group-row--${modifierClass}" data-group-id="${group.id}" data-parent-status="${status}">
        <td colspan="7">
          <span class="group-row-toggle">▾</span>
          ${group.title}（${childCount}件）
        </td>
        <td>
          <div style="display:flex;gap:4px;justify-content:flex-end;align-items:center;">
            <button type="button" class="btn-add-task-table" data-group-id="${group.id}" aria-label="子タスクを追加" title="子タスクを追加">+</button>
            <button type="button" class="btn-edit-group" data-group-id="${group.id}" aria-label="親タスクを編集">編集</button>
          </div>
        </td>
      </tr>
    `;
}

function createStepTableRowHtml(step, taskId) {
  const plannedDate = formatDateShort(step.start_planned_date) || "－";
  const actualDate = formatDateShort(step.end_date) || "－";
  const time = step.study_time ? `${minutesToHours(step.study_time)}h` : "－";
  const statusLabel = step.is_completed ? "完了" : "未完了";
  const dotClass = step.is_completed ? "done" : "todo";

  return `
    <tr class="step-row hidden" data-task-id="${taskId}" data-step-id="${step.id}">
      <td class="task-table-dim" style="padding-left: 44px;">└ ${step.title}</td>
      <td class="task-table-dim">ステップ</td>
      <td>
        <span class="task-table-status">
          <span class="task-table-status-dot task-table-status-dot--${dotClass}"></span>
          ${statusLabel}
        </span>
      </td>
      <td class="task-table-dim">－</td>
      <td class="task-table-dim">${plannedDate}</td>
      <td class="task-table-dim">${actualDate}</td>
      <td class="task-table-dim">${time}</td>
      <td class="task-table-dim">－</td>
    </tr>
  `;
}

function createTaskRowHtml(task, steps, status) {
  const typeInfo = getTypeInfo(task.type_name);
  const categoryBadgeHtml = createCategoryBadgeHtml(task.category_name);
  const dotClass = TASK_STATUS_DOT_CLASS[task.status] || "todo";
  const plannedDate = formatDateShort(task.start_planned_date) || "－";
  const completedDate = formatDateShort(task.end_date) || "－";
  const minutes =
    task.study_time != null ? `${minutesToHours(task.study_time)}h` : "－";

  const totalSteps = steps ? steps.length : 0;
  const completedSteps = steps ? steps.filter((s) => s.is_completed).length : 0;
  const progressPercent =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const progressHtml = `
    <div class="table-progress">
      <div class="table-progress-bar">
        <i style="width: ${progressPercent}%;"></i>
      </div>
      <span class="table-progress-label">${progressPercent}%</span>
    </div>
  `;

  const stepBadge =
    totalSteps > 0
      ? `<span class="task-step-badge">${completedSteps}/${totalSteps}</span>`
      : `<span class="task-table-dim">－</span>`;

  // v2.21.22追加：ステップ行の開閉トグル
  const stepToggleHtml =
    totalSteps > 0
      ? `<span class="step-row-toggle" data-task-id="${task.id}">▸</span>`
      : `<span class="step-row-toggle-spacer"></span>`;

  const stepRowsHtml =
    totalSteps > 0
      ? steps.map((step) => createStepTableRowHtml(step, task.id)).join("")
      : "";

  return `
      <tr class="task-row" data-task-id="${task.id}" data-parent-status="${status}" data-child-of-group="${task.group_id}" tabindex="0">
        <td>${stepToggleHtml}${task.title}</td>
        <td>
          <div class="task-table-badges">
            <span class="task-type-badge task-type-badge--${typeInfo.class}">${typeInfo.label}</span>
            ${categoryBadgeHtml}
          </div>
        </td>
        <td>
          <span class="task-table-status">
            <span class="task-table-status-dot task-table-status-dot--${dotClass}"></span>
            ${task.status}
          </span>
        </td>
        <td>${progressHtml}</td>
        <td class="task-table-dim">${plannedDate}</td>
        <td class="task-table-dim">${completedDate}</td>
        <td class="task-table-dim">${minutes}</td>
        <td>${stepBadge}</td>
      </tr>
      ${stepRowsHtml}
    `;
}

function bindTableEvents() {

  // v2.21.22追加：ステップ行の開閉トグル＋状態保持
  document
    .querySelectorAll("#task-table-body .step-row-toggle")
    .forEach((toggle) => {
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const taskId = toggle.dataset.taskId;
        const expanded = getExpandedTableSteps();
        const isExpanding = !expanded.includes(taskId);
        document
          .querySelectorAll(
            `#task-table-body .step-row[data-task-id="${taskId}"]`,
          )
          .forEach((row) => row.classList.toggle("hidden", !isExpanding));
        toggle.textContent = isExpanding ? "▾" : "▸";
        if (isExpanding) {
          expanded.push(taskId);
        } else {
          const idx = expanded.indexOf(taskId);
          if (idx >= 0) expanded.splice(idx, 1);
        }
        saveExpandedTableSteps(expanded);
      });
    });
  // ① 「未着手」「進行中」「完了」ステータス大枠の開閉
  document
    .querySelectorAll("#task-table-body .table-status-header-row")
    .forEach((header) => {
      header.addEventListener("click", () => {
        const status = header.dataset.tableStatusToggle;
        const toggle = header.querySelector(".status-row-toggle");

        let collapsedStatuses = getCollapsedStatuses();
        const isCollapsed = !collapsedStatuses.includes(status);

        if (isCollapsed) {
          collapsedStatuses.push(status);
          toggle.textContent = "▸";
        } else {
          collapsedStatuses = collapsedStatuses.filter((s) => s !== status);
          toggle.textContent = "▾";
        }
        saveCollapsedStatuses(collapsedStatuses);

        const collapsedGroups = JSON.parse(
          localStorage.getItem("collapsedTableGroups") || "[]",
        );

        // 親行（教材）の表示切り替え
        document
          .querySelectorAll(
            `#task-table-body .group-row[data-parent-status="${status}"]`,
          )
          .forEach((row) => {
            row.style.display = isCollapsed ? "none" : "";
          });

        // 子行（タスク）の表示切り替え（親自体が折りたたまれていないものだけ表示）
        document
          .querySelectorAll(
            `#task-table-body .task-row[data-parent-status="${status}"]`,
          )
          .forEach((row) => {
            const parentGroupId = row.getAttribute("data-child-of-group");
            const isParentCollapsed = collapsedGroups.includes(parentGroupId);

            if (isCollapsed) {
              row.style.display = "none";
            } else {
              row.style.display = isParentCollapsed ? "none" : "";
            }
            // 💡 ここから追加：大枠ステータスが切り替わったときの孫タスクの連動制御
            const taskId = row.dataset.taskId;
            document
              .querySelectorAll(`#task-table-body .step-row[data-task-id="${taskId}"]`)
              .forEach(stepRow => {
                if (isCollapsed || isParentCollapsed) {
                  stepRow.style.display = "none";
                } else {
                  stepRow.style.display = ""; // 元の表示状態(.hidden等のクラス)に委ねる
                }
              });
          });
      });
    });

  // ② 親タスク（グループ）行の開閉
  document.querySelectorAll("#task-table-body .group-row").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (
        e.target.closest(".btn-edit-group") ||
        e.target.closest(".btn-add-task-table")
      )
        return;

      const isCollapsed = row.classList.toggle("collapsed");
      const toggle = row.querySelector(".group-row-toggle");
      toggle.textContent = isCollapsed ? "▸" : "▾";

      const groupId = row.dataset.groupId;
      let collapsedGroups = JSON.parse(
        localStorage.getItem("collapsedTableGroups") || "[]",
      );

      if (isCollapsed) {
        if (!collapsedGroups.includes(groupId)) collapsedGroups.push(groupId);
      } else {
        collapsedGroups = collapsedGroups.filter((id) => id !== groupId);
      }
      localStorage.setItem(
        "collapsedTableGroups",
        JSON.stringify(collapsedGroups),
      );

      document
        .querySelectorAll(
          `#task-table-body .task-row[data-child-of-group="${groupId}"]`,
        )
        .forEach((childRow) => {
          childRow.style.display = isCollapsed ? "none" : "";
          
          // 💡 ここから追加：親グループが開閉したときの孫タスクの連動制御
          const taskId = childRow.dataset.taskId;
          document
            .querySelectorAll(`#task-table-body .step-row[data-task-id="${taskId}"]`)
            .forEach(stepRow => {
              stepRow.style.display = isCollapsed ? "none" : "";
            });
        });
    });
  });

  // ③ インライン保存ボタンの制御
  const inlineTitleInput = document.getElementById("inline-parent-title");
  const inlineSaveBtn = document.getElementById("btn-inline-parent-save");
  if (inlineSaveBtn && inlineTitleInput) {
    const handleInlineSave = async () => {
      const title = inlineTitleInput.value.trim();
      if (!title) return;
      await api("/api/groups", "POST", { title, memo: null });
      if (typeof renderTaskViews === "function") {
        renderTaskViews();
      } else if (typeof fetchTaskViewData === "function") {
        fetchTaskViewData().then((data) => renderTable(data));
      }
    };
    inlineSaveBtn.onclick = handleInlineSave;
    inlineTitleInput.onkeypress = (e) => {
      if (e.key === "Enter") handleInlineSave();
    };
  }

  // 子タスク追加・編集イベントのバインド
  document
    .querySelectorAll("#task-table-body .btn-add-task-table")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openTaskModal(btn.dataset.groupId);
      });
    });
  document
    .querySelectorAll("#task-table-body .btn-edit-group")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openGroupEditModal(btn.dataset.groupId);
      });
    });
  document.querySelectorAll("#task-table-body .task-row").forEach((row) => {
    row.addEventListener("click", () => {
      openTaskEditModal(row.dataset.taskId);
    });
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openTaskEditModal(row.dataset.taskId);
      }
    });
  });
}

function renderTable(data) {
  const { groups, tasks, stepsByTaskId } = data;
  const tbody = document.getElementById("task-table-body");
  tbody.innerHTML = "";

  // 「未着手」「進行中」「完了」の3つのステータス枠のみに限定
  const statuses = ["未着手", "進行中", "完了"];

  // 親タスクを3つのステータスに分類
  const groupedGroups = { 未着手: [], 進行中: [], 完了: [] };
  groups.forEach((group) => {
    const status = calcStatus(group.id, tasks);
    if (groupedGroups[status]) {
      groupedGroups[status].push(group);
    } else {
      // 該当しない場合は「未着手」へフォールバック
      groupedGroups["未着手"].push(group);
    }
  });

  // 3つのステータスを順に処理してテーブル行をビルド
  statuses.forEach((status) => {
    const targetGroups = sortGroupsByCreatedAtDesc(groupedGroups[status] || []);
    const collapsedStatuses = getCollapsedStatuses();
    const isStatusCollapsed = collapsedStatuses.includes(status);
    const statusArrow = isStatusCollapsed ? "▸" : "▾";

    // A. 各ステータスを区切る太字ヘッダー行を追加
    tbody.insertAdjacentHTML(
      "beforeend",
      `<tr class="table-status-header-row font-bold select-none cursor-pointer" data-table-status-toggle="${status}" style="background-color: #1e1e24;">
        <td colspan="8" style="padding: 10px 14px; color: #fff;">
          <span class="status-row-toggle" style="margin-right: 6px;">${statusArrow}</span>
          ${status} （${targetGroups.length}件）
        </td>
      </tr>`,
    );

    // B. 所属する親・子タスクを追加
    if (targetGroups.length === 0) {
      tbody.insertAdjacentHTML(
        "beforeend",
        `<tr class="table-status-empty-row" data-parent-status="${status}">
          <td colspan="8" style="padding: 12px; text-align: center; color: #555; font-size: 13px; background: #141419;">
            ページがありません
          </td>
        </tr>`,
      );
    } else {
      targetGroups.forEach((group) => {
        const childTasks = tasks.filter((t) => t.group_id === group.id);

        tbody.insertAdjacentHTML(
          "beforeend",
          createGroupRowHtml(group, childTasks.length, status),
        );

        childTasks.forEach((task) => {
          tbody.insertAdjacentHTML(
            "beforeend",
            createTaskRowHtml(task, stepsByTaskId[task.id] || [], status),
          );
        });
      });
    }
  });

  // C. テーブル最下部にインライン親タスク追加行を配置
  tbody.insertAdjacentHTML(
    "beforeend",
    `<tr class="inline-add-row" style="background-color: transparent;">
        <td colspan="8" style="padding: 20px 10px 10px 10px; border-top: 1px solid #333;">
          <div class="inline-add-container" style="display: flex; align-items: center; gap: 12px; box-sizing: border-box; width: 100%;">
            <input type="text" id="inline-parent-title" placeholder="+ 新しい親タスクを追加..." style="flex: 1; min-width: 0; padding: 8px 12px; background: #1e1e24; border: 1px dashed #555; color: #fff; border-radius: 4px; font-size: 14px;" />
            <button type="button" id="btn-inline-parent-save" class="btn btn-primary" style="cursor: pointer; white-space: nowrap; flex-shrink: 0;">保存</button>
          </div>
        </td>
      </tr>`,
  );

  // 4. ストレージから前回の開閉状態を復元して初期適用
  const collapsedStatuses = getCollapsedStatuses();
  const collapsedGroups = JSON.parse(
    localStorage.getItem("collapsedTableGroups") || "[]",
  );

  // A. ステータス大枠の折りたたみを適用
  collapsedStatuses.forEach((status) => {
    tbody
      .querySelectorAll(`[data-parent-status="${status}"]`)
      .forEach((row) => {
        row.style.display = "none";

        if (row.classList.contains("task-row")) {
          const taskId = row.dataset.taskId;
          tbody.querySelectorAll(`.step-row[data-task-id="${taskId}"]`).forEach(stepRow => {
            stepRow.style.display = "none";
          });
        }
      });
  });

  // B. 親グループ（教材単位）の折りたたみを適用
  collapsedGroups.forEach((groupId) => {
    const row = tbody.querySelector(`.group-row[data-group-id="${groupId}"]`);
    if (row) {
      row.classList.add("collapsed");
      const toggle = row.querySelector(".group-row-toggle");
      if (toggle) toggle.textContent = "▸";

      // ステータス大枠自体が開いている場合のみ、配下の子タスク行を個別に非表示にする
      const currentStatus = row.getAttribute("data-parent-status");
      if (!collapsedStatuses.includes(currentStatus)) {
        tbody
          .querySelectorAll(`.task-row[data-child-of-group="${groupId}"]`)
          .forEach((childRow) => {
            childRow.style.display = "none";

            const taskId = childRow.dataset.taskId;
            tbody.querySelectorAll(`.step-row[data-task-id="${taskId}"]`).forEach(stepRow => {
              stepRow.style.display = "none";
            });
          });
      }
    }
  });

  // v2.21.22追加：前回開いていたステップ行を復元
  const expandedSteps = getExpandedTableSteps();
  expandedSteps.forEach((taskId) => {
    const toggle = tbody.querySelector(
      `.step-row-toggle[data-task-id="${taskId}"]`,
    );
    if (toggle) toggle.textContent = "▾";
    tbody
      .querySelectorAll(`.step-row[data-task-id="${taskId}"]`)
      .forEach((row) => row.classList.remove("hidden"));
  });

  // イベントハンドラをバインド
  bindTableEvents();
  setTimeout(syncTaskViewHeights, 0); // v2.21.24追加：見出し行のsticky位置を再計算
}

// ===== カレンダービュー =====

let calendarDate = new Date();

// 【修正】ローカルストレージに保存された年月があれば、それを優先して復元する
const savedYear = localStorage.getItem("calendar_selected_year");
const savedMonth = localStorage.getItem("calendar_selected_month");

if (savedYear !== null && savedMonth !== null) {
  calendarDate.setFullYear(parseInt(savedYear, 10));
  calendarDate.setMonth(parseInt(savedMonth, 10));
} else {
  // 保存データがなければ、これまで通り今月の1日にセットする
  calendarDate.setDate(1);
}

function formatDateForCompare(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// タイムゾーン問題回避：getFullYear/getMonth/getDate() 基準で YYYY-MM-DD を返す
function formatDateForInput(dateStr) {
  return formatDateForCompare(dateStr) || "";
}

function bindCalendarEvents() {
  // 予定・実績バー両方のクリックで編集モーダルを開く
  document.querySelectorAll(".calendar-task-bar").forEach((bar) => {
    bar.addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof openTaskEditModal === "function") {
        openTaskEditModal(bar.dataset.taskId);
      }
    });
    bar.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof openTaskEditModal === "function") {
          openTaskEditModal(bar.dataset.taskId);
        }
      }
    });
  });

  // 日付セルの空きスペースクリックで子タスク追加
  document.querySelectorAll(".calendar-cell").forEach((cell) => {
    cell.addEventListener("click", (e) => {
      if (e.target.closest(".calendar-task-bar")) return;
      const date = cell.dataset.date;
      if (date && lastTaskViewData) {
        if (typeof openAddTaskGroupPicker === "function") {
          openAddTaskGroupPicker(lastTaskViewData.groups, date);
        }
      }
    });
  });
}

function renderCalendar(data) {
  const { tasks, stepsByTaskId } = data;

  // v2.21.22追加：ステップ表示トグルの状態を反映
  const showSteps = localStorage.getItem("calendar_show_steps") === "true";
  document
    .getElementById("btn-calendar-toggle-steps")
    ?.classList.toggle("active", showSteps);

  // 1. ストレージから保存されたモードを読み出す（デフォルトは 'all'）
  const savedMode = localStorage.getItem("calendar_display_mode") || "all";

  // 2. 一度すべての切り替えタブの「active（下線）」クラスをリセットする
  document.querySelectorAll(".calendar-mode-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // 3. 保存されていたモードに該当するタブだけに「active（下線）」を付与する
  const targetTab = document.querySelector(
    `.calendar-mode-tab[data-mode="${savedMode}"]`,
  );
  if (targetTab) {
    targetTab.classList.add("active");
  }

  // 4. 現在アクティブなモードを基準にして描画を進める
  const displayMode = savedMode;

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  document.getElementById("calendar-month-label").textContent =
    `${year}年${month + 1}月`;

  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  // 曜日ヘッダー（日〜土）
  ["日", "月", "火", "水", "木", "金", "土"].forEach((label) => {
    grid.insertAdjacentHTML(
      "beforeend",
      `<div class="calendar-weekday">${label}</div>`,
    );
  });

  // カレンダー42日分を生成
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const calendarDays = [];
  const renderStartDate = new Date(year, month, 1 - startWeekday);
  for (let i = 0; i < 42; i++) {
    const d = new Date(renderStartDate);
    d.setDate(renderStartDate.getDate() + i);
    calendarDays.push(d);
  }

  // ===== バー高さ定数 =====
  const BAR_PLANNED_H = 20; // 予定バーの高さ
  const BAR_STEP_H = 15; // v2.21.22追加：ステップバーの高さ
  const BAR_ACTUAL_H = 18; // 実績バーの高さ
  const BAR_GAP = 2; // 予定バーと実績バーの間隔
  const TASK_GAP = 4; // タスク同士の間隔

  // 1タスクの占有高さを計算
  function getStepsForHeight(task) {
    if (!showSteps) return [];
    return (stepsByTaskId[task.id] || []).filter(
      (s) => s.start_date || s.end_date || s.start_planned_date || s.end_planned_date,
    );
  }

  function getTaskHeight(task) {
    let base;
    if (displayMode === "planned") {
      base = BAR_PLANNED_H + TASK_GAP;
    } else if (displayMode === "actual") {
      base = task.start_date ? BAR_ACTUAL_H + TASK_GAP : 0;
    } else {
      base = task.start_date
        ? BAR_PLANNED_H + BAR_GAP + BAR_ACTUAL_H + TASK_GAP
        : BAR_PLANNED_H + TASK_GAP;
    }
    const steps = getStepsForHeight(task);
    if (steps.length > 0) {
      base += steps.length * (BAR_STEP_H + TASK_GAP);
    }
    return base;
  }

  // 週ごとにグリッド行を生成
  let gridHtml = "";
  for (let week = 0; week < 6; week++) {
    let cellsHtml = "";
    let isCurrentMonthWeek = false;

    for (let day = 0; day < 7; day++) {
      const currentLabelDate = calendarDays[week * 7 + day];
      const isCurrentMonth = currentLabelDate.getMonth() === month;
      if (isCurrentMonth) isCurrentMonthWeek = true;

      const cellDateStr = `${currentLabelDate.getFullYear()}-${String(currentLabelDate.getMonth() + 1).padStart(2, "0")}-${String(currentLabelDate.getDate()).padStart(2, "0")}`;

      cellsHtml += `
        <div class="calendar-cell ${isCurrentMonth ? "" : "calendar-cell--empty"}" data-date="${cellDateStr}" style="border: 1px solid #222; box-sizing: border-box;">
          <div class="calendar-cell-date" style="padding: 4px 8px; color: ${isCurrentMonth ? "#aaa" : "#444"};">${currentLabelDate.getDate()}</div>
        </div>
      `;
    }

    if (week === 5 && !isCurrentMonthWeek) continue;

    gridHtml += `
      <div class="calendar-week-row" style="position: relative; grid-column: span 7;">
        <div class="calendar-week-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); width: 100%;">
          ${cellsHtml}
        </div>
        <div class="calendar-bar-layer" style="position: absolute; top: 28px; left: 0; width: 100%; pointer-events: none;"></div>
      </div>
    `;
  }
  grid.insertAdjacentHTML("beforeend", gridHtml);

  // 各週のバーを配置
  const weekRows = grid.querySelectorAll(".calendar-week-row");
  weekRows.forEach((row, weekIdx) => {
    const layer = row.querySelector(".calendar-bar-layer");
    const weekGrid = row.querySelector(".calendar-week-grid");

    const weekStart = new Date(calendarDays[weekIdx * 7]).setHours(0, 0, 0, 0);
    const weekEnd = new Date(calendarDays[weekIdx * 7 + 6]).setHours(
      23,
      59,
      59,
      999,
    );

    // この週の枠（weekStart 〜 weekEnd）に重なるタスクを、モード別に抽出する
    const weekTasks = tasks.filter((task) => {
      if (displayMode === "actual" && !task.start_date) return false;
      if (displayMode === "planned" && !task.start_planned_date) return false;

      // 1. 予定期間がこの週に重なっているか判定
      let hasPlannedOverlap = false;
      if (task.start_planned_date) {
        const pStartStr = formatDateForInput(task.start_planned_date);
        const pEndStr = task.end_planned_date
          ? formatDateForInput(task.end_planned_date)
          : pStartStr;
        const pStart = new Date(pStartStr).setHours(0, 0, 0, 0);
        const pEnd = new Date(pEndStr).setHours(0, 0, 0, 0);
        hasPlannedOverlap = pStart <= weekEnd && pEnd >= weekStart;
      }

      // 2. 実績期間がこの週に重なっているか判定
      let hasActualOverlap = false;
      if (task.start_date) {
        const aStartStr = formatDateForInput(task.start_date);
        const aEndStr = task.end_date
          ? formatDateForInput(task.end_date)
          : aStartStr;
        const aStart = new Date(aStartStr).setHours(0, 0, 0, 0);
        const aEnd = new Date(aEndStr).setHours(0, 0, 0, 0);
        hasActualOverlap = aStart <= weekEnd && aEnd >= weekStart;
      }

      // 3. モードに応じて抽出フラグを返す
      if (displayMode === "planned") return hasPlannedOverlap;
      if (displayMode === "actual") return hasActualOverlap;

      // 「すべて」モードの場合は、予定または実績のどちらかが被っていれば必ず通過させる
      return hasPlannedOverlap || hasActualOverlap;
    });

    // ソート処理
    weekTasks.sort((a, b) => {
      const useActual = displayMode === "actual";
      const aTarget = useActual ? a.start_date : a.start_planned_date;
      const bTarget = useActual ? b.start_date : b.start_planned_date;
      const aTime = aTarget ? new Date(aTarget.substring(0, 10)).getTime() : 0;
      const bTime = bTarget ? new Date(bTarget.substring(0, 10)).getTime() : 0;
      return aTime - bTime;
    });

    let currentTop = 0;

    weekTasks.forEach((task) => {
      // 予定バー用の位置計算（予定日ベース）
      const taskStartStr = formatDateForInput(task.start_planned_date);
      const taskEndStr = task.end_planned_date
        ? formatDateForInput(task.end_planned_date)
        : taskStartStr;

      const startPercent = taskStartStr
        ? Math.max(
            0,
            Math.round(
              (new Date(taskStartStr).setHours(0, 0, 0, 0) - weekStart) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : 0;
      const endPercent = taskEndStr
        ? Math.min(
            6,
            Math.round(
              (new Date(taskEndStr).setHours(0, 0, 0, 0) - weekStart) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : 0;

      const leftPercent = (startPercent / 7) * 100;
      const widthPercent = ((endPercent - startPercent + 1) / 7) * 100;

      const taskBaseTop = currentTop;

      const categoryBadgeHtml = createCategoryBadgeHtml(task.category_name);
      const steps = stepsByTaskId[task.id] || [];
      const stepBadge =
        steps.length > 0
          ? `<span class="calendar-chip-badge" style="background: #333; color: #aaa; padding: 0 4px; border-radius: 3px; font-size: 10px; margin-left: auto; flex-shrink: 0;">${steps.filter((s) => s.is_completed).length}/${steps.length}</span>`
          : "";

      // 🔴 1. 予定バーのレンダリング（'all' または 'planned' のとき）
      if (
        (displayMode === "all" || displayMode === "planned") &&
        task.start_planned_date
      ) {
        layer.insertAdjacentHTML(
          "beforeend",
          `
            <div class="calendar-task-bar calendar-task-bar--planned" data-task-id="${task.id}" style="
              position: absolute;
              left: calc(${leftPercent}% + 4px);
              width: calc(${widthPercent}% - 8px);
              top: ${taskBaseTop}px;
              height: ${BAR_PLANNED_H}px;
              font-size: 12px;
              padding: 2px 6px;
              border-radius: 4px;
              cursor: pointer;
              pointer-events: auto;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              box-sizing: border-box;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              ${categoryBadgeHtml}
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${task.title}</span>
              ${stepBadge}
            </div>
          `,
        );
      }

      // 🟢 2. 実績バーのレンダリング（'all' または 'actual' のとき）
      if (
        task.start_date &&
        (displayMode === "all" || displayMode === "actual")
      ) {
        const actualStartStr = formatDateForInput(task.start_date);
        const actualEndStr = task.end_date
          ? formatDateForInput(task.end_date)
          : actualStartStr;

        const actualStart = new Date(actualStartStr).setHours(0, 0, 0, 0);
        const actualEnd = new Date(actualEndStr).setHours(0, 0, 0, 0);

        // 実績期間がこの週（weekStart 〜 weekEnd）に重なっている場合のみ描画する
        if (actualStart <= weekEnd && actualEnd >= weekStart) {
          const actStartDiff = Math.max(
            0,
            Math.round((actualStart - weekStart) / (1000 * 60 * 60 * 24)),
          );
          const actEndDiff = Math.min(
            6,
            Math.round((actualEnd - weekStart) / (1000 * 60 * 60 * 24)),
          );

          const actualLeftPercent = (actStartDiff / 7) * 100;
          const actualWidthPercent =
            ((actEndDiff - actStartDiff + 1) / 7) * 100;

          // 縦位置の決定：実績モードなら最上段、すべて表示なら予定バーの下に配置
          const actualTopPx =
            displayMode === "actual"
              ? taskBaseTop
              : taskBaseTop + BAR_PLANNED_H + BAR_GAP;

          layer.insertAdjacentHTML(
            "beforeend",
            `
                  <div class="calendar-task-bar calendar-task-bar--actual" data-task-id="${task.id}" style="
                    position: absolute;
                    left: calc(${actualLeftPercent}% + 4px);
                    width: calc(${actualWidthPercent}% - 8px);
                    top: ${actualTopPx}px;
                    height: ${BAR_ACTUAL_H}px;
                    font-size: 11px;
                    padding: 1px 6px;
                    border-radius: 4px;
                    cursor: pointer;
                    pointer-events: auto;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                  ">
                    <span style="font-size: 10px; opacity: 0.75; flex-shrink: 0;">実</span>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${task.title}</span>
                  </div>
                `,
          );
        }
      }

      // v2.21.22追加：孫タスク(ステップ)のバー描画
      const stepsForBars = getStepsForHeight(task);
      if (stepsForBars.length > 0) {
        let stepTop =
          taskBaseTop +
          (task.start_date
            ? BAR_PLANNED_H + BAR_GAP + BAR_ACTUAL_H
            : BAR_PLANNED_H) +
          4;

        stepsForBars.forEach((step) => {
          const spStartStr = step.start_planned_date
            ? formatDateForInput(step.start_planned_date)
            : null;
          const spEndStr = step.end_planned_date
            ? formatDateForInput(step.end_planned_date)
            : spStartStr;
          const saStartStr = step.start_date
            ? formatDateForInput(step.start_date)
            : null;
          const saEndStr = step.end_date
            ? formatDateForInput(step.end_date)
            : saStartStr;

          // 実績優先、なければ予定日で位置決め
          const baseStartStr = saStartStr || spStartStr;
          const baseEndStr = saEndStr || spEndStr || baseStartStr;
          if (!baseStartStr) return;

          const sStart = new Date(baseStartStr).setHours(0, 0, 0, 0);
          const sEnd = new Date(baseEndStr).setHours(0, 0, 0, 0);
          if (sEnd < weekStart || sStart > weekEnd) return;

          const stepStartDiff = Math.max(
            0,
            Math.round((sStart - weekStart) / (1000 * 60 * 60 * 24)),
          );
          const stepEndDiff = Math.min(
            6,
            Math.round((sEnd - weekStart) / (1000 * 60 * 60 * 24)),
          );
          const leftPct = (stepStartDiff / 7) * 100;
          const widthPct = ((stepEndDiff - stepStartDiff + 1) / 7) * 100;
          const isActualStep = !!saStartStr;

          layer.insertAdjacentHTML(
            "beforeend",
            `<div class="calendar-task-bar calendar-task-bar--step ${isActualStep ? "calendar-task-bar--step-actual" : "calendar-task-bar--step-planned"}" data-task-id="${task.id}" title="${(step.title || "").replace(/"/g, "&quot;")}" style="
              position:absolute;
              left: calc(${leftPct}% + 6px);
              width: calc(${widthPct}% - 10px);
              top: ${stepTop}px;
              height: ${BAR_STEP_H}px;
              font-size: 10px;
              padding: 0 5px;
              border-radius: 3px;
              cursor: pointer;
              pointer-events: auto;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              box-sizing: border-box;
              display:flex;
              align-items:center;
            ">└ ${step.title}</div>`,
          );
          stepTop += BAR_STEP_H + TASK_GAP;
        });
      }

      currentTop += getTaskHeight(task);
    });

    const totalBarsHeight = currentTop;
    const rowHeight = Math.max(110, 28 + totalBarsHeight + 8);

    weekGrid.querySelectorAll(".calendar-cell").forEach((cell) => {
      cell.style.minHeight = `${rowHeight}px`;
    });
    layer.style.height = `${rowHeight - 28}px`;
  });

  bindCalendarEvents();
  setTimeout(syncTaskViewHeights, 0); // v2.21.24追加：曜日ヘッダーのsticky位置を再計算
}

// 補助用：日付オブジェクトを "YYYY-MM-DD" にする関数
function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 前月ボタン
document.getElementById("btn-calendar-prev")?.addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  localStorage.setItem("calendar_selected_year", calendarDate.getFullYear());
  localStorage.setItem("calendar_selected_month", calendarDate.getMonth());
  renderCalendar(lastTaskViewData);
});

// 次月ボタン
document.getElementById("btn-calendar-next")?.addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  localStorage.setItem("calendar_selected_year", calendarDate.getFullYear());
  localStorage.setItem("calendar_selected_month", calendarDate.getMonth());
  renderCalendar(lastTaskViewData);
});

// v2.21.21追加：カレンダーの年月ラベルクリックでネイティブ月選択ピッカーを開く
document
  .getElementById("calendar-month-label-wrap")
  ?.addEventListener("click", () => {
    const picker = document.getElementById("calendar-month-picker");
    if (!picker) return;
    const y = calendarDate.getFullYear();
    const m = String(calendarDate.getMonth() + 1).padStart(2, "0");
    picker.value = `${y}-${m}`;
    if (typeof picker.showPicker === "function") picker.showPicker();
    else {
      picker.focus();
      picker.click();
    }
  });

document
  .getElementById("calendar-month-picker")
  ?.addEventListener("change", (e) => {
    const value = e.target.value;
    if (!value) return;
    const [y, m] = value.split("-").map(Number);
    calendarDate = new Date(y, m - 1, 1);
    localStorage.setItem("calendar_selected_year", calendarDate.getFullYear());
    localStorage.setItem("calendar_selected_month", calendarDate.getMonth());
    renderCalendar(lastTaskViewData);
  });

// カレンダー表示切り替えタブのクリックイベント
document.querySelectorAll(".calendar-mode-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const selectedMode = tab.dataset.mode;
    localStorage.setItem("calendar_display_mode", selectedMode);
    if (lastTaskViewData && typeof renderCalendar === "function") {
      renderCalendar(lastTaskViewData);
    }
  });
});

// ビュータブ
document.querySelectorAll(".view-tab").forEach((tab) => {
  tab.addEventListener("click", () => switchView(tab.dataset.view));
});

// ===== タイムラインビュー =====

let timelineDate = new Date();
timelineDate.setDate(1);

function getTimelineDisplayMode() {
  return localStorage.getItem("timeline_display_mode") || "all";
}

// v2.21.22追加
function getTimelineShowSteps() {
  return localStorage.getItem("timeline_show_steps") === "true";
}

function getTimelineStatusFilter() {
  return localStorage.getItem("timeline_status_filter") || "all";
}

function getCollapsedTimelineGroups() {
  return JSON.parse(localStorage.getItem("collapsedTimelineGroups") || "[]");
}
function saveCollapsedTimelineGroups(groupIds) {
  localStorage.setItem("collapsedTimelineGroups", JSON.stringify(groupIds));
}

function getDateOnly(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// タイムラインバーの位置・幅（%）を計算する共通ヘルパー
function calcTimelineBarPosition(
  startDateStr,
  endDateStr,
  daysInMonth,
  monthStart,
  monthEnd,
) {
  let start = getDateOnly(startDateStr);
  let end = getDateOnly(endDateStr);

  if (!start && !end) return null;
  if (!start) start = end;
  if (!end) end = start;
  if (end < start) end = start;

  const clippedStart = start < monthStart ? monthStart : start;
  const clippedEnd = end > monthEnd ? monthEnd : end;

  if (clippedEnd < monthStart || clippedStart > monthEnd) return null;

  const startDay = clippedStart.getDate();
  const endDay = clippedEnd.getDate();
  const leftPercent = ((startDay - 1) / daysInMonth) * 100;
  const widthPercent = ((endDay - startDay + 1) / daysInMonth) * 100;

  return { leftPercent, widthPercent };
}

function syncTimelineStickyOffsets() {
  const viewTabs = document.querySelector(".view-tabs");
  const toolbar = document.querySelector(".timeline-toolbar");
  if (!viewTabs || !toolbar) return;

  const header = document.querySelector(".tasks-header");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const viewTabsHeight = viewTabs.getBoundingClientRect().height;
  const contentTop = headerHeight + viewTabsHeight;

  toolbar.style.setProperty("top", `${contentTop}px`, "important");

  const toolbarHeight = toolbar.getBoundingClientRect().height;
  const axisRow = document.querySelector(".timeline-row--axis");
  if (axisRow) {
    axisRow.style.setProperty(
      "top",
      `${contentTop + toolbarHeight}px`,
      "important",
    );
  }
}

function syncTaskViewHeights() {
  const header = document.querySelector(".tasks-header");
  const viewTabs = document.querySelector(".view-tabs");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;

  // view-tabsのtopをヘッダー実測値から算出（従来の固定105pxをやめる）
  if (viewTabs) {
    viewTabs.style.setProperty("top", `${headerHeight}px`, "important");
  }
  const viewTabsHeight = viewTabs ? viewTabs.getBoundingClientRect().height : 0;
  const contentTop = headerHeight + viewTabsHeight;

  // ===== テーブルビュー：見出し行3段のsticky topを動的算出 =====
  const theadRow = document.querySelector(".task-table thead tr");
  const theadHeight = theadRow ? theadRow.getBoundingClientRect().height : 0;

  document.querySelectorAll(".task-table th").forEach((th) => {
    th.style.setProperty("top", `${contentTop}px`, "important");
  });

  const statusHeaderRow = document.querySelector(
    ".task-table-wrapper .table-status-header-row",
  );
  const statusHeaderHeight = statusHeaderRow
    ? statusHeaderRow.getBoundingClientRect().height
    : 0;
  document
    .querySelectorAll(".task-table tr.table-status-header-row td")
    .forEach((td) => {
      td.style.setProperty("top", `${contentTop + theadHeight}px`, "important");
    });

  document.querySelectorAll(".task-table tr.group-row td").forEach((td) => {
    td.style.setProperty(
      "top",
      `${contentTop + theadHeight + statusHeaderHeight}px`,
      "important",
    );
  });

  // ===== カレンダービュー：ヘッダー（月ナビ・すべて/予定/実績等）と
  // 曜日ヘッダーのsticky topを動的算出（v2.21.30追加：ヘッダーも追従させ、
  // 曜日ヘッダーはヘッダーの実測高さ分だけ下にずらして重ならないようにする） =====
  const calendarHeader = document.querySelector(".calendar-header");
  const calendarHeaderHeight = calendarHeader
    ? calendarHeader.getBoundingClientRect().height
    : 0;
  if (calendarHeader) {
    calendarHeader.style.setProperty("top", `${contentTop}px`, "important");
  }
  document.querySelectorAll(".calendar-weekday").forEach((el) => {
    el.style.setProperty(
      "top",
      `${contentTop + calendarHeaderHeight}px`,
      "important",
    );
  });
}

window.addEventListener("resize", () => {
  syncTaskViewHeights();
  if (currentView === "timeline" && lastTaskViewData) {
    syncTimelineStickyOffsets();
  }
});

function bindTimelineEvents() {
  const year = timelineDate.getFullYear();
  const month = timelineDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // グループ行の▼トグル（子タスクバーの表示/非表示）
  document.querySelectorAll(".timeline-group-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const groupId = btn.dataset.groupId;
      let collapsed = getCollapsedTimelineGroups();
      if (collapsed.includes(groupId)) {
        collapsed = collapsed.filter((id) => id !== groupId);
      } else {
        collapsed.push(groupId);
      }
      saveCollapsedTimelineGroups(collapsed);
      renderTimeline(lastTaskViewData);
    });
  });

  document.querySelectorAll(".timeline-bar").forEach((bar) => {
    bar.addEventListener("click", (e) => {
      e.stopPropagation();
      openTaskEditModal(bar.dataset.taskId);
    });

    let isResizing = false;
    let resizeDirection = "";
    let startX = 0;
    let startLeft = 0;
    let startWidth = 0;
    let trackWidth = 0;

    bar.querySelectorAll(".timeline-resize-handle").forEach((handle) => {
      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();

        isResizing = true;
        resizeDirection = handle.classList.contains("handle-left")
          ? "left"
          : "right";
        startX = e.clientX;

        const track = bar.closest(".timeline-track");
        trackWidth = track.getBoundingClientRect().width;
        startLeft = bar.offsetLeft;
        startWidth = bar.offsetWidth;

        const onMouseMove = (moveEvent) => {
          if (!isResizing) return;
          const deltaX = moveEvent.clientX - startX;
          if (resizeDirection === "left") {
            let newLeft = startLeft + deltaX;
            let newWidth = startWidth - deltaX;
            if (newWidth > 15) {
              bar.style.left = `${(newLeft / trackWidth) * 100}%`;
              bar.style.width = `${(newWidth / trackWidth) * 100}%`;
            }
          } else {
            let newWidth = startWidth + deltaX;
            if (newWidth > 15) {
              bar.style.width = `${(newWidth / trackWidth) * 100}%`;
            }
          }
        };

        const onMouseUp = async () => {
          if (!isResizing) return;
          isResizing = false;
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);

          const finalLeftPercent = bar.offsetLeft / trackWidth;
          const finalWidthPercent = bar.offsetWidth / trackWidth;
          const startDay = Math.floor(finalLeftPercent * daysInMonth) + 1;
          const endDay = Math.floor(
            (finalLeftPercent + finalWidthPercent) * daysInMonth,
          );
          const safeStartDay = Math.max(1, Math.min(daysInMonth, startDay));
          const safeEndDay = Math.max(
            safeStartDay,
            Math.min(daysInMonth, endDay),
          );

          const newStartDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(safeStartDay).padStart(2, "0")}`;
          const newEndDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(safeEndDay).padStart(2, "0")}`;

          const success = await updateTaskDuration(
            bar.dataset.taskId,
            newStartDateStr,
            newEndDateStr,
          );
          if (success) {
            if (typeof fetchTasks === "function") fetchTasks();
            else location.reload();
          }
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
    });

    bar.setAttribute("draggable", "true");
    bar.addEventListener("dragstart", (e) => {
      if (isResizing) {
        e.preventDefault();
        return;
      }
      e.stopPropagation();
      e.dataTransfer.setData("text/plain", bar.dataset.taskId);
      bar.classList.add("dragging");
    });
    bar.addEventListener("dragend", () => {
      bar.classList.remove("dragging");
    });
  });

  const prevBtn = document.getElementById("btn-timeline-prev");
  const nextBtn = document.getElementById("btn-timeline-next");
  const monthLabel = document.getElementById("timeline-month-label");
  const monthPicker = document.getElementById("timeline-month-picker");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      timelineDate.setMonth(timelineDate.getMonth() - 1);
      renderTimeline(lastTaskViewData);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      timelineDate.setMonth(timelineDate.getMonth() + 1);
      renderTimeline(lastTaskViewData);
    });
  }
  if (monthLabel && monthPicker) {
    const openMonthPicker = () => {
      if (typeof monthPicker.showPicker === "function")
        monthPicker.showPicker();
      else {
        monthPicker.focus();
        monthPicker.click();
      }
    };
    monthLabel.addEventListener("click", openMonthPicker);
    monthPicker.addEventListener("change", (e) => {
      const value = e.target.value;
      if (!value) return;
      const [y, m] = value.split("-").map(Number);
      timelineDate = new Date(y, m - 1, 1);
      renderTimeline(lastTaskViewData);
    });
  }

  document.querySelectorAll(".timeline-track").forEach((track) => {
    track.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
    track.addEventListener("drop", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const taskId = e.dataTransfer.getData("text/plain");
      if (!taskId) return;
      const rect = track.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const clickedDay = Math.floor(percent * daysInMonth) + 1;
      const safeDay = Math.max(1, Math.min(daysInMonth, clickedDay));
      const newDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
      const success = await updateTaskPlannedDate(taskId, newDateStr);
      if (success) {
        if (typeof fetchTasks === "function") fetchTasks();
        else location.reload();
      }
    });

    track.addEventListener("click", (e) => {
      if (
        e.target.closest(".timeline-bar") ||
        e.target.closest(".timeline-group-toggle") ||
        track.parentElement.querySelector(".timeline-row-header--axis")
      )
        return;
      const rect = track.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const clickedDay = Math.floor(percent * daysInMonth) + 1;
      const safeDay = Math.max(1, Math.min(daysInMonth, clickedDay));
      const cellDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
      const groupId = track.dataset.groupId;
      const group = lastTaskViewData?.groups.find(
        (g) => String(g.id) === String(groupId),
      );
      if (group) {
        openTaskModal(group.id, "未着手", cellDateStr);
      } else if (lastTaskViewData) {
        openAddTaskGroupPicker(lastTaskViewData.groups, cellDateStr);
      }
    });
  });
}

async function updateTaskPlannedDate(taskId, newDate) {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_planned_date: newDate }),
    });
    if (!response.ok) throw new Error("APIの更新に失敗しました");
    return true;
  } catch (error) {
    console.error("エラー:", error);
    alert("日付の移動に失敗しました。");
    return false;
  }
}

function renderTimeline(data) {
  const { groups, tasks, stepsByTaskId } = data;
  const showSteps = getTimelineShowSteps();
  document
    .getElementById("btn-timeline-toggle-steps")
    ?.classList.toggle("active", showSteps);

  const today = new Date();
  const year = timelineDate.getFullYear();
  const month = timelineDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth);

  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const todayLeftPercent = isCurrentMonth
    ? ((today.getDate() - 1) / daysInMonth) * 100
    : null;

  const commonTodayLineHtml =
    todayLeftPercent !== null
      ? `<div class="timeline-today-line" style="left: ${todayLeftPercent}%;"></div>`
      : "";

  const grid = document.getElementById("timeline-grid");
  grid.innerHTML = "";

  const axisCellsHtml = Array.from(
    { length: daysInMonth },
    (_, i) => `<div class="timeline-axis-cell">${i + 1}</div>`,
  ).join("");

  grid.insertAdjacentHTML(
    "beforeend",
    `<div class="timeline-row timeline-row--axis">
          <div class="timeline-row-header timeline-row-header--axis" style="min-height: 38px; padding: 4px 12px;">
            <div class="timeline-month-nav">
              <button type="button" id="btn-timeline-prev" class="btn btn-secondary" aria-label="前の月" style="padding: 1px 6px;">＜</button>
              <span id="timeline-month-label" class="timeline-month-label" role="button" tabindex="0"></span>
              <button type="button" id="btn-timeline-next" class="btn btn-secondary" aria-label="次の月" style="padding: 1px 6px;">＞</button>
              <input type="month" id="timeline-month-picker" class="timeline-month-picker" aria-label="年月を選択" />
            </div>
          </div>
          <div class="timeline-track">
            <div class="timeline-axis" style="display: grid !important; grid-template-columns: repeat(${daysInMonth}, 1fr) !important; width: 100% !important;">
              ${axisCellsHtml}
            </div>
            ${commonTodayLineHtml}
          </div>
        </div>`,
  );

  const displayMode = getTimelineDisplayMode();
  document.querySelectorAll(".timeline-mode-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === displayMode);
  });

  const statusFilter = getTimelineStatusFilter();
  document.querySelectorAll(".timeline-status-filter-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.statusFilter === statusFilter);
  });

  const collapsedGroups = getCollapsedTimelineGroups();

  const TASK_ROW_HEIGHT = displayMode === "all" ? 48 : 26;

  const filteredGroups = groups.filter((group) => {
    if (statusFilter === "all") return true;
    return calcStatus(group.id, tasks) === statusFilter;
  });
  const sortedGroups = sortGroupsByEarliestPlannedDate(filteredGroups, tasks);

  if (sortedGroups.length === 0) {
    grid.insertAdjacentHTML(
      "beforeend",
      `<div class="timeline-empty-row">該当するタスクがありません</div>`,
    );
  }

  sortedGroups.forEach((group) => {
    let childTasks = tasks.filter(
      (t) => String(t.group_id) === String(group.id),
    );

    childTasks.sort((a, b) => {
      const aTime = a.start_planned_date
        ? new Date(a.start_planned_date).getTime()
        : 0;
      const bTime = b.start_planned_date
        ? new Date(b.start_planned_date).getTime()
        : 0;
      return aTime - bTime;
    });

    const isGroupCollapsed = collapsedGroups.includes(String(group.id));
    const groupArrow = isGroupCollapsed ? "▸" : "▾";

    const LANE_HEIGHT = displayMode === "all" ? 48 : 24;

    let barsHtml = "";
    let laneCount = 0;

    if (!isGroupCollapsed) {
      // 🔴 v2.21.17：重なり判定によるレーン使い回し（パッキング）を廃止し、
      // 開始予定日順（childTasksは既にソート済み）に必ず新しい行を割り当てる方式に変更。
      // これにより、時系列が進むごとに1段ずつ下にずれる「階段状」の見た目になる。
      let laneCounter = 0;

      childTasks.forEach((task) => {
        const plannedPos = calcTimelineBarPosition(
          task.start_planned_date,
          task.end_planned_date,
          daysInMonth,
          monthStart,
          monthEnd,
        );
        const actualPos = calcTimelineBarPosition(
          task.start_date,
          task.end_date,
          daysInMonth,
          monthStart,
          monthEnd,
        );

        const showPlanned =
          plannedPos && (displayMode === "all" || displayMode === "planned");
        const showActual =
          actualPos && (displayMode === "all" || displayMode === "actual");

        if (!showPlanned && !showActual) return;

        const targetLane = laneCounter;
        laneCounter++;

        const laneTop = targetLane * LANE_HEIGHT + 4;

        // v2.21.29追加：カレンダーの予定バーと表示を揃えるため、カテゴリバッジを追加
        const categoryBadgeHtml = createCategoryBadgeHtml(task.category_name);

        if (showPlanned) {
          barsHtml += `<div class="timeline-bar timeline-bar--planned" data-task-id="${task.id}" style="left: ${plannedPos.leftPercent}%; width: ${plannedPos.widthPercent}%; top: ${laneTop}px;">
                  ${categoryBadgeHtml}
                  <span class="timeline-bar-title">${task.title}</span>
                </div>`;
        }

        if (showActual) {
          const actualTop = displayMode === "actual" ? laneTop : laneTop + 22;
          barsHtml += `<div class="timeline-bar timeline-bar--actual" data-task-id="${task.id}" style="left: ${actualPos.leftPercent}%; width: ${actualPos.widthPercent}%; top: ${actualTop}px;">
                  <span class="timeline-bar-title">${task.title}</span>
                </div>`;
        }

        // v2.21.22追加：孫タスク(ステップ)のレーンをその下に追加
        if (showSteps) {
          const steps = (stepsByTaskId[task.id] || []).filter(
            (s) => s.start_planned_date || s.end_planned_date || s.start_date || s.end_date,
          );
          steps.forEach((step) => {
            const stepPlannedPos = calcTimelineBarPosition(
              step.start_planned_date,
              step.end_planned_date,
              daysInMonth,
              monthStart,
              monthEnd,
            );
            const stepActualPos = calcTimelineBarPosition(
              step.start_date,
              step.end_date,
              daysInMonth,
              monthStart,
              monthEnd,
            );
            const pos = stepActualPos || stepPlannedPos;
            if (!pos) return;

            laneCounter++;
            const stepLaneTop = (laneCounter - 1) * LANE_HEIGHT + 4;

            barsHtml += `<div class="timeline-bar timeline-bar--step" data-task-id="${task.id}" data-step-id="${step.id}" title="${(step.title || "").replace(/"/g, "&quot;")}" style="left: ${pos.leftPercent}%; width: ${pos.widthPercent}%; top: ${stepLaneTop}px;">
                  <span class="timeline-bar-title">└ ${step.title}</span>
                </div>`;
          });
        }
      });

      laneCount = laneCounter;
    }

    const finalLaneCount = Math.max(laneCount, 1);
    const trackHeight = isGroupCollapsed
      ? 40
      : Math.max(40, finalLaneCount * LANE_HEIGHT + 16);

    const currentTodayLineHtml = !isGroupCollapsed ? commonTodayLineHtml : "";

    const headerStateClass = isGroupCollapsed
    ? "timeline-row-header--collapsed"
    : "timeline-row-header--expanded";

    grid.insertAdjacentHTML(
     "beforeend",
     `<div class="timeline-row">
        <div class="timeline-row-header ${headerStateClass}">
          <button type="button" class="timeline-group-toggle" data-group-id="${group.id}" aria-label="子タスクの表示切替">${groupArrow}</button>
          <span class="timeline-row-header-title">${group.title}（${childTasks.length}件）</span>
        </div>
        <div class="timeline-track" data-group-id="${group.id}" style="min-height: ${trackHeight}px;">
          ${currentTodayLineHtml}
          ${barsHtml}
        </div>
      </div>`,
    );
  });

  setTimeout(syncTimelineStickyOffsets, 0);
  setTimeout(syncTaskViewHeights, 0);

  const monthLabel = document.getElementById("timeline-month-label");
  if (monthLabel) {
    monthLabel.textContent = `${year}年${month + 1}月`;
  }
  const monthPicker = document.getElementById("timeline-month-picker");
  if (monthPicker) {
    monthPicker.value = `${year}-${String(month + 1).padStart(2, "0")}`;
  }

  if (typeof bindTimelineEvents === "function") {
    bindTimelineEvents();
  }
}

document.querySelectorAll(".timeline-mode-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    localStorage.setItem("timeline_display_mode", tab.dataset.mode);
    if (lastTaskViewData) renderTimeline(lastTaskViewData);
  });
});

document.querySelectorAll(".timeline-status-filter-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    localStorage.setItem("timeline_status_filter", tab.dataset.statusFilter);
    if (lastTaskViewData) renderTimeline(lastTaskViewData);
  });
});

// ===== ビュー全体の描画・切り替え =====
let currentView = localStorage.getItem("taskView") ?? "kanban";
let lastTaskViewData = null;

// ===== グループ選択モーダル =====

function closeGroupPickerModal() {
  document.getElementById("group-picker-modal").classList.add("hidden");
}

function openAddTaskGroupPicker(groups, plannedDate = null) {
  if (!groups || groups.length === 0) return;

  if (groups.length === 1) {
    openTaskModal(groups[0].id, "未着手", plannedDate);
    return;
  }

  const list = document.getElementById("group-picker-list");
  list.innerHTML = "";

  groups.forEach((group) => {
    const li = document.createElement("li");
    li.className = "settings-list-item";
    li.style.cursor = "pointer";

    const nameSpan = document.createElement("span");
    nameSpan.className = "settings-list-name";
    nameSpan.textContent = group.title;
    li.appendChild(nameSpan);

    li.addEventListener("click", () => {
      closeGroupPickerModal();
      openTaskModal(group.id, "未着手", plannedDate);
    });

    list.appendChild(li);
  });

  document.getElementById("group-picker-modal").classList.remove("hidden");
}

document
  .getElementById("btn-group-picker-close")
  .addEventListener("click", closeGroupPickerModal);
document.getElementById("group-picker-modal").addEventListener("click", (e) => {
  if (e.target.id === "group-picker-modal") closeGroupPickerModal();
});

async function renderTaskViews() {
  const data = await fetchTaskViewData();
  lastTaskViewData = data;
  renderKanban(data);
  renderTable(data);
  renderCalendar(data);
  renderTimeline(data);
  syncTaskViewHeights();
}

function switchView(view) {
  currentView = view;
  localStorage.setItem("taskView", view);
  document.querySelectorAll(".view-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });
  document.querySelectorAll(".view-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.viewPanel !== view);
  });
  syncTaskViewHeights();
  if (view === "timeline" && lastTaskViewData) {
    syncTimelineStickyOffsets();
  }
}

// v2.21.22追加：カレンダーのステップ表示トグル
document
  .getElementById("btn-calendar-toggle-steps")
  ?.addEventListener("click", (e) => {
    const next = localStorage.getItem("calendar_show_steps") !== "true";
    localStorage.setItem("calendar_show_steps", String(next));
    e.currentTarget.classList.toggle("active", next);
    if (lastTaskViewData) renderCalendar(lastTaskViewData);
  });

// v2.21.22追加：タイムラインのステップ表示トグル
document
  .getElementById("btn-timeline-toggle-steps")
  ?.addEventListener("click", (e) => {
    const next = localStorage.getItem("timeline_show_steps") !== "true";
    localStorage.setItem("timeline_show_steps", String(next));
    e.currentTarget.classList.toggle("active", next);
    if (lastTaskViewData) renderTimeline(lastTaskViewData);
  });

switchView(currentView);

document.querySelectorAll(".view-tab").forEach((tab) => {
  tab.addEventListener("click", () => switchView(tab.dataset.view));
});

// 【v2.11.0】prefill 引数追加
function openTaskModal(
  groupId,
  status = "未着手",
  plannedDate = null,
  prefill = null,
) {
  document.getElementById("task-modal").dataset.groupId = groupId;
  document.getElementById("task-modal").dataset.taskId = "";
  document.getElementById("task-title").value = "";
  document.getElementById("task-type").value =
    prefill?.type_id ?? taskTypeOptions[0]?.id ?? "";
  document.getElementById("task-category").value =
    prefill?.category_id ?? taskCategoryOptions[0]?.id ?? "";
  document.getElementById("task-granularity").value =
    prefill?.granularity ?? "";
  document.getElementById("task-book-id").value = prefill?.book_id ?? "";
  // v2.21.30追加：新規作成時はページ管理モードを一旦リセット
  document.getElementById("task-modal").dataset.bookTotalPages = "";
  renderBookProgressInfo(prefill?.book_id ?? "");
  document.getElementById("task-status").value = status;
  document.getElementById("task-start-planned-date").value =
    prefill?.start_planned_date ?? plannedDate ?? "";
  document.getElementById("task-end-planned-date").value =
    prefill?.end_planned_date ?? plannedDate ?? "";
  document.getElementById("task-start-date").value = "";
  document.getElementById("task-end-date").value = "";
  setTaskModalActualDateLock(false, null, null); // v2.21.17追加：新規作成時はロック解除
  document.getElementById("task-study-time").value = "";
  document.getElementById("task-planned-study-time").value =
    prefill?.planned_study_time ?? "";
  document.getElementById("task-memo").value = prefill?.memo ?? "";

  document.getElementById("task-understood-memo").value = prefill?.understood_memo ?? "";
  document.getElementById("task-unclear-points").value = prefill?.unclear_points ?? "";

  const viewBookBtn = document.getElementById("btn-task-view-book");
  if (viewBookBtn) {
    viewBookBtn.classList.add("hidden");
    viewBookBtn.dataset.bookId = "";
  }

  showStepSection(false);
  document.getElementById("step-list").innerHTML = "";

  const summaryBadge = document.getElementById("task-step-summary-badge");
  if (summaryBadge) summaryBadge.textContent = "0/0";

  const duplicateBtn = document.getElementById("btn-task-duplicate");
  if (duplicateBtn) duplicateBtn.classList.add("hidden");

  document.getElementById("task-modal").classList.remove("hidden");
  markTaskModalClean();
}

renderTaskViews();

document.querySelectorAll(".kanban-add-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    openGroupModal();
  });
});

document
  .getElementById("btn-group-close")
  ?.addEventListener("click", closeGroupModalWithConfirm);
document
  .getElementById("btn-task-close")
  ?.addEventListener("click", closeTaskModalWithConfirm);

document.getElementById("btn-group-add-task")?.addEventListener("click", () => {
  const groupId = document.getElementById("group-modal").dataset.groupId;
  document.getElementById("group-modal").classList.add("hidden");
  openTaskModal(groupId);
});

document
  .getElementById("btn-task-save")
  ?.addEventListener("click", async () => {
    const title = document.getElementById("task-title").value;
    if (!title) {
      alert("タイトルを入力してください");
      return;
    }

    const groupId = document.getElementById("task-modal").dataset.groupId;
    const taskId = document.getElementById("task-modal").dataset.taskId;
    const studyTimeInput = document.getElementById("task-study-time").value;
    const plannedStudyTimeInput = document.getElementById(
      "task-planned-study-time",
    ).value;

    const body = {
      group_id: groupId,
      title,
      type_id: document.getElementById("task-type").value,
      category_id: document.getElementById("task-category").value,
      granularity: document.getElementById("task-granularity").value || null,
      book_id: document.getElementById("task-book-id").value || null,
      status: document.getElementById("task-status").value,
      start_planned_date:
        document.getElementById("task-start-planned-date").value || null,
      end_planned_date:
        document.getElementById("task-end-planned-date").value || null,
      start_date: document.getElementById("task-start-date").value || null,
      end_date: document.getElementById("task-end-date").value || null,
      study_time: studyTimeInput
        ? Math.round(parseFloat(studyTimeInput) * 60)
        : null,
      planned_study_time: plannedStudyTimeInput
        ? Math.round(parseFloat(plannedStudyTimeInput) * 60)
        : null,
      memo: document.getElementById("task-memo").value || null,
      understood_memo: document.getElementById("task-understood-memo").value || null, // 追加
      unclear_points: document.getElementById("task-unclear-points").value || null,   // 追加
    };

    let savedTaskId = taskId;
    if (taskId) {
      await api(`/api/tasks/${taskId}`, "PUT", body);
    } else {
      const newTask = await api("/api/tasks", "POST", body);
      savedTaskId = newTask.id;
    }

    // v2.21.27追加：ステップを持たないタスクのみ、study_logsへ増分記録
    const stepCountForLog = document.querySelectorAll("#step-list .step-item").length;
    if (stepCountForLog === 0 && body.study_time && body.end_date) {
      const originalStudyTime = Number(document.getElementById("task-modal").dataset.originalStudyTime) || 0;
      const delta = body.study_time - originalStudyTime;
      if (delta > 0) {
        await api("/api/study-logs", "POST", {
          log_date: body.end_date,
          task_id: savedTaskId || null,
          book_id: body.book_id || null,
          // study_logs.study_time は「時間(h)」で保持するため、分単位のdeltaを変換する
          study_time: Math.round((delta / 60) * 100) / 100,
          progress_value: 1,
        });
      }
    }

    markTaskModalClean();
    document.getElementById("task-modal").classList.add("hidden");
    renderTaskViews();
  });

document
  .getElementById("btn-task-delete")
  ?.addEventListener("click", async () => {
    const taskId = document.getElementById("task-modal").dataset.taskId;
    if (!taskId) return;
    if (!confirm("削除しますか？")) return;
    await api(`/api/tasks/${taskId}`, "DELETE");
    document.getElementById("task-modal").dataset.taskId = "";
    markTaskModalClean();
    document.getElementById("task-modal").classList.add("hidden");
    renderTaskViews();
  });

// 【v2.11.0】複製ボタン
document.getElementById("btn-task-duplicate")?.addEventListener("click", () => {
  const groupId = document.getElementById("task-modal").dataset.groupId;
  const prefill = {
    type_id: document.getElementById("task-type").value,
    category_id: document.getElementById("task-category").value,
    granularity: document.getElementById("task-granularity").value || "",
    book_id: document.getElementById("task-book-id").value || "",
    start_planned_date:
      document.getElementById("task-start-planned-date").value || "",
    end_planned_date:
      document.getElementById("task-end-planned-date").value || "",
    planned_study_time:
      document.getElementById("task-planned-study-time").value || "",
    memo: document.getElementById("task-memo").value || "",
  };
  openTaskModal(groupId, "未着手", null, prefill);
});

document
  .getElementById("btn-group-delete")
  ?.addEventListener("click", async () => {
    const groupId = document.getElementById("group-modal").dataset.groupId;
    if (!groupId) return;
    if (!confirm("削除しますか？")) return;
    await api(`/api/groups/${groupId}`, "DELETE");
    document.getElementById("group-modal").dataset.groupId = "";
    markGroupModalClean();
    document.getElementById("group-modal").classList.add("hidden");
    renderTaskViews();
  });

// 💡 【修正】親タスク保存処理で「日付」と「カラー」の回収を追加
document
  .getElementById("btn-group-save")
  ?.addEventListener("click", async () => {
    const title = document.getElementById("group-title").value;
    if (!title) {
      alert("タイトルを入力してください");
      return;
    }
    const memo = document.getElementById("group-memo").value || null;
    
    // カラーと日付情報の取得
    const colorEl = document.getElementById("group-color");
    const plannedStartEl = document.getElementById('group-planned-start');
    const plannedEndEl   = document.getElementById('group-planned-end');
    const actualStartEl  = document.getElementById('group-actual-start');
    const actualEndEl    = document.getElementById('group-actual-end');

    const payload = { 
      title, 
      memo,
      color: colorEl ? colorEl.value : undefined,
      planned_start: plannedStartEl && plannedStartEl.value ? plannedStartEl.value : null,
      planned_end:   plannedEndEl && plannedEndEl.value ? plannedEndEl.value : null,
      actual_start:  actualStartEl && actualStartEl.value ? actualStartEl.value : null,
      actual_end:    actualEndEl && actualEndEl.value ? actualEndEl.value : null,
    };

    const groupId = document.getElementById("group-modal").dataset.groupId;
    if (groupId) {
      await api(`/api/groups/${groupId}`, "PUT", payload);
      markGroupModalClean();
      document.getElementById("group-modal").classList.add("hidden");
    } else {
      const newGroup = await api("/api/groups", "POST", payload);
      document.getElementById("group-modal").dataset.groupId = newGroup.id;
      document
        .getElementById("btn-group-add-task-wrapper")
        .classList.remove("hidden");
      markGroupModalClean();
    }
    renderTaskViews();
  });

// ===== タスクモーダル：未保存確認つき開閉処理 =====

function getTaskModalSnapshot() {
  const ids = [
    "task-title",
    "task-type",
    "task-category",
    "task-granularity",
    "task-book-id",
    "task-status",
    "task-start-planned-date",
    "task-end-planned-date",
    "task-start-date",
    "task-end-date",
    "task-planned-study-time",
    "task-study-time",
    "task-memo",
    "task-understood-memo", // 追加
    "task-unclear-points",  // 追加
  ];
  const snapshot = {};
  ids.forEach((id) => {
    const el = document.getElementById(id);
    let value = el ? el.value : "";
    if (
      (id === "task-study-time" || id === "task-planned-study-time") &&
      value
    ) {
      value = String(Math.round(parseFloat(value) * 60));
    }
    snapshot[id] = value;
  });
  snapshot.steps = Array.from(
    document.querySelectorAll("#step-list .step-item"),
  ).map((li) => ({
    title: li.querySelector(".step-item-title")?.textContent ?? "",
    completed: li.classList.contains("completed"),
  }));
  return JSON.stringify(snapshot);
}

function markTaskModalClean() {
  document.getElementById("task-modal").dataset.initialSnapshot =
    getTaskModalSnapshot();
}

function isTaskModalDirty() {
  const modal = document.getElementById("task-modal");
  const initial = modal.dataset.initialSnapshot;
  if (initial === undefined) return false;
  return initial !== getTaskModalSnapshot();
}

function closeTaskModalWithConfirm() {
  if (isTaskModalDirty()) {
    const ok = confirm(
      "編集の内容は保存されていません。閉じてもよろしいですか？",
    );
    if (!ok) return;
  }
  document.getElementById("task-modal").classList.add("hidden");
}

// モーダル背景や×ボタン
document
  .getElementById("btn-task-close-x")
  ?.addEventListener("click", closeTaskModalWithConfirm);
document.getElementById("task-modal")?.addEventListener("click", (e) => {
  if (e.target.id === "task-modal") closeTaskModalWithConfirm();
});

document
  .getElementById("btn-group-close-x")
  ?.addEventListener("click", closeGroupModalWithConfirm);
document.getElementById("group-modal")?.addEventListener("click", (e) => {
  if (e.target.id === "group-modal") closeGroupModalWithConfirm();
});

document
  .getElementById("btn-group-picker-close")
  ?.addEventListener("click", closeGroupPickerModal);
document
  .getElementById("group-picker-modal")
  ?.addEventListener("click", (e) => {
    if (e.target.id === "group-picker-modal") closeGroupPickerModal();
  });

// 💡 【修正】親タスクモーダル：未保存確認の監視項目に日付やカラーを追加
function getGroupModalSnapshot() {
  const ids = [
    "group-title", 
    "group-memo",
    "group-color",
    "group-planned-start",
    "group-planned-end",
    "group-actual-start",
    "group-actual-end"
  ];
  const snapshot = {};
  ids.forEach((id) => {
    const el = document.getElementById(id);
    snapshot[id] = el ? el.value : "";
  });
  return JSON.stringify(snapshot);
}

function markGroupModalClean() {
  document.getElementById("group-modal").dataset.initialSnapshot =
    getGroupModalSnapshot();
}

function isGroupModalDirty() {
  const modal = document.getElementById("group-modal");
  const initial = modal.dataset.initialSnapshot;
  if (initial === undefined) return false;
  return initial !== getGroupModalSnapshot();
}

function closeGroupModalWithConfirm() {
  if (isGroupModalDirty()) {
    const ok = confirm(
      "編集の内容は保存されていません。閉じてもよろしいですか？",
    );
    if (!ok) return;
  }
  document.getElementById("group-modal").classList.add("hidden");
}

document
  .getElementById("btn-group-close-x")
  ?.addEventListener("click", closeGroupModalWithConfirm);
document.getElementById("group-modal")?.addEventListener("click", (e) => {
  if (e.target.id === "group-modal") closeGroupModalWithConfirm();
});

async function updateTaskDuration(taskId, startDate, endDate) {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_planned_date: startDate,
        end_planned_date: endDate,
      }),
    });
    if (!response.ok) throw new Error("期間の保存に失敗しました");
    return true;
  } catch (error) {
    console.error("エラー:", error);
    alert("期間の変更に失敗しました。");
    return false;
  }
}

/**
 * 💡 子タスクの日付から親タスク（グループ）の期間を自動計算（ロールアップ）する
 * @param {Array} groups - 親タスク（グループ）の配列
 * @param {Array} tasks - 全子タスクの配列
 * @returns {Array} 期間が自動計算・更新されたグループ配列
 */
function calculateGroupMilestones(groups, tasks) {
  return groups.map(group => {
    // このグループに属する子タスクを抽出
    const childTasks = tasks.filter(t => String(t.group_id) === String(group.id));

    // 子タスクが1つもない場合は、既存の値を維持（手動設定値）
    if (childTasks.length === 0) {
      return {
        ...group,
        is_auto_calculated: false,
        child_count: 0
      };
    }

    // 1. 予定開始日：有効な start_planned_date の中で最小
    const plannedStarts = childTasks
      .map(t => t.start_planned_date)
      .filter(Boolean)
      .sort();
    const minPlannedStart = plannedStarts.length > 0 ? plannedStarts[0] : null;

    // 2. 予定終了日：有効な end_planned_date の中で最大
    const plannedEnds = childTasks
      .map(t => t.end_planned_date)
      .filter(Boolean)
      .sort();
    const maxPlannedEnd = plannedEnds.length > 0 ? plannedEnds[plannedEnds.length - 1] : null;

    // 3. 実績開始日：有効な start_date の中で最小
    const actualStarts = childTasks
      .map(t => t.start_date)
      .filter(Boolean)
      .sort();
    const minActualStart = actualStarts.length > 0 ? actualStarts[0] : null;

    // 4. 実績終了日：すべての子タスクが完了済みの場合のみ最大値
    const isAllCompleted = childTasks.every(t => t.status === '完了');
    const actualEnds = childTasks
      .map(t => t.end_date)
      .filter(Boolean)
      .sort();
    const maxActualEnd = (isAllCompleted && actualEnds.length > 0) ? actualEnds[actualEnds.length - 1] : null;

    // 計算結果を親タスクオブジェクトに上書き
    return {
      ...group,
      planned_start: minPlannedStart || group.planned_start || null,
      planned_end:   maxPlannedEnd   || group.planned_end   || null,
      actual_start:  minActualStart  || group.actual_start  || null,
      actual_end:    maxActualEnd    || group.actual_end    || null,
      is_auto_calculated: true,
      child_count: childTasks.length
    };
  });
}

// ===== ステップ管理モーダル（v2.21.19追加：task-modalから分離） =====
function openStepModal() {
  document.getElementById("step-modal")?.classList.remove("hidden");
}
function closeStepModal() {
  document.getElementById("step-modal")?.classList.add("hidden");
}
document.getElementById("btn-open-step-modal")?.addEventListener("click", openStepModal);
document.getElementById("btn-step-modal-close-x")?.addEventListener("click", closeStepModal);
document.getElementById("btn-step-modal-close")?.addEventListener("click", closeStepModal);
document.getElementById("step-modal")?.addEventListener("click", (e) => {
  if (e.target.id === "step-modal") closeStepModal();
});

// タスクモーダル→書籍モーダルへの遷移（v2.21.19追加）
document.getElementById("btn-task-view-book")?.addEventListener("click", async (e) => {
  const bookId = e.currentTarget.dataset.bookId;
  if (!bookId) return;
  document.getElementById("task-modal").classList.add("hidden");
  const book = await api(`/api/books/${bookId}`);
  if (typeof openBookModal === "function") openBookModal(book);
});