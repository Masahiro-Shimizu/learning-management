const CALENDAR_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const CLOCK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>`;

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
  const colorClass = TASK_TYPE_COLOR_CLASSES[hash];

  return { label: typeName, class: colorClass };
}

const TASK_CATEGORY_COLOR_CLASSES = [
  "indigo",
  "amber",
  "teal",
  "rose",
  "lime",
  "sky",
  "violet",
];

function getCategoryInfo(categoryName) {
  if (!categoryName) return { label: "", class: "default" };

  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash =
      (hash * 31 + categoryName.charCodeAt(i)) %
      TASK_CATEGORY_COLOR_CLASSES.length;
  }
  const colorClass = TASK_CATEGORY_COLOR_CLASSES[hash];

  return { label: categoryName, class: colorClass };
}

function createCategoryBadgeHtml(categoryName) {
  const categoryInfo = getCategoryInfo(categoryName);
  return `<span class="task-category-badge task-category-badge--${categoryInfo.class}">${categoryInfo.label}</span>`;
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

function getTaskDisplayMinutes(task) {
  return task.planned_study_time || task.study_time || null;
}

function createStepBadgeHtml(steps) {
  if (!steps || steps.length === 0) return "";
  const completed = steps.filter((s) => s.is_completed).length;
  return `<span class="task-card-meta-item task-step-badge">${completed}/${steps.length}</span>`;
}

function createTaskCardHtml(task, steps = []) {
  const typeInfo = getTypeInfo(task.type_name);
  const categoryBadgeHtml = createCategoryBadgeHtml(task.category_name);
  const displayDate = getTaskDisplayDate(task);
  const minutes = getTaskDisplayMinutes(task);

  const dateHtml = displayDate
    ? `<span class="task-card-meta-item">${CALENDAR_ICON}${displayDate}</span>`
    : "";
  const timeHtml = minutes
    ? `<span class="task-card-meta-item">${CLOCK_ICON}${minutes}分</span>`
    : "";
  const stepBadgeHtml = createStepBadgeHtml(steps);

  return `
    <article
      class="task-card task-card--${typeInfo.class}"
      data-task-id="${task.id}"
      tabindex="0"
    >
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
    </article>
  `;
}

function calcStatus(groupId, tasks) {
  const children = tasks.filter((t) => t.group_id === groupId);
  if (children.length === 0) return "未着手";
  if (children.every((t) => t.status === "完了")) return "完了";
  if (children.every((t) => t.status === "未着手")) return "未着手";
  return "進行中";
}

function groupStepsByTaskId(allSteps) {
  const map = {};
  allSteps.forEach((step) => {
    if (!map[step.task_id]) map[step.task_id] = [];
    map[step.task_id].push(step);
  });
  return map;
}

function createGroupCardHtml(group, childTasks, stepsByTaskId) {
  const childrenHTML = childTasks
    .map((t) => createTaskCardHtml(t, stepsByTaskId[t.id] || []))
    .join("");

  return `
    <div class="group-card" data-group-id="${group.id}">
      <div class="group-card-header">
        <p class="group-card-title">${group.title}</p>
        <button
          type="button"
          class="btn-edit-group"
          data-group-id="${group.id}"
          aria-label="親タスクを編集"
        >編集</button>
      </div>
      <div class="group-card-children hidden">
        <button
          type="button"
          class="btn-add-task"
          data-group-id="${group.id}"
        >+ 子タスク追加</button>
        ${childrenHTML}
      </div>
    </div>
  `;
}

function openGroupModal(groupId = "") {
  document.getElementById("group-title").value = "";
  document.getElementById("group-memo").value = "";
  document.getElementById("group-modal").dataset.groupId = groupId;
  document.getElementById("btn-group-add-task-wrapper").classList.add("hidden");
  document.getElementById("group-modal").classList.remove("hidden");
}

async function openGroupEditModal(groupId) {
  const group = await api(`/api/groups/${groupId}`);
  document.getElementById("group-title").value = group.title;
  document.getElementById("group-memo").value = group.memo || "";
  document.getElementById("group-modal").dataset.groupId = groupId;
  document.getElementById("btn-group-add-task-wrapper").classList.add("hidden");
  document.getElementById("group-modal").classList.remove("hidden");
}

// ===== ステップ（孫タスク）関連 =====

function createStepItemHtml(step) {
  const completed = step.is_completed ? "completed" : "";
  const checked = step.is_completed ? "checked" : "";
  return `
    <li class="step-item ${completed}" data-step-id="${step.id}">
      <input type="checkbox" ${checked} aria-label="ステップ完了" />
      <span class="step-item-title">${step.title}</span>
      <button type="button" class="btn-step-delete" aria-label="ステップ削除">×</button>
    </li>
  `;
}

async function renderStepList(taskId) {
  const stepList = document.getElementById("step-list");
  stepList.innerHTML = "";
  const steps = await api(`/api/tasks/${taskId}/steps`);
  steps.forEach((step) => {
    stepList.insertAdjacentHTML("beforeend", createStepItemHtml(step));
  });
}

function showStepSection(show) {
  const section = document.querySelector(".step-section");
  section.classList.toggle("hidden", !show);
}

function updateCardStepBadge(taskId) {
  const steps = Array.from(document.querySelectorAll("#step-list .step-item"));
  const total = steps.length;
  const completed = steps.filter((li) =>
    li.classList.contains("completed"),
  ).length;
  const text = `${completed}/${total}`;

  const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
  if (card) {
    let badge = card.querySelector(".task-step-badge");
    if (total === 0) {
      if (badge) badge.remove();
    } else if (badge) {
      badge.textContent = text;
    } else {
      const meta = card.querySelector(".task-card-meta");
      meta.insertAdjacentHTML(
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
    cell.innerHTML =
      total === 0
        ? `<span class="task-table-dim">－</span>`
        : `<span class="task-step-badge">${text}</span>`;
  }
}

document.getElementById("step-list").addEventListener("change", async (e) => {
  if (e.target.type !== "checkbox") return;
  const li = e.target.closest(".step-item");
  const stepId = li.dataset.stepId;
  const isCompleted = e.target.checked;

  await api(`/api/steps/${stepId}`, "PUT", { is_completed: isCompleted });
  li.classList.toggle("completed", isCompleted);

  const taskId = document.getElementById("task-modal").dataset.taskId;
  updateCardStepBadge(taskId);
});

document.getElementById("step-list").addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-step-delete")) return;
  const li = e.target.closest(".step-item");
  const stepId = li.dataset.stepId;

  await api(`/api/steps/${stepId}`, "DELETE");
  li.remove();

  const taskId = document.getElementById("task-modal").dataset.taskId;
  updateCardStepBadge(taskId);
});

document.getElementById("btn-step-add").addEventListener("click", async () => {
  const input = document.getElementById("step-new-title");
  const title = input.value.trim();
  if (!title) return;

  const taskId = document.getElementById("task-modal").dataset.taskId;
  const newStep = await api(`/api/tasks/${taskId}/steps`, "POST", { title });

  document
    .getElementById("step-list")
    .insertAdjacentHTML("beforeend", createStepItemHtml(newStep));
  input.value = "";

  updateCardStepBadge(taskId);
});

// ===== タスクモーダル =====

async function openTaskEditModal(taskId) {
  const task = await api(`/api/tasks/${taskId}`);
  document.getElementById("task-modal").dataset.taskId = taskId;
  document.getElementById("task-modal").dataset.groupId = task.group_id;
  document.getElementById("task-title").value = task.title;
  document.getElementById("task-type").value = task.type_id;
  document.getElementById("task-category").value = task.category_id;
  document.getElementById("task-granularity").value = task.granularity || "";
  document.getElementById("task-book-id").value = task.book_id || "";
  document.getElementById("task-status").value = task.status;
  document.getElementById("task-start-planned-date").value =
    task.start_planned_date ? task.start_planned_date.slice(0, 10) : "";
  document.getElementById("task-end-planned-date").value = task.end_planned_date
    ? task.end_planned_date.slice(0, 10)
    : "";
  document.getElementById("task-start-date").value = task.start_date
    ? task.start_date.slice(0, 10)
    : "";
  document.getElementById("task-end-date").value = task.end_date
    ? task.end_date.slice(0, 10)
    : "";
  document.getElementById("task-study-time").value = task.study_time || "";
  document.getElementById("task-planned-study-time").value =
    task.planned_study_time || "";
  document.getElementById("task-memo").value = task.memo || "";

  showStepSection(true);
  await renderStepList(taskId);

  document.getElementById("task-modal").classList.remove("hidden");
  markTaskModalClean();
}

function bindKanbanEvents() {
  document.querySelectorAll(".group-card-header").forEach((header) => {
    header.addEventListener("click", () => {
      header.nextElementSibling.classList.toggle("hidden");
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
}

async function fetchTaskViewData() {
  const groups = await api("/api/groups");
  const tasks = await api("/api/tasks");
  const books = await api("/api/books");
  const allSteps = await api("/api/steps");
  const stepsByTaskId = groupStepsByTaskId(allSteps);

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

  // 再描画前に、開いている親カードのgroup-idを記録しておく
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
      createGroupCardHtml(group, childTasks, stepsByTaskId),
    );
  });

  Object.entries(statusCounts).forEach(([status, count]) => {
    const badge = document.querySelector(`[data-count-for="${status}"]`);
    if (badge) badge.textContent = count;
  });

  // 展開状態を復元
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

function createGroupRowHtml(group, childCount) {
  return `
    <tr class="group-row" data-group-id="${group.id}">
      <td colspan="6">
        <span class="group-row-toggle">▾</span>
        ${group.title}（${childCount}件）
      </td>
      <td>
        <button
          type="button"
          class="btn-edit-group"
          data-group-id="${group.id}"
          aria-label="親タスクを編集"
        >編集</button>
      </td>
    </tr>
  `;
}

function createTaskRowHtml(task, steps) {
  const typeInfo = getTypeInfo(task.type_name);
  const categoryBadgeHtml = createCategoryBadgeHtml(task.category_name);
  const dotClass = TASK_STATUS_DOT_CLASS[task.status] || "todo";
  const plannedDate = formatDateShort(task.start_planned_date) || "－";
  const completedDate = formatDateShort(task.end_date) || "－";
  const minutes = task.study_time != null ? `${task.study_time}分` : "－";
  const stepBadge =
    steps && steps.length > 0
      ? `<span class="task-step-badge">${steps.filter((s) => s.is_completed).length}/${steps.length}</span>`
      : `<span class="task-table-dim">－</span>`;

  return `
    <tr class="task-row" data-task-id="${task.id}" tabindex="0">
      <td>${task.title}</td>
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
      <td class="task-table-dim">${plannedDate}</td>
      <td class="task-table-dim">${completedDate}</td>
      <td class="task-table-dim">${minutes}</td>
      <td>${stepBadge}</td>
    </tr>
  `;
}

function bindTableEvents() {
  document.querySelectorAll("#task-table-body .group-row").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest(".btn-edit-group")) return;
      row.classList.toggle("collapsed");
      const toggle = row.querySelector(".group-row-toggle");
      toggle.textContent = row.classList.contains("collapsed") ? "▸" : "▾";
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

  groups.forEach((group) => {
    const childTasks = tasks.filter((t) => t.group_id === group.id);
    tbody.insertAdjacentHTML(
      "beforeend",
      createGroupRowHtml(group, childTasks.length),
    );
    childTasks.forEach((task) => {
      tbody.insertAdjacentHTML(
        "beforeend",
        createTaskRowHtml(task, stepsByTaskId[task.id] || []),
      );
    });
  });

  bindTableEvents();
}

// ===== カレンダービュー =====

let calendarDate = new Date();
calendarDate.setDate(1);

function formatDateForCompare(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function createCalendarChipHtml(task, steps) {
  const categoryBadgeHtml = createCategoryBadgeHtml(task.category_name);
  const stepBadge =
    steps && steps.length > 0
      ? `<span class="calendar-chip-badge">${steps.filter((s) => s.is_completed).length}/${steps.length}</span>`
      : "";
  return `
    <div class="calendar-chip" data-task-id="${task.id}" tabindex="0">
      ${categoryBadgeHtml}
      <span class="calendar-chip-title">${task.title}</span>
      ${stepBadge}
    </div>
  `;
}

function bindCalendarEvents() {
  document.querySelectorAll(".calendar-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      openTaskEditModal(chip.dataset.taskId);
    });
    chip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openTaskEditModal(chip.dataset.taskId);
      }
    });
  });
}

function renderCalendar(data) {
  const { tasks, stepsByTaskId } = data;

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  document.getElementById("calendar-month-label").textContent =
    `${year}年${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  ["日", "月", "火", "水", "木", "金", "土"].forEach((label) => {
    grid.insertAdjacentHTML(
      "beforeend",
      `<div class="calendar-weekday">${label}</div>`,
    );
  });

  for (let i = 0; i < startWeekday; i++) {
    grid.insertAdjacentHTML(
      "beforeend",
      `<div class="calendar-cell calendar-cell--empty"></div>`,
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayTasks = tasks.filter(
      (t) => formatDateForCompare(t.start_planned_date) === cellDateStr,
    );

    const visibleTasks = dayTasks.slice(0, 3);
    const remaining = dayTasks.length - visibleTasks.length;

    const chipsHtml = visibleTasks
      .map((t) => createCalendarChipHtml(t, stepsByTaskId[t.id] || []))
      .join("");
    const moreHtml =
      remaining > 0
        ? `<div class="calendar-chip-more">+${remaining}件</div>`
        : "";

    grid.insertAdjacentHTML(
      "beforeend",
      `
        <div class="calendar-cell">
          <div class="calendar-cell-date">${day}</div>
          ${chipsHtml}
          ${moreHtml}
        </div>
      `,
    );
  }

  bindCalendarEvents();
}

document.getElementById("btn-calendar-prev").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar(lastTaskViewData);
});

