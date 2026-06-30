let allBooksList = [];
let allTasksForBooks = [];

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
      document.getElementById("book-modal-title").textContent = book.title;
      document.getElementById("book-modal-author").textContent = book.author;
      document.getElementById("book-memo").value = book.memo || "";
      document.getElementById("book-total-chapters").value =
        book.total_chapters ?? "";
      document.getElementById("book-modal").dataset.bookId = bookId;
      document.getElementById("book-modal").classList.remove("hidden");
    });
  });
}

function closeBookModal() {
  document.getElementById("book-modal").classList.add("hidden");
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
  document.getElementById("btn-book-close-x");

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
      const memo = document.getElementById("book-memo").value || null;
      const totalChaptersValue = document.getElementById(
        "book-total-chapters",
      ).value;
      const total_chapters =
        totalChaptersValue === "" ? null : Number(totalChaptersValue);
      await api(`/api/books/${bookId}`, "PUT", { memo, total_chapters });
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
