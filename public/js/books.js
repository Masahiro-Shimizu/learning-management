let allBooksList = [];
let allTasksForBooks = [];
let currentBookModalTasks = []; // 開いている書籍モーダルの章（子タスク）一覧のキャッシュ

// ==========================================
// 1. 自動算出：未読／読書中／読了の判定
// ==========================================
function calcBookStatus(book, tasks = []) {
  const completed = Number(book.completed_count) || 0;
  // 読了：全何章が設定済みかつ完了数が全何章以上
  if (book.total_chapters && completed >= book.total_chapters) return "読了";

  // tasksが空または配列でない場合の安全対策
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const children = safeTasks.filter(
    (t) => String(t.book_id) === String(book.id),
  );

  // 子タスクが0件、または全て未着手 → 未読
  if (children.length === 0 || children.every((t) => t.status === "未着手")) {
    return "未読";
  }
  // それ以外（着手中・一部完了など）→ 読書中
  return "読書中";
}

// ==========================================
// 2. 書籍カードのHTMLを生成する関数
// ==========================================
function createBookCardHtml(book) {
  const totalChapters = book.total_chapters;
  const completedCount = Number(book.completed_count) || 0;

  let progressHtml = "";
  if (totalChapters) {
    const percent = Math.min(
      100,
      Math.round((completedCount / totalChapters) * 100),
    );
    progressHtml = `
      <div class="book-card-progress-wrap">
        <div class="book-card-progress-bar"><i style="width:${percent}%"></i></div>
        <div class="book-card-progress-lbl"><span>進捗</span><span>${percent}%（${completedCount} / ${totalChapters}章）</span></div>
      </div>
    `;
  }

  const memoHtml = book.memo
    ? `<div class="book-card-memo">${book.memo}</div>`
    : "";

  const displayTitle = book.title || "タイトルなし";
  const displayAuthor = book.author || "著者不明";

  const coverHtml =
    book.cover_url && book.cover_url !== "undefined"
      ? `<img src="${book.cover_url}" alt="${displayTitle}">`
      : `<span class="no-cover">表紙</span>`;

  return `
    <div class="card book-card" data-book-id="${book.id}">
        <div class="cover">${coverHtml}</div>
        <div class="book-card-info">
          <p class="book-card-title">${displayTitle}</p>
          <p class="book-card-author">${displayAuthor}</p>
          ${memoHtml}
          ${progressHtml}
        </div>
    </div>
  `;
}

// ==========================================
// 3. 書籍一覧をカンバンに描画する関数
// ==========================================
function renderBookList(books, tasks) {
  const kanbanContainer = document.getElementById("book-kanban");
  if (!kanbanContainer) {
    console.warn(
      "書籍のカンバン要素（#book-kanban）が画面上に見つかりません。描画をスキップします。",
    );
    return;
  }

  const columns = {
    未読: kanbanContainer.querySelector('.kanban-cards[data-status="未読"]'),
    読書中: kanbanContainer.querySelector(
      '.kanban-cards[data-status="読書中"]',
    ),
    読了: kanbanContainer.querySelector('.kanban-cards[data-status="読了"]'),
  };

  Object.values(columns).forEach((col) => {
    if (col) col.innerHTML = "";
  });

  const statusCounts = { 未読: 0, 読書中: 0, 読了: 0 };

  books.forEach((book) => {
    const status = calcBookStatus(book, tasks);
    statusCounts[status]++;
    const col = columns[status];
    if (col) {
      col.insertAdjacentHTML("beforeend", createBookCardHtml(book));
    }
  });

  Object.entries(statusCounts).forEach(([status, count]) => {
    const badge = kanbanContainer.querySelector(`[data-count-for="${status}"]`);
    if (badge) badge.textContent = count;
  });

  kanbanContainer.querySelectorAll(".book-card").forEach((card) => {
    card.addEventListener("click", async () => {
      const bookId = card.dataset.bookId;
      const book = await api(`/api/books/${bookId}`);
      openBookModal(book);
    });
  });
}

// ==========================================
// 4. 書籍詳細モーダル
// ==========================================

function openBookModal(book) {
  document.getElementById("book-modal-title").textContent = book.title || "";
  document.getElementById("book-author").value = book.author || "";
  document.getElementById("book-total-chapters").value =
    book.total_chapters ?? "";

  // 表紙画像
  const coverImg = document.getElementById("book-modal-cover-img");
  const coverEmpty = document.getElementById("book-modal-cover-empty");
  if (book.cover_url && book.cover_url !== "undefined") {
    coverImg.src = book.cover_url;
    coverImg.style.display = "block";
    coverEmpty.style.display = "none";
  } else {
    coverImg.removeAttribute("src");
    coverImg.style.display = "none";
    coverEmpty.style.display = "flex";
  }

  // 目次
  const bookId = String(book.id);
  const chapterTasks = allTasksForBooks
    .filter((t) => String(t.book_id) === bookId)
    .map((t) => ({ ...t }));
  currentBookModalTasks = chapterTasks;

  renderBookChapterList(currentBookModalTasks);
  updateBookModalProgress(currentBookModalTasks);

  document.getElementById("book-modal").dataset.bookId = bookId;
  document.getElementById("book-modal").classList.remove("hidden");
}