document.getElementById("btn-calendar-next").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar(lastTaskViewData);
});

// ===== タイムラインビュー =====

let timelineDate = new Date();
timelineDate.setDate(1);

function getDateOnly(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function createTimelineBarHtml(task, daysInMonth, monthStart, monthEnd) {
  let start = getDateOnly(task.start_planned_date);
  let end = getDateOnly(task.end_planned_date);

  if (!start && !end) return "";

  if (!start) start = end;
  if (!end) end = start;
  if (end < start) end = start;

  const clippedStart = start < monthStart ? monthStart : start;
  const clippedEnd = end > monthEnd ? monthEnd : end;

  if (clippedEnd < monthStart || clippedStart > monthEnd) return "";

  const startDay = clippedStart.getDate();
  const endDay = clippedEnd.getDate();
  const leftPercent = ((startDay - 1) / daysInMonth) * 100;
  const widthPercent = ((endDay - startDay + 1) / daysInMonth) * 100;

  return { leftPercent, widthPercent };
}

function bindTimelineEvents() {
  document.querySelectorAll(".timeline-bar").forEach((bar) => {
    bar.addEventListener("click", () => {
      openTaskEditModal(bar.dataset.taskId);
    });
    bar.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openTaskEditModal(bar.dataset.taskId);
      }
    });
  });

  const prevBtn = document.getElementById("btn-timeline-prev");
  const nextBtn = document.getElementById("btn-timeline-next");
  const monthLabel = document.getElementById("timeline-month-label");
  const monthPicker = document.getElementById("timeline-month-picker");

  prevBtn.addEventListener("click", () => {
    timelineDate.setMonth(timelineDate.getMonth() - 1);
    renderTimeline(lastTaskViewData);
  });

  nextBtn.addEventListener("click", () => {
    timelineDate.setMonth(timelineDate.getMonth() + 1);
    renderTimeline(lastTaskViewData);
  });

  const openMonthPicker = () => {
    if (typeof monthPicker.showPicker === "function") {
      monthPicker.showPicker();
    } else {
      monthPicker.focus();
      monthPicker.click();
    }
  };

  monthLabel.addEventListener("click", openMonthPicker);
  monthLabel.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMonthPicker();
    }
  });

  monthPicker.addEventListener("change", (e) => {
    const value = e.target.value; // "YYYY-MM"
    if (!value) return;
    const [year, month] = value.split("-").map(Number);
    timelineDate = new Date(year, month - 1, 1);
    renderTimeline(lastTaskViewData);
  });

  const hideCompletedCheckbox = document.getElementById(
    "timeline-hide-completed",
  );
  if (hideCompletedCheckbox) {
    hideCompletedCheckbox.addEventListener("change", () => {
      renderTimeline(lastTaskViewData);
    });
  }
}

