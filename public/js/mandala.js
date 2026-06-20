"use strict";

let mandalas = [];
let currentMandala = null;
let saveTimer = null;
let pendingCells = {}; // { "r,c": { content?, is_completed? } }

// 子タスク選択モーダル用の状態
let allTasksForPicker = [];
let pickerTargetCellId = null;
let pickerSelectedTaskIds = new Set();

const TASK_STATUS_DOT_CLASS_MANDALA = {
  未着手: "todo",
  進行中: "inprogress",
  完了: "done",
};

// ===== マンダラ座標ヘルパー =====

function getCellType(r, c) {
  if (r === 4 && c === 4) return "center";
  if (r % 3 === 1 && c % 3 === 1) return "sub-center";
  return "action";
}

function cellId(r, c) {
  return `mandala-cell-${r}-${c}`;
}

function getSubThemeNumber(r, c) {
  // AIの表記バグを防ぐため、文字列のリストとして安全に座標を定義します
  const subCenters = ["1:1", "1:4", "1:7", "4:1", "4:7", "7:1", "7:4", "7:7"];

  const currentKey = r + ":" + c;
  const idx = subCenters.indexOf(currentKey);
  return idx + 1;
}

// ===== マンダラ一覧 =====

function renderMandalaList() {
  const list = document.getElementById("mandala-list");
  if (!list) return;
  list.innerHTML = "";

  if (mandalas.length === 0) {
    list.innerHTML = `<p style="color:var(--color-text-tertiary);font-size:0.85rem;">マンダラチャートがありません。新規作成してください。</p>`;
    return;
  }

  mandalas.forEach((m) => {
    const item = document.createElement("div");
    item.className =
      "mandala-list-item" + (currentMandala?.id === m.id ? " active" : "");
    item.dataset.id = m.id;

    const updatedAt = new Date(m.updated_at);
    const dateStr = `${updatedAt.getFullYear()}/${updatedAt.getMonth() + 1}/${updatedAt.getDate()}`;

    item.innerHTML = `
      <span class="mandala-list-title">${m.title}</span>
      <span class="mandala-list-meta">${dateStr}</span>
      <div class="mandala-list-actions">
        <button type="button" class="btn btn-danger btn-mandala-delete" data-id="${m.id}" style="padding:4px 10px;font-size:0.75rem;">削除</button>
      </div>
    `;

    item.addEventListener("click", (e) => {
      if (e.target.closest(".btn-mandala-delete")) return;
      loadMandala(m.id);
    });

    item
      .querySelector(".btn-mandala-delete")
      .addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(`「${m.title}」を削除しますか？`)) return;
        await api(`/api/mandalas/${m.id}`, "DELETE");
        if (currentMandala?.id === m.id) {
          currentMandala = null;
          const chartArea = document.getElementById("mandala-chart-area");
          if (chartArea) chartArea.classList.remove("visible");
        }
        await loadMandalaList();
      });

    list.appendChild(item);
  });
}

// ===== マンダラ本体描画 =====