// 目次リストの描画（アコーディオン＆メモ欄付き・枠線なし版）
function renderBookChapterList(tasks) {
  const listEl = document.getElementById("book-chapter-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  if (tasks.length === 0) {
    listEl.innerHTML = `<li class="book-chapter-empty">この書籍に紐づくタスクがありません</li>`;
    return;
  }

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "book-chapter-item";
    li.dataset.taskId = task.id;

    // ★ 修正箇所: 枠線や背景色のスタイル設定を削除し、下の余白（間隔）だけ設定
    li.style.marginBottom = "12px";

    // アコーディオンのHTML構造を作成（メモ欄の上の点線なども削除しシンプルにしました）
    li.innerHTML = `
  <div class="chapter-header" style="display: flex; align-items: center; gap: 8px;">
    <button type="button" class="chapter-toggle-btn" style="background: none; border: none; color: #aaa; cursor: pointer; width: 24px; height: 24px; font-size: 12px; display: flex; align-items: center; justify-content: center; padding: 0;">▶</button>
    <input type="checkbox" class="chapter-check" ${task.status === "完了" ? "checked" : ""}>
    <span class="book-chapter-title chapter-title" style="flex: 1; cursor: pointer; text-decoration: underline; text-decoration-color: rgba(255,255,255,0.25);">${task.title}</span>
    <button type="button" class="chapter-goto-task-btn" title="このタスクを編集" style="background:none;border:none;color:#818cf8;cursor:pointer;display:flex;align-items:center;padding:2px;flex-shrink:0;">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </button>
  </div>

  <div class="chapter-details" style="display: none; padding-left: 32px; margin-top: 8px;">
    <div style="margin-bottom: 8px;">
      <label style="font-size: 12px; color: #aaa; display: block; margin-bottom: 4px;">理解したこと</label>
      <textarea class="understood-input" rows="2" style="width: 100%; background: rgba(0,0,0,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px; resize: vertical;">${task.understood_memo || ""}</textarea>
    </div>
    <div style="margin-bottom: 8px;">
      <label style="font-size: 12px; color: #aaa; display: block; margin-bottom: 4px;">不明だったこと</label>
      <textarea class="unclear-input" rows="2" style="width: 100%; background: rgba(0,0,0,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px; resize: vertical;">${task.unclear_points || ""}</textarea>
    </div>
    <button type="button" class="btn btn-primary btn-save-chapter" style="font-size: 12px; padding: 4px 10px;">章のメモを保存</button>
  </div>
`;

    // ===== ① 開閉（アコーディオン）イベント =====
    const toggleBtn = li.querySelector(".chapter-toggle-btn");
    const details = li.querySelector(".chapter-details");
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = details.style.display === "none";
      details.style.display = isHidden ? "block" : "none";
      toggleBtn.textContent = isHidden ? "▼" : "▶";
    });

    // ===== ② 既存のチェック状態更新 ＆ タイトルクリックイベント =====
    const checkbox = li.querySelector(".chapter-check");
    checkbox.addEventListener("change", () =>
      handleBookChapterToggle(task.id, checkbox.checked),
    );

    const title = li.querySelector(".chapter-title");
    title.addEventListener("click", () => {
      if (typeof openTaskEditModal === "function") {
        closeBookModal();
        openTaskEditModal(task.id);
      }
    });

    const gotoBtn = li.querySelector(".chapter-goto-task-btn");
    gotoBtn.addEventListener("click", (e) => {
    e.stopPropagation();
     if (typeof openTaskEditModal === "function") {
      closeBookModal();
      openTaskEditModal(task.id);
    }
  });

    // ===== ③ 各章（タスク）のメモ保存イベント =====
    const saveBtn = li.querySelector(".btn-save-chapter");
    saveBtn.addEventListener("click", async () => {
      const understoodVal = li.querySelector(".understood-input").value;
      const unclearVal = li.querySelector(".unclear-input").value;

      try {
        await api(`/api/tasks/${task.id}`, "PUT", {
          understood_memo: understoodVal,
          unclear_points: unclearVal,
        });

        const cached = currentBookModalTasks.find((t) => t.id === task.id);
        if (cached) {
          cached.understood_memo = understoodVal;
          cached.unclear_points = unclearVal;
        }
        alert("章のメモを保存しました！");
      } catch (err) {
        console.error(err);
        alert("保存に失敗しました");
      }
    });

    listEl.appendChild(li);
  });
}

// チェック操作でタスクのステータスを更新
async function handleBookChapterToggle(taskId, checked) {
  const newStatus = checked ? "完了" : "未着手";
  try {
    await api(`/api/tasks/${taskId}`, "PUT", { status: newStatus });

    const cached = currentBookModalTasks.find((t) => t.id === taskId);
    if (cached) cached.status = newStatus;
    updateBookModalProgress(currentBookModalTasks);

    const globalTask = allTasksForBooks.find((t) => t.id === taskId);
    if (globalTask) globalTask.status = newStatus;
  } catch (err) {
    console.error("章の状態更新に失敗しました:", err);
    alert("更新に失敗しました");
    renderBookChapterList(currentBookModalTasks);
  }
}

