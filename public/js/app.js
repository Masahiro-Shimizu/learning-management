const pages = document.querySelectorAll("main section");

let booksInitialized = false;
let dashboardInitialized = false;

function showPage() {
  const pageId = location.hash.substring(1) || "page-dashboard";
  const targetPage = document.getElementById(pageId);

  /**
   * pages.forEach(...) → pagesの中身を1つずつ取り出す
   * (page) => { ... } → 取り出した1つをpageという名前で扱い、{ }の中の処理をする
   * page.style.display = 'none' → そのページを非表示にする（display: noneはCSSでもおなじみの「消す」指定
   */
  pages.forEach((page) => {
    page.style.display = "none";
  });

  targetPage.style.display = "block";

  //ページごと初期化
  if (pageId === "page-books" && !booksInitialized) {
    initBooks();
    booksInitialized = true;
  }

  if (pageId === "page-dashboard" && !dashboardInitialized) {
    initDashboard();
    initDashboardIntialized = true;
  }
}
//function showPage()を実行
showPage();
//リンクをクリックして#が変わったときにもshowPage()を実行
/**
 * window → ブラウザのウィンドウ全体を対象にする
 * addEventListener → 「〜が起きたら実行する」を登録する
 * 'hashchange' → 「URLの#が変わった」というイベント
 * showPage → 起きたときに実行する関数
 */
window.addEventListener("hashchange", showPage);

// テーマの初期化
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  document.body.classList.add("light");
  document.getElementById("btn-theme-toggle").textContent = "🌙 ダーク";
}

document.getElementById("btn-theme-toggle").addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light");
  document.getElementById("btn-theme-toggle").textContent = isLight
    ? "🌙 ダーク"
    : "☀️ ライト";
  localStorage.setItem("theme", isLight ? "light" : "dark");
});