function renderMandalaChart(mandala) {
  const area = document.getElementById("mandala-chart-area");
  if (area) area.classList.add("visible");

  const chartTitle = document.getElementById("mandala-chart-title");
  if (chartTitle) chartTitle.textContent = mandala.title;

  // cells を 9×9 の2次元配列に変換
  const grid = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({
      content: "",
      is_completed: 0,
      cell_id: null,
      tasks: [],
    })),
  );
  mandala.cells.forEach((cell) => {
    grid[cell.row_index][cell.col_index] = {
      content: cell.content || "",
      is_completed: Number(cell.is_completed) || 0,
      cell_id: cell.id,
      tasks: cell.tasks || [],
    };
  });

  const wrapper = document.getElementById("mandala-grid-wrapper");
  if (!wrapper) return;
  wrapper.innerHTML = "";

  // 3×3のブロックを9個生成
  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      const block = document.createElement("div");
      const isCenterBlock = blockRow === 1 && blockCol === 1;
      block.className =
        "mandala-block" + (isCenterBlock ? " mandala-block--center-block" : "");

      for (let cellRow = 0; cellRow < 3; cellRow++) {
        for (let cellCol = 0; cellCol < 3; cellCol++) {
          const r = blockRow * 3 + cellRow;
          const c = blockCol * 3 + cellCol;
          const type = getCellType(r, c);
          const cellData = grid[r][c];

          const cellDiv = document.createElement("div");
          cellDiv.className = "mandala-cell";
          cellDiv.dataset.row = r;
          cellDiv.dataset.col = c;
          cellDiv.dataset.cellId = cellData.cell_id;

          if (type === "center") {
            cellDiv.classList.add("mandala-cell--center");
          } else if (type === "sub-center") {
            cellDiv.classList.add("mandala-cell--sub-center");
          }

          if (cellData.is_completed) {
            cellDiv.classList.add("mandala-cell--completed");
          }

          // 達成トグルボタン（中心セル以外）
          if (type !== "center") {
            const toggleBtn = document.createElement("button");
            toggleBtn.type = "button";
            toggleBtn.className =
              "mandala-complete-btn" +
              (cellData.is_completed ? " is-completed" : "");
            toggleBtn.title = cellData.is_completed
              ? "達成済み（クリックで解除）"
              : "達成としてマーク";
            toggleBtn.dataset.row = r;
            toggleBtn.dataset.col = c;
            toggleBtn.innerHTML = cellData.is_completed
              ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`
              : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`;
            toggleBtn.addEventListener("click", onCompleteToggle);
            cellDiv.appendChild(toggleBtn);
          }

          const textarea = document.createElement("textarea");
          textarea.id = cellId(r, c);
          textarea.value = cellData.content;
          textarea.dataset.row = r;
          textarea.dataset.col = c;

          if (type === "center") {
            textarea.placeholder = "中心テーマ";
          } else if (type === "sub-center") {
            textarea.placeholder = `サブテーマ ${getSubThemeNumber(r, c)}`;
          }

          textarea.addEventListener("input", onCellInput);
          textarea.addEventListener("keydown", onCellKeydown);

          cellDiv.appendChild(textarea);

          // タスク紐づけエリア（中心セル以外）
          if (type !== "center") {
            const taskArea = document.createElement("div");
            taskArea.className = "mandala-cell-tasks";
            taskArea.dataset.cellId = cellData.cell_id;
            renderCellTaskArea(taskArea, cellData);
            cellDiv.appendChild(taskArea);
          }

          block.appendChild(cellDiv);
        }
      }

      wrapper.appendChild(block);
    }
  }

  setSaveStatus("saved");
  updateProgressBar(mandala.cells);
}

// ===== セル内タスク表示エリア =====

function renderCellTaskArea(taskArea, cellData) {
  taskArea.innerHTML = "";

  const list = document.createElement("ul");
  list.className = "mandala-cell-task-list";

  (cellData.tasks || []).forEach((task) => {
    const dotClass = TASK_STATUS_DOT_CLASS_MANDALA[task.status] || "todo";
    const li = document.createElement("li");
    li.className = "mandala-cell-task-item";
    li.dataset.taskId = task.id;
    li.innerHTML = `
      <span class="mandala-cell-task-dot mandala-cell-task-dot--${dotClass}"></span>
      <span class="mandala-cell-task-title">${task.title}</span>
      <button type="button" class="mandala-cell-task-remove" aria-label="紐づけ解除">×</button>
    `;

    li.querySelector(".mandala-cell-task-title").addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        if (typeof openTaskEditModal === "function") {
          openTaskEditModal(task.id);
        }
      },
    );

    li.querySelector(".mandala-cell-task-remove").addEventListener(
      "click",
      async (e) => {
        e.stopPropagation();
        await removeCellTask(cellData.cell_id, task.id);
      },
    );

    list.appendChild(li);
  });

  taskArea.appendChild(list);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "mandala-cell-task-add-btn";
  addBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> タスク`;
  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openTaskPickerModal(cellData.cell_id);
  });
  taskArea.appendChild(addBtn);
}

async function removeCellTask(cellId, taskId) {
  try {
    // 🔴 古い api() から、正しい fetch() 通信（DELETEメソッド）に修正しました
    const response = await fetch(
      `/api/mandalas/cells/${cellId}/tasks/${taskId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error("サーバー側の削除に失敗しました");
    }

    // 以下の画面のUI更新処理はそのまま維持します
    const cell = currentMandala.cells.find((c) => c.id === cellId);
    if (cell) {
      cell.tasks = (cell.tasks || []).filter((t) => t.id !== taskId);
    }
    const cellDiv = document.querySelector(
      `.mandala-cell[data-cell-id="${cellId}"]`,
    );
    const taskArea = cellDiv?.querySelector(".mandala-cell-tasks");
    if (taskArea && cell) {
      renderCellTaskArea(taskArea, cell);
    }
  } catch (err) {
    console.error("紐づけ解除に失敗:", err);
    alert("紐づけの解除に失敗しました");
  }
}

