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
  // まず画面上に「書籍のカンバン（外枠）」が存在するか確認する
  const kanbanContainer = document.getElementById("book-kanban");
  if (!kanbanContainer) {
    console.warn(
      "書籍のカンバン要素（#book-kanban）が画面上に見つかりません。描画をスキップします。",
    );
    return; // 要素がなければここで処理を中断する
  }

  // カンバンの枠の中から、確実に子要素の列を取得する
  const columns = {
    未読: kanbanContainer.querySelector('.kanban-cards[data-status="未読"]'),
    読書中: kanbanContainer.querySelector(
      '.kanban-cards[data-status="読書中"]',
    ),
    読了: kanbanContainer.querySelector('.kanban-cards[data-status="読了"]'),
  };

  // 各列の中身を一度空っぽにする
  Object.values(columns).forEach((col) => {
    if (col) col.innerHTML = "";
  });

  const statusCounts = { 未読: 0, 読書中: 0, 読了: 0 };

  // 書籍カードをそれぞれの列に追加していく
  books.forEach((book) => {
    const status = calcBookStatus(book, tasks);
    statusCounts[status]++;
    const col = columns[status];
    if (col) {
      col.insertAdjacentHTML("beforeend", createBookCardHtml(book));
    }
  });

  // 件数バッジも、必ずこの書籍カンバンの中にあるものだけを書き換える
  Object.entries(statusCounts).forEach(([status, count]) => {
    const badge = kanbanContainer.querySelector(`[data-count-for="${status}"]`);
    if (badge) badge.textContent = count;
  });

  // カードクリックでモーダルを開くイベントを設定
  kanbanContainer.querySelectorAll(".book-card").forEach((card) => {
    card.addEventListener("click", async () => {
      const bookId = card.dataset.bookId;
      const book = await api(`/api/books/${bookId}`);
      openBookModal(book);
    });
  });
}

// ==========================================
// 4. 書籍詳細モーダル（表紙・進捗バー・目次チェックリスト・メモ2項目）
// ==========================================

// モーダルを開き、書籍情報＋紐づく章（子タスク）を反映する
function openBookModal(book) {
  document.getElementById("book-modal-title").textContent = book.title || "";
  document.getElementById("book-author").value = book.author || "";
  document.getElementById("book-total-chapters").value =
    book.total_chapters ?? "";
  document.getElementById("book-understood-memo").value =
    book.understood_memo || "";
  document.getElementById("book-unclear-points").value =
    book.unclear_points || "";

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

  // 目次（book_idで紐づく子タスク＝章）
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

// 目次リストの描画（チェックボックス＝ステータス「完了」との連動）
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

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.status === "完了";
    checkbox.addEventListener("change", () =>
      handleBookChapterToggle(task.id, checkbox.checked),
    );

    const title = document.createElement("span");
    title.className = "book-chapter-title";
    title.textContent = task.title;
    title.addEventListener("click", () => {
      if (typeof openTaskEditModal === "function") {
        closeBookModal();
        openTaskEditModal(task.id);
      }
    });

    li.appendChild(checkbox);
    li.appendChild(title);
    listEl.appendChild(li);
  });
}

// チェック操作でタスクのステータスを更新（完了⇔未着手）
async function handleBookChapterToggle(taskId, checked) {
  const newStatus = checked ? "完了" : "未着手";
  try {
    await api(`/api/tasks/${taskId}`, "PUT", { status: newStatus });

    const cached = currentBookModalTasks.find((t) => t.id === taskId);
    if (cached) cached.status = newStatus;
    updateBookModalProgress(currentBookModalTasks);

    // 一覧側（allTasksForBooks）にも反映し、モーダル外の進捗表示との整合を保つ
    const globalTask = allTasksForBooks.find((t) => t.id === taskId);
    if (globalTask) globalTask.status = newStatus;
  } catch (err) {
    console.error("章の状態更新に失敗しました:", err);
    alert("更新に失敗しました");
    // 失敗時はチェック状態を元に戻す
    renderBookChapterList(currentBookModalTasks);
  }
}

// 目次の完了数から進捗バーを更新
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

// ⭕️ タスクデータの取得処理を復活させ、renderBookListへ2つの引数を正しく渡すよう修正
async function renderBooks() {
  allBooksList = await api("/api/books");
  allTasksForBooks = await api("/api/tasks"); // 復活
  renderBookList(allBooksList, allTasksForBooks); // 修正
}

function initBooks() {
  // ⭕️ 100ミリ秒だけ待ってからデータを取得・描画することで、確実に対象のHTMLをキャッチさせます
  setTimeout(() => {
    renderBooks();
  }, 100);

  // モーダルを閉じる（✕・キャンセル・オーバーレイクリック）
  document
    .getElementById("btn-book-close-x")
    .addEventListener("click", closeBookModal);
  document
    .getElementById("btn-book-close")
    .addEventListener("click", closeBookModal);
  document.getElementById("book-modal").addEventListener("click", (e) => {
    if (e.target.id === "book-modal") closeBookModal();
  });

  // 保存
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
      const understood_memo =
        document.getElementById("book-understood-memo").value || null;
      const unclear_points =
        document.getElementById("book-unclear-points").value || null;

      await api(`/api/books/${bookId}`, "PUT", {
        author,
        total_chapters,
        understood_memo,
        unclear_points,
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
      // ⭕️ 第2引数（allTasksForBooks）を確実に渡すよう修正
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

      // data.items が存在しない場合の処理
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

      // 登録完了後、検索欄・検索結果・絞り込み欄をすべてクリアして全件状態に戻す（v2.21.5）
      document.getElementById("book-search-input").value = "";
      document.getElementById("book-search-results").innerHTML = "";
      document.getElementById("book-filter-input").value = "";

      renderBooks();
      alert("登録しました");
    });
  // ===== カンバンの列（未読・読書中・読了）のクリック開閉機能（修正版） =====
  document.querySelectorAll("#book-kanban .kanban-header").forEach((header) => {
    header.style.cursor = "pointer";
    header.style.userSelect = "none";

    header.addEventListener("click", () => {
      const column = header.closest(".kanban-column");
      const cardsContainer = column.querySelector(".kanban-cards");

      if (cardsContainer) {
        // .collapsed クラスがあれば消し、なければ付ける（トグル処理）
        cardsContainer.classList.toggle("collapsed");

        // 閉じているときはヘッダーを少し薄くする
        if (cardsContainer.classList.contains("collapsed")) {
          header.style.opacity = "0.5";
        } else {
          header.style.opacity = "1";
        }
      }
    });
  });
}
