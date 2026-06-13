const pages = document.querySelectorAll("main section");

let booksInitialized = false;
let dashboardInitialized = false;
let settingsInitialized = false;

function showPage() {
  const pageId = location.hash.substring(1) || "page-dashboard";
  const targetPage = document.getElementById(pageId);

  pages.forEach((page) => {
    page.style.display = "none";
  });

  targetPage.style.display = "block";

  document.querySelectorAll("nav a").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${pageId}`);
  });

  //ページごと初期化
  if (pageId === "page-books" && !booksInitialized) {
    initBooks();
    booksInitialized = true;
  }

  if (pageId === "page-dashboard" && !dashboardInitialized) {
    initDashboard();
    initDashboardIntialized = true;
  }

  if (pageId === "page-settings" && !settingsInitialized) {
    initSettings();
    settingsInitialized = true;
  }
}
//function showPage()を実行
showPage();
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