// ===== 子タスク選択モーダル処理（重複なし決定版） =====

async function openTaskPickerModal(cellId) {
  pickerTargetCellId = cellId;

  const modal = document.getElementById("mandala-task-picker-modal");
  if (!modal) return;

  try {
    const resTasks = await fetch("/api/tasks");
    allTasksForPicker = await resTasks.json();

    const resLinked = await fetch(`/api/mandalas/cells/${cellId}/tasks`);
    const linkedTasks = await resLinked.json();
    pickerSelectedTaskIds = new Set(linkedTasks.map((t) => t.id));

    renderTaskPickerList("");

    document.getElementById("mandala-task-picker-search").value = "";
    modal.classList.remove("hidden");
  } catch (err) {
    console.error("モーダルのデータ取得に失敗しました:", err);
  }
}

async function saveTaskPickerSelection() {
  if (!pickerTargetCellId) return;

  try {
    const resLinked = await fetch(
      `/api/mandalas/cells/${pickerTargetCellId}/tasks`,
    );
    const linkedTasks = await resLinked.json();
    const originalIds = new Set(linkedTasks.map((t) => t.id));

    // 🟢【修正】丸カッコ ( ) から、正しい配列カッコ [ ] に修正しました
    const toAdd = [...pickerSelectedTaskIds].filter(
      (id) => !originalIds.has(id),
    );
    const toRemove = [...originalIds].filter(
      (id) => !pickerSelectedTaskIds.has(id),
    );

    // 新規紐づけを追加 (POST)
    for (const taskId of toAdd) {
      await fetch(`/api/mandalas/cells/${pickerTargetCellId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId }),
      });
    }

    // 紐づけを解除 (DELETE)
    for (const taskId of toRemove) {
      await fetch(`/api/mandalas/cells/${pickerTargetCellId}/tasks/${taskId}`, {
        method: "DELETE",
      });
    }

    // 最新の結果を取得してUIを更新
    const resUpdated = await fetch(
      `/api/mandalas/cells/${pickerTargetCellId}/tasks`,
    );
    const updatedTasks = await resUpdated.json();

    const cell = currentMandala.cells.find((c) => c.id === pickerTargetCellId);
    if (cell) {
      cell.tasks = updatedTasks;
      const cellDiv = document.querySelector(
        `.mandala-cell[data-cell-id="${pickerTargetCellId}"]`,
      );
      const taskArea = cellDiv?.querySelector(".mandala-cell-tasks");
      if (taskArea) {
        renderCellTaskArea(taskArea, cell);
      }
    }

    closeTaskPickerModal();
  } catch (err) {
    console.error("タスク紐づけの保存に失敗しました:", err);
    alert("保存に失敗しました");
  }
}

function renderTaskPickerList(keyword) {
  const listEl = document.getElementById("mandala-task-picker-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  // 外枠コンテナの縦伸び・Grid設定を強制リセット
  listEl.style.setProperty("display", "flex", "important");
  listEl.style.setProperty("flex-direction", "column", "important");
  listEl.style.setProperty("gap", "6px", "important");
  listEl.style.setProperty("height", "auto", "important");
  listEl.style.setProperty("grid-template-columns", "none", "important");
  listEl.style.setProperty("grid-template-rows", "none", "important");

  const lowerKeyword = keyword.trim().toLowerCase();
  const filtered = allTasksForPicker.filter((t) =>
    t.title.toLowerCase().includes(lowerKeyword),
  );

  const groupMap = new Map();
  filtered.forEach((t) => {
    const groupTitle = t.group_id || "no-group";
    if (!groupMap.has(groupTitle)) groupMap.set(groupTitle, []);
    groupMap.get(groupTitle).push(t);
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `<p style="color:var(--color-text-tertiary);font-size:0.85rem;padding:var(--space-8);">該当するタスクがありません</p>`;
    return;
  }

  groupMap.forEach((tasksInGroup) => {
    tasksInGroup.forEach((task) => {
      const dotClass = TASK_STATUS_DOT_CLASS_MANDALA[task.status] || "todo";
      const checked = pickerSelectedTaskIds.has(task.id) ? "checked" : "";

      const row = document.createElement("label");
      row.className = "custom-task-picker-row";

      // インラインスタイルで1行ずつのリストカードデザインを再定義
      row.style.setProperty("display", "flex", "important");
      row.style.setProperty("align-items", "center", "important");
      row.style.setProperty("gap", "12px", "important");
      row.style.setProperty("width", "100%", "important");
      row.style.setProperty("padding", "10px 14px", "important");
      row.style.setProperty(
        "background",
        "var(--color-bg-card, #1e1e24)",
        "important",
      );
      row.style.setProperty(
        "border",
        "1px solid rgba(255, 255, 255, 0.05)",
        "important",
      );
      row.style.setProperty("border-radius", "8px", "important");
      row.style.setProperty("cursor", "pointer", "important");
      row.style.setProperty("box-sizing", "border-box", "important");
      row.style.setProperty("height", "auto", "important");
      row.style.setProperty("margin-bottom", "4px", "important");

      row.innerHTML = `
            <input type="checkbox" value="${task.id}" ${checked} style="width: 16px !important; height: 16px !important; margin: 0 !important; flex-shrink: 0 !important; cursor: pointer !important;" />
            <span class="mandala-cell-task-dot mandala-cell-task-dot--${dotClass}" style="display: inline-block !important; width: 8px !important; height: 8px !important; border-radius: 50% !important; flex-shrink: 0 !important;"></span>
            <span class="mandala-task-picker-title" style="color: #fff !important; font-size: 14px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; flex: 1 !important; text-align: left !important;">${task.title}</span>
          `;

      const checkbox = row.querySelector("input");
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          pickerSelectedTaskIds.add(task.id);
        } else {
          pickerSelectedTaskIds.delete(task.id);
        }
      });

      listEl.appendChild(row);
    });
  });
}

function closeTaskPickerModal() {
  const modal = document.getElementById("mandala-task-picker-modal");
  if (modal) modal.classList.add("hidden");
  pickerTargetCellId = null;
  pickerSelectedTaskIds = new Set();
}

// ===== 達成トグル =====

async function onCompleteToggle(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const r = parseInt(btn.dataset.row);
  const c = parseInt(btn.dataset.col);
  const cellDiv = btn.closest(".mandala-cell");

  const nowCompleted = !cellDiv.classList.contains("mandala-cell--completed");

  cellDiv.classList.toggle("mandala-cell--completed", nowCompleted);
  btn.classList.toggle("is-completed", nowCompleted);
  btn.title = nowCompleted ? "達成済み（クリックで解除）" : "達成としてマーク";
  btn.innerHTML = nowCompleted
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`;

  const total = document.querySelectorAll(
    ".mandala-cell:not(.mandala-cell--center)",
  ).length;
  const done = document.querySelectorAll(".mandala-cell--completed").length;
  updateProgressBarFromDOM(done, total);

  const cellData = currentMandala?.cells.find(
    (cell) => cell.row_index === r && cell.col_index === c,
  );
  if (cellData) cellData.is_completed = nowCompleted ? 1 : 0;

  try {
    await api(`/api/mandalas/${currentMandala.id}/cells`, "PUT", {
      cells: [
        { row_index: r, col_index: c, is_completed: nowCompleted ? 1 : 0 },
      ],
    });
  } catch (err) {
    console.error("達成状態の保存失敗:", err);
  }
}

// ===== 進捗バー =====

function updateProgressBar(cells) {
  const actionCells = cells.filter(
    (cell) => !(cell.row_index === 4 && cell.col_index === 4),
  );
  const total = actionCells.length;
  const done = actionCells.filter((c) => Number(c.is_completed)).length;
  updateProgressBarFromDOM(done, total);
}

function updateProgressBarFromDOM(done, total) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const bar = document.getElementById("mandala-progress-bar");
  const label = document.getElementById("mandala-progress-label");
  if (bar) bar.style.width = `${percent}%`;
  if (label) label.textContent = `達成 ${done} / ${total}（${percent}%）`;
}

// ===== セル入力ハンドラ =====

function onCellInput(e) {
  const r = e.target.dataset.row;
  const c = e.target.dataset.col;
  if (!pendingCells[`${r},${c}`]) pendingCells[`${r},${c}`] = {};
  pendingCells[`${r},${c}`].content = e.target.value;

  setSaveStatus("saving");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(autoSave, 1000);
}

function onCellKeydown(e) {
  if (e.key === "Tab") {
    e.preventDefault();
    const r = parseInt(e.target.dataset.row);
    const c = parseInt(e.target.dataset.col);
    let nextR = r;
    let nextC = c + (e.shiftKey ? -1 : 1);
    if (nextC > 8) {
      nextC = 0;
      nextR = Math.min(r + 1, 8);
    }
    if (nextC < 0) {
      nextC = 8;
      nextR = Math.max(r - 1, 0);
    }
    const nextEl = document.getElementById(cellId(nextR, nextC));
    if (nextEl) nextEl.focus();
  }
}

// ===== 自動保存 =====

async function autoSave() {
  if (!currentMandala || Object.keys(pendingCells).length === 0) return;

  const cells = Object.entries(pendingCells).map(([key, data]) => {
    const [row_index, col_index] = key.split(",").map(Number);
    return { row_index, col_index, ...data };
  });

  pendingCells = {};

  try {
    await api(`/api/mandalas/${currentMandala.id}/cells`, "PUT", { cells });
    setSaveStatus("saved");
  } catch (err) {
    console.error("自動保存失敗:", err);
    setSaveStatus("");
  }
}

function setSaveStatus(status) {
  const el = document.getElementById("mandala-save-status");
  if (!el) return;
  el.className = "mandala-save-status";
  if (status === "saving") {
    el.classList.add("saving");
    el.textContent = "保存中…";
  } else if (status === "saved") {
    el.classList.add("saved");
    el.textContent = "✓ 保存済み";
  } else {
    el.textContent = "";
  }
}

// ===== API操作 =====

async function loadMandalaList() {
  mandalas = await api("/api/mandalas");
  renderMandalaList();
}

async function loadMandala(id) {
  if (Object.keys(pendingCells).length > 0) {
    clearTimeout(saveTimer);
    await autoSave();
  }
  currentMandala = await api(`/api/mandalas/${id}`);
  renderMandalaList();
  renderMandalaChart(currentMandala);
}

async function createMandala() {
  const input = document.getElementById("mandala-new-title");
  if (!input) return;
  const title = input.value.trim();
  if (!title) {
    alert("タイトルを入力してください");
    return;
  }

  const newMandala = await api("/api/mandalas", "POST", { title });
  input.value = "";
  mandalas.unshift(newMandala);
  currentMandala = newMandala;
  renderMandalaList();
  renderMandalaChart(newMandala);
}

// ===== 初期化 =====

async function initMandala() {
  await loadMandalaList();

  const createBtn = document.getElementById("btn-mandala-create");
  if (createBtn) {
    createBtn.addEventListener("click", createMandala);
  }

  const titleInput = document.getElementById("mandala-new-title");
  if (titleInput) {
    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") createMandala();
    });
  }

  const pickerModal = document.getElementById("mandala-task-picker-modal");
  if (pickerModal) {
    pickerModal.addEventListener("click", (e) => {
      if (e.target.id === "mandala-task-picker-modal") closeTaskPickerModal();
    });
  }

  const pickerCloseBtn = document.getElementById(
    "btn-mandala-task-picker-close",
  );
  if (pickerCloseBtn) {
    pickerCloseBtn.addEventListener("click", closeTaskPickerModal);
  }

  const pickerCancelBtn = document.getElementById(
    "btn-mandala-task-picker-cancel",
  );
  if (pickerCancelBtn) {
    pickerCancelBtn.addEventListener("click", closeTaskPickerModal);
  }

  const pickerSaveBtn = document.getElementById("btn-mandala-task-picker-save");
  if (pickerSaveBtn) {
    pickerSaveBtn.addEventListener("click", saveTaskPickerSelection);
  }

  const pickerSearchInput = document.getElementById(
    "mandala-task-picker-search",
  );
  if (pickerSearchInput) {
    pickerSearchInput.addEventListener("input", (e) => {
      renderTaskPickerList(e.target.value);
    });
  }
}
