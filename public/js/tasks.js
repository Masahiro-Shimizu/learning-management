// api("/api/tasks").then((data) => {
//   console.log(data);
// });

/**
 * タスク1件のオブジェクト
 * { title: "Javaの基礎", type: "本", status: "未着手", study_time: 30 }
 */
// const tasks = [
//   { title: "Javaの基礎", type: "本", status: "未着手", study_time: 30 },
//   { title: "PHPの基礎", type: "動画", status: "進行中", study_time: 40 },
//   { title: "Reactの基礎", type: "本", status: "完了", study_time: 120 },
// ];

function calcStatus(groupId, tasks) {
  const children = tasks.filter((t) => t.group_id === groupId);
  if (children.length === 0) return "未着手";
  if (children.every((t) => t.status === "完了")) return "完了";
  if (children.every((t) => t.status === "未着手")) return "未着手";
  return "進行中";
}

/**
 * JSで文字列を組み立てるとき、テンプレートリテラルという書き方が便利
 * バッククォート（）で囲むと、中に${ }`でJSの値を埋め込める
 * ${task.type}の部分が、実際のデータ（本・動画など）に置き換わる
 */
async function renderKanban() {
  //配列をからにする
  document.querySelectorAll(".kanban-cards").forEach((container) => {
    container.innerHTML = "";
  });

  const groups = await api("/api/groups");
  const tasks = await api("/api/tasks");

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
          <button class="btn-edit-group" data-group-id="${group.id}">編集</button>
        </div>
        <div class="kanban-card-children hidden">
          <button class="btn-add-task" data-group-id="${group.id}">+ 子タスク追加</button>
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
      e.stopPropagation(); // アコーディオンが開かないようにする
      const groupId = btn.dataset.groupId;
      const group = await api(`/api/groups/${groupId}`);
      document.getElementById("group-title").value = group.title;
      document.getElementById("group-memo").value = group.memo || "";
      document.getElementById("group-modal").dataset.groupId = groupId;
      document.getElementById("group-modal").classList.remove("hidden");
    });
  });

  document.querySelectorAll(".btn-add-task").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const groupId = btn.dataset.groupId;
      document.getElementById("task-modal").dataset.groupId = groupId;
      document.getElementById("task-modal").dataset.taskId = "";
      document.getElementById("task-title").value = "";
      document.getElementById("task-type").value = "本";
      document.getElementById("task-status").value = "未着手";
      document.getElementById("task-planned-date").value = "";
      document.getElementById("task-study-time").value = "";
      document.getElementById("task-memo").value = "";
      document.getElementById("task-modal").classList.remove("hidden");
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
      document.getElementById("task-status").value = task.status;
      document.getElementById("task-planned-date").value = task.planned_date
        ? task.planned_date.slice(0, 10)
        : "";
      document.getElementById("task-study-time").value = task.study_time || "";
      document.getElementById("task-memo").value = task.memo || "";
      document.getElementById("task-modal").classList.remove("hidden");
    });
  });
}

renderKanban();

document.getElementById("btn-add-group").addEventListener("click", () => {
  document.getElementById("group-modal").classList.remove("hidden");
});
document.getElementById("btn-group-close").addEventListener("click", () => {
  document.getElementById("group-modal").classList.add("hidden");
});
document.getElementById("btn-task-close").addEventListener("click", () => {
  document.getElementById("task-modal").classList.add("hidden");
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
  const status = document.getElementById("task-status").value;
  const plannedDate =
    document.getElementById("task-planned-date").value || null;
  const studyTime = document.getElementById("task-study-time").value || null;
  const memo = document.getElementById("task-memo").value || null;

  const body = {
    group_id: groupId,
    title,
    type,
    status,
    planned_date: plannedDate,
    study_time: studyTime,
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
      await api(`/api/groups/${groupId}`, "PUT", { title, memo });
    } else {
      await api("/api/groups", "POST", { title, memo });
    }

    document.getElementById("group-modal").dataset.groupId = "";
    console.log(groupId);
    document.getElementById("group-modal").classList.add("hidden");
    renderKanban();
  });