function renderTimeline(data) {
  const { groups, tasks } = data;

  // 完了タスク非表示フィルタ
  const hideCompleted =
    document.getElementById("timeline-hide-completed")?.checked ?? false;
  const filteredTasks = hideCompleted
    ? tasks.filter((t) => t.status !== "完了")
    : tasks;
  const year = timelineDate.getFullYear();
  const month = timelineDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth);

  const grid = document.getElementById("timeline-grid");
  grid.innerHTML = "";

  const axisCellsHtml = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return `<div class="timeline-axis-cell">${day}</div>`;
  }).join("");

  grid.insertAdjacentHTML(
    "beforeend",
    `
      <div class="timeline-row">
        <div class="timeline-row-header timeline-row-header--axis">
          <div class="timeline-month-nav">
            <button type="button" id="btn-timeline-prev" class="btn btn-secondary" aria-label="前の月">＜</button>
            <span id="timeline-month-label" class="timeline-month-label" role="button" tabindex="0"></span>
            <button type="button" id="btn-timeline-next" class="btn btn-secondary" aria-label="次の月">＞</button>
            <input type="month" id="timeline-month-picker" class="timeline-month-picker" aria-label="年月を選択" />
          </div>
        </div>
        <div class="timeline-track">
          <div class="timeline-axis" style="grid-template-columns: repeat(${daysInMonth}, 1fr);">
            ${axisCellsHtml}
          </div>
        </div>
      </div>
    `,
  );

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const todayLeftPercent = isCurrentMonth
    ? ((today.getDate() - 1) / daysInMonth) * 100
    : null;

  groups.forEach((group) => {
    const childTasks = filteredTasks.filter((t) => t.group_id === group.id);

    // 追加：子タスクが1件もなければ行を描画しない
    if (childTasks.length === 0) return;

    const barsHtml = childTasks
      .map((task) => {
        const result = createTimelineBarHtml(
          task,
          daysInMonth,
          monthStart,
          monthEnd,
        );
        if (!result) return "";
        const index = childTasks.indexOf(task);
        const top = 8 + index * 28;
        return `
          <div
            class="timeline-bar"
            data-task-id="${task.id}"
            tabindex="0"
            style="left: ${result.leftPercent}%; width: ${result.widthPercent}%; top: ${top}px;"
          >
            <span class="timeline-bar-title">${task.title}</span>
          </div>
        `;
      })
      .join("");

    const trackHeight = Math.max(40, childTasks.length * 28 + 16);
    const todayLineHtml =
      todayLeftPercent !== null
        ? `<div class="timeline-today-line" style="left: ${todayLeftPercent}%;"></div>`
        : "";

    grid.insertAdjacentHTML(
      "beforeend",
      `
        <div class="timeline-row">
          <div class="timeline-row-header">${group.title}</div>
          <div class="timeline-track" style="min-height: ${trackHeight}px;">
            ${todayLineHtml}
            ${barsHtml}
          </div>
        </div>
      `,
    );
  });

  bindTimelineEvents();

  document.getElementById("timeline-month-label").textContent =
    `${year}年${month + 1}月`;

  const monthPicker = document.getElementById("timeline-month-picker");
  monthPicker.value = `${year}-${String(month + 1).padStart(2, "0")}`;
}

