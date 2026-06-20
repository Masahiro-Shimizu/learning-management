"use strict";

let taskTypes = [];
let taskCategories = []; // 🔴 カテゴリ用の状態管理配列を追加

async function initSettings() {
  await loadTaskTypes();
  await loadTaskCategories(); // 🔴 カテゴリの読み込みを追加

  document
    .getElementById("btn-task-type-add")
    .addEventListener("click", handleAddTaskType);

  // 🔴 カテゴリ追加ボタンのイベント登録
  document
    .getElementById("btn-task-category-add")
    .addEventListener("click", handleAddTaskCategory);
}

/* ==========================================================================
   タスク種別 (既存の処理)
   ========================================================================== */
async function loadTaskTypes() {
  const res = await fetch("/api/task-types");
  taskTypes = await res.json();
  renderTaskTypeList();
}

function renderTaskTypeList() {
  const list = document.getElementById("task-type-list");
  list.innerHTML = "";

  taskTypes.forEach((type) => {
    const li = document.createElement("li");
    li.className = "settings-list-item";
    li.dataset.id = type.id;

    const nameSpan = document.createElement("span");
    nameSpan.className = "settings-list-name";
    nameSpan.textContent = type.name;

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-secondary";
    editBtn.textContent = "編集";
    editBtn.addEventListener("click", () => startEditTaskType(li, type));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-danger";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => handleDeleteTaskType(type));

    li.appendChild(nameSpan);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

function startEditTaskType(li, type) {
  li.innerHTML = "";

  const input = document.createElement("input");
  input.type = "text";
  input.value = type.name;

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "btn btn-primary";
  saveBtn.textContent = "保存";
  saveBtn.addEventListener("click", () =>
    handleSaveTaskType(type, input.value),
  );

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn btn-secondary";
  cancelBtn.textContent = "キャンセル";
  cancelBtn.addEventListener("click", renderTaskTypeList);

  li.appendChild(input);
  li.appendChild(saveBtn);
  li.appendChild(cancelBtn);
}

async function handleSaveTaskType(type, newName) {
  const trimmed = newName.trim();
  if (!trimmed) {
    alert("種別名は必須です");
    return;
  }

  const res = await fetch(`/api/task-types/${type.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: trimmed, sort_order: type.sort_order }),
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.error || "更新に失敗しました");
    return;
  }

  await loadTaskTypes();
}

async function handleDeleteTaskType(type) {
  if (!confirm(`「${type.name}」を削除しますか？`)) return;

  const res = await fetch(`/api/task-types/${type.id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.error || "削除に失敗しました");
    return;
  }

  await loadTaskTypes();
}

async function handleAddTaskType() {
  const input = document.getElementById("task-type-new-name");
  const name = input.value.trim();
  if (!name) {
    alert("種別名を入力してください");
    return;
  }

  const sort_order = taskTypes.length;

  const res = await fetch("/api/task-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, sort_order }),
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.error || "追加に失敗しました");
    return;
  }

  input.value = "";
  await loadTaskTypes();
}

/* ==========================================================================
   🔴 カテゴリ種別 (新規追加の処理)
   ========================================================================== */
async function loadTaskCategories() {
  // phpMyAdminのテーブル名「task_categories」に合わせたAPIエンドポイントを設定
  const res = await fetch("/api/task-categories");
  taskCategories = await res.json();
  renderTaskCategoryList();
}

function renderTaskCategoryList() {
  const list = document.getElementById("task-category-list");
  list.innerHTML = "";

  taskCategories.forEach((category) => {
    const li = document.createElement("li");
    li.className = "settings-list-item";
    li.dataset.id = category.id;

    const nameSpan = document.createElement("span");
    nameSpan.className = "settings-list-name";
    nameSpan.textContent = category.name;

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-secondary";
    editBtn.textContent = "編集";
    editBtn.addEventListener("click", () =>
      startEditTaskCategory(li, category),
    );

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-danger";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () =>
      handleDeleteTaskCategory(category),
    );

    li.appendChild(nameSpan);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

function startEditTaskCategory(li, category) {
  li.innerHTML = "";

  const input = document.createElement("input");
  input.type = "text";
  input.value = category.name;

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "btn btn-primary";
  saveBtn.textContent = "保存";
  saveBtn.addEventListener("click", () =>
    handleSaveTaskCategory(category, input.value),
  );

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn btn-secondary";
  cancelBtn.textContent = "キャンセル";
  cancelBtn.addEventListener("click", renderTaskCategoryList);

  li.appendChild(input);
  li.appendChild(saveBtn);
  li.appendChild(cancelBtn);
}

async function handleSaveTaskCategory(category, newName) {
  const trimmed = newName.trim();
  if (!trimmed) {
    alert("カテゴリ名は必須です");
    return;
  }

  const res = await fetch(`/api/task-categories/${category.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: trimmed, sort_order: category.sort_order }),
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.error || "更新に失敗しました");
    return;
  }

  await loadTaskCategories();
}

async function handleDeleteTaskCategory(category) {
  if (!confirm(`「${category.name}」を削除しますか？`)) return;

  const res = await fetch(`/api/task-categories/${category.id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.error || "削除に失敗しました");
    return;
  }

  await loadTaskCategories();
}

async function handleAddTaskCategory() {
  const input = document.getElementById("task-category-new-name");
  const name = input.value.trim();
  if (!name) {
    alert("カテゴリ名を入力してください");
    return;
  }

  const sort_order = taskCategories.length;

  const res = await fetch("/api/task-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, sort_order }),
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.error || "追加に失敗しました");
    return;
  }

  input.value = "";
  await loadTaskCategories();
}
