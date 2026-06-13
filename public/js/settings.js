"use strict";

let taskTypes = [];

async function initSettings() {
  await loadTaskTypes();

  document
    .getElementById("btn-task-type-add")
    .addEventListener("click", handleAddTaskType);
}

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