// 進捗バー更新
function updateBookModalProgress(tasks) {
  const fill = document.getElementById("book-modal-progress-fill");
  const label = document.getElementById("book-modal-progress-label");
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "完了").length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  if (fill) fill.style.width = `${percent}%`;
  if (label) {
    label.textContent =
      total > 0
        ? `進捗 ${done} / ${total}（${percent}%）`
        : "紐づくタスクがまだありません";
  }
}

function closeBookModal() {
  document.getElementById("book-modal").classList.add("hidden");
  currentBookModalTasks = [];
}

async function renderBooks() {
  allBooksList = await api("/api/books");
  allTasksForBooks = await api("/api/tasks");
  renderBookList(allBooksList, allTasksForBooks);
}

function initBooks() {
  setTimeout(() => {
    renderBooks();
  }, 100);

  document
    .getElementById("btn-book-close-x")
    .addEventListener("click", closeBookModal);
  document
    .getElementById("btn-book-close")
    .addEventListener("click", closeBookModal);
  document.getElementById("book-modal").addEventListener("click", (e) => {
    if (e.target.id === "book-modal") closeBookModal();
  });

  // 書籍（全体）の保存処理
  document
    .getElementById("btn-book-save")
    .addEventListener("click", async () => {
      const bookId = document.getElementById("book-modal").dataset.bookId;
      const author = document.getElementById("book-author").value || null;
      const totalChaptersValue = document.getElementById(
        "book-total-chapters",
      ).value;
      const total_chapters =
        totalChaptersValue === "" ? null : Number(totalChaptersValue);

      // 古いメモ機能は削除したため、authorとtotal_chaptersのみ更新する
      await api(`/api/books/${bookId}`, "PUT", {
        author,
        total_chapters,
      });
      closeBookModal();
      renderBooks();
    });

  // 削除
  document
    .getElementById("btn-book-delete")
    .addEventListener("click", async () => {
      const bookId = document.getElementById("book-modal").dataset.bookId;
      if (!confirm("削除しますか？")) return;
      await api(`/api/books/${bookId}`, "DELETE");
      closeBookModal();
      renderBooks();
    });

  // 絞り込み検索
  document
    .getElementById("book-filter-input")
    .addEventListener("input", (e) => {
      const keyword = e.target.value.trim().toLowerCase();
      const filtered = allBooksList.filter(
        (b) =>
          b.title.toLowerCase().includes(keyword) ||
          (b.author && b.author.toLowerCase().includes(keyword)),
      );
      renderBookList(filtered, allTasksForBooks);
    });

  // Google Books 検索
  document
    .getElementById("btn-book-search")
    .addEventListener("click", async () => {
      const query = document.getElementById("book-search-input").value;
      if (!query) return;

      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&langRestrict=ja&key=${GOOGLE_BOOKS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      const resultsEl = document.getElementById("book-search-results");
      resultsEl.innerHTML = "";

      if (!data.items) {
        resultsEl.innerHTML = "<p>検索結果がありません</p>";
        return;
      }
      data.items.forEach((item) => {
        const info = item.volumeInfo;
        const title = info.title || "不明";
        const author = info.authors ? info.authors.join(", ") : "不明";
        const coverUrl = info.imageLinks ? info.imageLinks.thumbnail : "";

        const resultHtml = `
        <div class="card book-search-result">
          <p>${title}</p>
          <p>${author}</p>
          <button class="btn btn-primary btn-register-book"
            data-title="${title}"
            data-author="${author}"
            data-cover="${coverUrl}">登録</button>
        </div>
      `;
        resultsEl.insertAdjacentHTML("beforeend", resultHtml);
      });
    });

  // 検索結果から登録
  document
    .getElementById("book-search-results")
    .addEventListener("click", async (e) => {
      if (!e.target.classList.contains("btn-register-book")) return;
      const title = e.target.dataset.title;
      const author = e.target.dataset.author;
      const coverUrl = e.target.dataset.cover;
      await api("/api/books", "POST", { title, author, cover_url: coverUrl });

      document.getElementById("book-search-input").value = "";
      document.getElementById("book-search-results").innerHTML = "";
      document.getElementById("book-filter-input").value = "";

      renderBooks();
      alert("登録しました");
    });

  // カンバンの開閉機能
  document.querySelectorAll("#book-kanban .kanban-header").forEach((header) => {
    header.style.cursor = "pointer";
    header.style.userSelect = "none";

    header.addEventListener("click", () => {
      const column = header.closest(".kanban-column");
      const cardsContainer = column.querySelector(".kanban-cards");

      if (cardsContainer) {
        cardsContainer.classList.toggle("collapsed");
        if (cardsContainer.classList.contains("collapsed")) {
          header.style.opacity = "0.5";
        } else {
          header.style.opacity = "1";
        }
      }
    });
  });
}