// ===== ビュー全体の描画・切り替え =====

let currentView = localStorage.getItem("taskView") ?? "kanban";
let lastTaskViewData = null;

async function renderTaskViews() {
  // データ取得前に先にビューを切り替えておく（ちらつき防止）
  switchView(currentView);

  const data = await fetchTaskViewData();
  lastTaskViewData = data;
  renderKanban(data);
  renderTable(data);
  renderCalendar(data);
  renderTimeline(data);
}

function switchView(view) {
  currentView = view;
  localStorage.setItem("taskView", view); // 追加

  document.querySelectorAll(".view-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });

  document.querySelectorAll(".view-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.viewPanel !== view);
  });
}

document.querySelectorAll(".view-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    switchView(tab.dataset.view);
  });
});

function openTaskModal(groupId, status = "未着手") {
  document.getElementById("task-modal").dataset.groupId = groupId;
  document.getElementById("task-modal").dataset.taskId = "";
  document.getElementById("task-title").value = "";
  document.getElementById("task-type").value = taskTypeOptions[0]?.id ?? "";
  document.getElementById("task-category").value =
    taskCategoryOptions[0]?.id ?? "";
  document.getElementById("task-granularity").value = "";
  document.getElementById("task-book-id").value = "";
  document.getElementById("task-status").value = status;
  document.getElementById("task-start-planned-date").value = "";
  document.getElementById("task-end-planned-date").value = "";
  document.getElementById("task-start-date").value = "";
  document.getElementById("task-end-date").value = "";
  document.getElementById("task-study-time").value = "";
  document.getElementById("task-planned-study-time").value = "";
  document.getElementById("task-memo").value = "";

  showStepSection(false);
  document.getElementById("step-list").innerHTML = "";

  document.getElementById("task-modal").classList.remove("hidden");
  markTaskModalClean();
}

