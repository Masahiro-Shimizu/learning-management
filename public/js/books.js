let allBooksList = [];

function renderBookList(books) {
  const bookList = document.getElementById("book-list");
  bookList.innerHTML = "";

  books.forEach((book) => {
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

    const bookHtml = `
        <div class="card book-card" data-book-id="${book.id}">
            <div class="cover">${book.cover_url ? `<img src="${book.cover_url}" alt="${book.title}">` : "表紙"}</div>
            <div class="book-card-info">
              <p class="book-card-title">${book.title}</p>
              <p class="book-card-author">${book.author}</p>
              ${memoHtml}
              ${progressHtml}
            </div>
        </div>
    `;
    bookList.insertAdjacentHTML("beforeend", bookHtml);
  });

  document.querySelectorAll(".book-card").forEach((card) => {
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

async function renderBooks() {
  allBooksList = await api("/api/books");
  renderBookList(allBooksList);

  document.getElementById("btn-book-close").addEventListener("click", () => {
    document.getElementById("book-modal").classList.add("hidden");
  });

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
      document.getElementById("book-modal").classList.add("hidden");
      renderBooks();
    });
  document
    .getElementById("btn-book-delete")
    .addEventListener("click", async () => {
      const bookId = document.getElementById("book-modal").dataset.bookId;
      if (!confirm("削除しますか？")) return;
      await api(`/api/books/${bookId}`, "DELETE");
      document.getElementById("book-modal").classList.add("hidden");
      renderBooks();
    });
}

function initBooks() {
  renderBooks();

  document
    .getElementById("book-filter-input")
    .addEventListener("input", (e) => {
      const keyword = e.target.value.trim().toLowerCase();
      const filtered = allBooksList.filter(
        (b) =>
          b.title.toLowerCase().includes(keyword) ||
          (b.author && b.author.toLowerCase().includes(keyword)),
      );
      renderBookList(filtered);
    });

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

      //data.itemが存在しない場合の処理
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
}
