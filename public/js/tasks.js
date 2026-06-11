async function renderKanban() {
  document.querySelectorAll(".kanban-cards").forEach((container) => {
    container.innerHTML = "";
  });

  const groups = await api("/api/groups");
  const tasks = await api("/api/tasks");
  const books = await api("/api/books");

  const bookSelect = document.getElementById("task-book-id");
  bookSelect.innerHTML = '<option value="">（なし）</option>';
  books.forEach((book) => {
    const option = document.createElement("option");
    option.value = book.id;
    option.textContent = book.title;
    bookSelect.appendChild(option);
  });

  groups.forEach((group) => {
    const status = calcStatus(group.id, tasks);
    const container = document.querySelector(`[data-status="${status}"]`);

    const childTasks = tasks.filter((t) => t.group_id === group.id);
    const childrenHTML = childTasks
      .map(
        (t) => `
      <div class="child-task" data-task-id="${t.id}">
        <span>${t.title}</span>
        <span class="status-${t.status}">${t.status}</span>
      </div>
      `,
      )
      .join("");

    const cardHtml = `
      <div class="card kanban-card" data-group-id="${group.id}">
        <div class="kanban-card-header">
          <p>${group.title}</p>
          <button class="btn btn-secondary btn-edit-group" data-group-id="${group.id}">編集</button>
        </div>
        <div class="kanban-card-children hidden">
          <button class="btn btn-primary btn-add-task" data-group-id="${group.id}">+ 子タスク追加</button>
          ${childrenHTML}
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", cardHtml);
  });

  document.querySelectorAll(".kanban-card-header").forEach((header) => {
    header.addEventListener("click", () => {
      const children = header.nextElementSibling;
      children.classList.toggle("hidden");
    });
  });

  document.querySelectorAll(".btn-edit-group").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const groupId = btn.dataset.groupId;
      const group = await api(`/api/groups/${groupId}`);
      document.getElementById("group-title").value = group.title;
      document.getElementById("group-memo").value = group.memo || "";
      document.getElementById("group-modal").dataset.groupId = groupId;
      // 編集時は「子タスクを追加する」ボタンを非表示
      document
        .getElementById("btn-group-add-task-wrapper")
        .classList.add("hidden");
      document.getElementById("group-modal").classList.remove("hidden");
    });
  });

  document.querySelectorAll(".btn-add-task").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openTaskModal(btn.dataset.groupId);
    });
  });

  document.querySelectorAll(".child-task").forEach((row) => {
    row.addEventListener("click", async (e) => {
      e.stopPropagation();
      const taskId = row.dataset.taskId;
      const task = await api(`/api/tasks/${taskId}`);
      document.getElementById("task-modal").dataset.taskId = taskId;
      document.getElementById("task-modal").dataset.groupId = task.group_id;
      document.getElementById("task-title").value = task.title;
      document.getElementById("task-type").value = task.type;
      document.getElementById("task-granularity").value =
        task.granularity || "";
      document.getElementById("task-book-id").value = task.book_id || "";
      document.getElementById("task-status").value = task.status;
      document.getElementById("task-start-planned-date").value =
        task.start_planned_date ? task.start_planned_date.slice(0, 10) : "";
      document.getElementById("task-end-planned-date").value =
        task.end_planned_date ? task.end_planned_date.slice(0, 10) : "";
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
      document.getElementById("task-modal").classList.remove("hidden");
    });
  });
}

// 子タスクモーダルを開く共通関数
function openTaskModal(groupId) {
  document.getElementById("task-modal").dataset.groupId = groupId;
  document.getElementById("task-modal").dataset.taskId = "";
  document.getElementById("task-title").value = "";
  document.getElementById("task-type").value = "本";
  document.getElementById("task-granularity").value = "";
  document.getElementById("task-book-id").value = "";
  document.getElementById("task-status").value = "未着手";
  document.getElementById("task-start-planned-date").value = "";
  document.getElementById("task-end-planned-date").value = "";
  document.getElementById("task-start-date").value = "";
  document.getElementById("task-end-date").value = "";
  document.getElementById("task-study-time").value = "";
  document.getElementById("task-planned-study-time").value = "";
  document.getElementById("task-memo").value = "";
  document.getElementById("task-modal").classList.remove("hidden");
}

function calcStatus(groupId, tasks) {
  const children = tasks.filter((t) => t.group_id === groupId);
  if (children.length === 0) return "未着手";
  if (children.every((t) => t.status === "完了")) return "完了";
  if (children.every((t) => t.status === "未着手")) return "未着手";
  return "進行中";
}

renderKanban();

document.getElementById("btn-add-group").addEventListener("click", () => {
  document.getElementById("group-title").value = "";
  document.getElementById("group-memo").value = "";
  document.getElementById("group-modal").dataset.groupId = "";
  // 新規追加時は「子タスクを追加する」ボタンを非表示（保存後に表示）
  document.getElementById("btn-group-add-task-wrapper").classList.add("hidden");
  document.getElementById("group-modal").classList.remove("hidden");
});

document.getElementById("btn-group-close").addEventListener("click", () => {
  document.getElementById("group-modal").classList.add("hidden");
});

document.getElementById("btn-task-close").addEventListener("click", () => {
  document.getElementById("task-modal").classList.add("hidden");
});

// 「子タスクを追加する」ボタン
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
  const type = document.getElementById("task-type").value;
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
    type,
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

  document.getElementById("task-modal").classList.add("hidden");
  renderKanban();
});

document
  .getElementById("btn-task-delete")
  .addEventListener("click", async () => {
    const taskId = document.getElementById("task-modal").dataset.taskId;
    if (!taskId) return;
    if (!confirm("削除しますか？")) return;
    await api(`/api/tasks/${taskId}`, "DELETE");
    document.getElementById("task-modal").dataset.taskId = "";
    document.getElementById("task-modal").classList.add("hidden");
    renderKanban();
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
    renderKanban();
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
      // 編集保存
      await api(`/api/groups/${groupId}`, "PUT", { title, memo });
      document.getElementById("group-modal").classList.add("hidden");
    } else {
      // 新規保存 → 「子タスクを追加する」ボタンを表示
      const newGroup = await api("/api/groups", "POST", { title, memo });
      document.getElementById("group-modal").dataset.groupId = newGroup.id;
      document
        .getElementById("btn-group-add-task-wrapper")
        .classList.remove("hidden");
    }

    renderKanban();
  });