renderTaskViews().then(() => {
  switchView(currentView);
});

document.getElementById("btn-add-group").addEventListener("click", () => {
  openGroupModal();
});

document.querySelectorAll(".kanban-add-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    openGroupModal();
  });
});

document.getElementById("btn-group-close").addEventListener("click", () => {
  document.getElementById("group-modal").classList.add("hidden");
});

document
  .getElementById("btn-task-close")
  .addEventListener("click", closeTaskModalWithConfirm);

document.getElementById("btn-group-add-task").addEventListener("click", () => {
  const groupId = document.getElementById("group-modal").dataset.groupId;
  document.getElementById("group-modal").classList.add("hidden");
  openTaskModal(groupId);
});

document.getElementById("btn-task-save").addEventListener("click", async () => {
  const title = document.getElementById("task-title").value;
  if (!title) {
    alert("タイトルを入力してください");
    return;
  }

  const groupId = document.getElementById("task-modal").dataset.groupId;
  const taskId = document.getElementById("task-modal").dataset.taskId;
  const typeId = document.getElementById("task-type").value;
  const categoryId = document.getElementById("task-category").value;
  const granularity = document.getElementById("task-granularity").value || null;
  const bookId = document.getElementById("task-book-id").value || null;
  const status = document.getElementById("task-status").value;
  const startPlannedDate =
    document.getElementById("task-start-planned-date").value || null;
  const endPlannedDate =
    document.getElementById("task-end-planned-date").value || null;
  const startDate = document.getElementById("task-start-date").value || null;
  const endDate = document.getElementById("task-end-date").value || null;
  const studyTime = document.getElementById("task-study-time").value || null;
  const plannedStudyTime =
    document.getElementById("task-planned-study-time").value || null;
  const memo = document.getElementById("task-memo").value || null;

  const body = {
    group_id: groupId,
    title,
    type_id: typeId,
    category_id: categoryId,
    granularity,
    book_id: bookId,
    status,
    start_planned_date: startPlannedDate,
    end_planned_date: endPlannedDate,
    start_date: startDate,
    end_date: endDate,
    study_time: studyTime,
    planned_study_time: plannedStudyTime,
    memo,
  };

  if (taskId) {
    await api(`/api/tasks/${taskId}`, "PUT", body);
  } else {
    await api("/api/tasks", "POST", body);
  }

  markTaskModalClean();
  document.getElementById("task-modal").classList.add("hidden");
  renderTaskViews();
});

