"use strict";

let mandalas = [];
let currentMandala = null;
let saveTimer = null;
let pendingCells = {}; // { "r,c": content }

// ===== マンダラ座標ヘルパー =====

/**
 * 9×9グリッド上の (row, col) がどのセルタイプか返す
 *   center     : (4,4) 中心テーマ
 *   sub-center : 各3×3ブロックの中心 (1,1),(1,4),(1,7),(4,1),(4,4),(4,7),(7,1),(7,4),(7,7)
 *                ただし(4,4)はcenterが優先
 *   action     : その他のアクションセル
 */
function getCellType(r, c) {
  if (r === 4 && c === 4) return "center";
  if (r % 3 === 1 && c % 3 === 1) return "sub-center";
  return "action";
}

/**
 * セルのテキストエリアIDを返す
 */
function cellId(r, c) {
  return `mandala-cell-${r}-${c}`;
}

// ===== 描画 =====

function renderMandalaList() {
  const list = document.getElementById("mandala-list");
  list.innerHTML = "";

  if (mandalas.length === 0) {
    list.innerHTML = `<p style="color:var(--color-text-tertiary);font-size:0.85rem;">マンダラチャートがありません。新規作成してください。</p>`;
    return;
  }

  mandalas.forEach((m) => {
    const item = document.createElement("div");
    item.className = "mandala-list-item" + (currentMandala?.id === m.id ? " active" : "");
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

    item.querySelector(".btn-mandala-delete").addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm(`「${m.title}」を削除しますか？`)) return;
      await api(`/api/mandalas/${m.id}`, "DELETE");
      if (currentMandala?.id === m.id) {
        currentMandala = null;
        document.getElementById("mandala-chart-area").classList.remove("visible");
      }
      await loadMandalaList();
    });

    list.appendChild(item);
  });
}

function renderMandalaChart(mandala) {
  const area = document.getElementById("mandala-chart-area");
  area.classList.add("visible");

  document.getElementById("mandala-chart-title").textContent = mandala.title;

  // cells を 9×9 の2次元配列に変換
  const grid = Array.from({ length: 9 }, () => Array(9).fill(""));
  mandala.cells.forEach((cell) => {
    grid[cell.row_index][cell.col_index] = cell.content || "";
  });

  const wrapper = document.getElementById("mandala-grid-wrapper");
  wrapper.innerHTML = "";

  // 3×3のブロックを9個生成（ブロック順：左上から右下）
  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      const block = document.createElement("div");
      const isCenterBlock = blockRow === 1 && blockCol === 1;
      block.className = "mandala-block" + (isCenterBlock ? " mandala-block--center-block" : "");

      // ブロック内の3×3セル
      for (let cellRow = 0; cellRow < 3; cellRow++) {
        for (let cellCol = 0; cellCol < 3; cellCol++) {
          const r = blockRow * 3 + cellRow;
          const c = blockCol * 3 + cellCol;
          const type = getCellType(r, c);
          const content = grid[r][c];

          const cellDiv = document.createElement("div");
          cellDiv.className = "mandala-cell";

          const textarea = document.createElement("textarea");
          textarea.id = cellId(r, c);
          textarea.value = content;
          textarea.dataset.row = r;
          textarea.dataset.col = c;

          if (type === "center") {
            cellDiv.classList.add("mandala-cell--center");
            textarea.placeholder = "中心テーマ";
          } else if (type === "sub-center") {
            cellDiv.classList.add("mandala-cell--sub-center");
            textarea.placeholder = `サブテーマ ${getSubThemeNumber(r, c)}`;
          } else {
            textarea.placeholder = "";
          }

          textarea.addEventListener("input", onCellInput);
          textarea.addEventListener("keydown", onCellKeydown);

          cellDiv.appendChild(textarea);
          block.appendChild(cellDiv);
        }
      }

      wrapper.appendChild(block);
    }
  }

  setSaveStatus("saved");
}

/**
 * サブテーマ番号（1〜8）を返す
 * 中心(4,4)を除いた8つのブロック中心を順番に番号付け
 */
function getSubThemeNumber(r, c) {
  const subCenters = [
    [1, 1], [1, 4], [1, 7],
    [4, 1],          [4, 7],
    [7, 1], [7, 4], [7, 7],
  ];
  const idx = subCenters.findIndex(([sr, sc]) => sr === r && sc === c);
  return idx + 1;
}

// ===== セル入力ハンドラ =====

function onCellInput(e) {
  const r = e.target.dataset.row;
  const c = e.target.dataset.col;
  pendingCells[`${r},${c}`] = e.target.value;

  // 同期: 中心(4,4)が変更されたらサブテーマセルのplaceholderは変わらない（入力値は独立）
  // 自動保存: 1秒後
  setSaveStatus("saving");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(autoSave, 1000);
}

function onCellKeydown(e) {
  // Tab で次のセルに移動
  if (e.key === "Tab") {
    e.preventDefault();
    const r = parseInt(e.target.dataset.row);
    const c = parseInt(e.target.dataset.col);
    let nextR = r;
    let nextC = c + (e.shiftKey ? -1 : 1);
    if (nextC > 8) { nextC = 0; nextR = Math.min(r + 1, 8); }
    if (nextC < 0) { nextC = 8; nextR = Math.max(r - 1, 0); }
    const nextEl = document.getElementById(cellId(nextR, nextC));
    if (nextEl) nextEl.focus();
  }
}

// ===== 自動保存 =====

async function autoSave() {
  if (!currentMandala || Object.keys(pendingCells).length === 0) return;

  const cells = Object.entries(pendingCells).map(([key, content]) => {
    const [row_index, col_index] = key.split(",").map(Number);
    return { row_index, col_index, content };
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
  // 未保存の変更があれば即時保存
  if (Object.keys(pendingCells).length > 0) {
    clearTimeout(saveTimer);
    await autoSave();
  }

  currentMandala = await api(`/api/mandalas/${id}`);
  renderMandalaList(); // active状態を更新
  renderMandalaChart(currentMandala);
}

async function createMandala() {
  const input = document.getElementById("mandala-new-title");
  const title = input.value.trim();
  if (!title) { alert("タイトルを入力してください"); return; }

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
}