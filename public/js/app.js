"use strict";

const pages = document.querySelectorAll("main section");

let booksInitialized = false;
let dashboardInitialized = false;
let settingsInitialized = false;
let mandalaInitialized = false;
let resultsInitialized = false;

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

  // ページごと初期化
  if (pageId === "page-books" && !booksInitialized) {
    initBooks();
    booksInitialized = true;
  }

  if (pageId === "page-dashboard" && !dashboardInitialized) {
    initDashboard();
    dashboardInitialized = true;
  }

  if (pageId === "page-settings" && !settingsInitialized) {
    initSettings();
    settingsInitialized = true;
  }

  if (pageId === "page-mandala" && !mandalaInitialized) {
    initMandala();
    mandalaInitialized = true;
  }

  if (pageId === "page-results" && !resultsInitialized) {
    initResults();
    resultsInitialized = true;
  }
}

// function showPage() を実行
showPage();
window.addEventListener("hashchange", showPage);

// テーマの初期化
// ライトモードは <html> 要素に "light" クラスを付与する（body ではなく html に付与することで CSS 変数が全子要素に正しく継承される）
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  document.documentElement.classList.add("light");
  document.getElementById("btn-theme-toggle").textContent = "🌙 ダーク";
}

document.getElementById("btn-theme-toggle").addEventListener("click", () => {
  const isLight = document.documentElement.classList.toggle("light");
  document.getElementById("btn-theme-toggle").textContent = isLight
    ? "🌙 ダーク"
    : "☀️ ライト";
  localStorage.setItem("theme", isLight ? "light" : "dark");
});

// app.js の末尾に追加
initResultModal();
setTimeout(checkAndShowResultPopup, 800);