document
  .getElementById("btn-task-delete")
  .addEventListener("click", async () => {
    const taskId = document.getElementById("task-modal").dataset.taskId;
    if (!taskId) return;
    if (!confirm("削除しますか？")) return;
    await api(`/api/tasks/${taskId}`, "DELETE");
    document.getElementById("task-modal").dataset.taskId = "";
    markTaskModalClean();
    document.getElementById("task-modal").classList.add("hidden");
    renderTaskViews();
  });

document
  .getElementById("btn-group-delete")
  .addEventListener("click", async () => {
    const groupId = document.getElementById("group-modal").dataset.groupId;
    if (!groupId) return;
    if (!confirm("削除しますか？")) return;
    await api(`/api/groups/${groupId}`, "DELETE");
    document.getElementById("group-modal").dataset.groupId = "";
    document.getElementById("group-modal").classList.add("hidden");
    renderTaskViews();
  });

document
  .getElementById("btn-group-save")
  .addEventListener("click", async () => {
    const title = document.getElementById("group-title").value;
    if (!title) {
      alert("タイトルを入力してください");
      return;
    }

    const memo = document.getElementById("group-memo").value || null;
    const groupId = document.getElementById("group-modal").dataset.groupId;

    if (groupId) {
      await api(`/api/groups/${groupId}`, "PUT", { title, memo });
      document.getElementById("group-modal").classList.add("hidden");
    } else {
      const newGroup = await api("/api/groups", "POST", { title, memo });
      document.getElementById("group-modal").dataset.groupId = newGroup.id;
      document
        .getElementById("btn-group-add-task-wrapper")
        .classList.remove("hidden");
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
  ];
  const snapshot = {};
  ids.forEach((id) => {
    const el = document.getElementById(id);
    snapshot[id] = el ? el.value : "";
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

document
  .getElementById("btn-task-close-x")
  .addEventListener("click", closeTaskModalWithConfirm);

document.getElementById("task-modal").addEventListener("click", (e) => {
  if (e.target.id === "task-modal") {
    closeTaskModalWithConfirm();
  }
});
