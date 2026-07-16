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

  // ===== サイドバー 表示/非表示トグル（localStorageで状態保持） =====
const SIDEBAR_STORAGE_KEY = "sidebarCollapsed";

function applySidebarState(collapsed) {
  document.body.classList.toggle("sidebar-collapsed", collapsed);
}

// 初期状態を復元
applySidebarState(localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true");

document.getElementById("btn-sidebar-hide")?.addEventListener("click", () => {
  applySidebarState(true);
  localStorage.setItem(SIDEBAR_STORAGE_KEY, "true");
});

document.getElementById("btn-sidebar-show")?.addEventListener("click", () => {
  applySidebarState(false);
  localStorage.setItem(SIDEBAR_STORAGE_KEY, "false");
});

  // --- 追加：ページ切り替え時にアイコンを再生成 ---
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  pages.forEach((page) => {
    page.style.display = "none";
  });

  if (targetPage) {
    targetPage.style.display = "block";
  }

  document.querySelectorAll("nav a").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${pageId}`);
  });

  // ===== ページ切り替え時のスクロール・ヘッダー追従自動制御 =====
  if (pageId === "page-dashboard") {
    document.documentElement.style.setProperty("height", "100vh", "important");
    document.documentElement.style.setProperty(
      "overflow",
      "hidden",
      "important",
    );
    document.body.style.setProperty("height", "100vh", "important");
    document.body.style.setProperty("overflow", "hidden", "important");
  } else {
    document.documentElement.style.removeProperty("height");
    document.documentElement.style.removeProperty("overflow");
    document.body.style.removeProperty("height");
    document.body.style.removeProperty("overflow");

    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.style.setProperty("height", "auto", "important");
      mainEl.style.setProperty("overflow", "visible", "important");
    }

    setTimeout(() => {
      const mainHeaders = [
        ".tasks-header",
        ".mandala-header",
        ".results-page-header",
        "#page-books > h2",
      ];
      mainHeaders.forEach((selector) => {
        const el = document.querySelector(selector);
        if (el) {
          el.style.setProperty("position", "sticky", "important");
          el.style.setProperty("position", "-webkit-sticky", "important");
          el.style.setProperty("top", "0", "important");
          el.style.setProperty("z-index", "999", "important");
          el.style.setProperty(
            "background-color",
            "var(--color-bg-base)",
            "important",
          );
        }
      });

      const taskTabs = document.querySelector(".view-tabs");
      if (taskTabs) {
        taskTabs.style.setProperty("position", "sticky", "important");
        taskTabs.style.setProperty("position", "-webkit-sticky", "important");
        taskTabs.style.setProperty("top", "75px", "important");
        taskTabs.style.setProperty("z-index", "998", "important");
        taskTabs.style.setProperty(
          "background-color",
          "var(--color-bg-base)",
          "important",
        );
      }
    }, 100);
  }
  // ページごと初期化
  if (pageId === "page-books") {
    if (!booksInitialized) {
      initBooks();
      booksInitialized = true;
    } else {
      // ⭕️ 2回目以降の表示の際も、データを最新に更新して再描画する
      if (typeof renderBooks === "function") {
        renderBooks();
      }
    }
  }

  // 変更後
  if (pageId === "page-dashboard") {
    if (!dashboardInitialized) {
      initDashboard();
      dashboardInitialized = true;
    } else {
      // v2.21.20追加：books/resultsページと同様、2回目以降の表示時に
      // データを再取得して再描画する
      if (typeof refreshDashboard === "function") {
        refreshDashboard();
      }
    }
  }

  if (pageId === "page-settings" && !settingsInitialized) {
    initSettings();
    settingsInitialized = true;
  }

  if (pageId === "page-mandala" && !mandalaInitialized) {
    initMandala();
    mandalaInitialized = true;
  }

  // 【完全同期】文字列を「page-results」へ厳格に修正し、リザルト初期化を確実に呼び出します
  if (pageId === "page-results") {
    if (!resultsInitialized) {
      initResults();
      resultsInitialized = true;
    } else {
      // 2回目以降の表示の際は、現在アクティブになっているカプセルボタンに合わせたカードの表示状態を正しく復元します
      const activeTab = document.querySelector(".results-filter-tab.active");
      const filterText = activeTab ? activeTab.textContent.trim() : "週次";
      const cards = document.querySelectorAll(".result-page-card");
      cards.forEach((card) => {
        if (filterText === "すべて（全）") {
          card.style.display = "block";
        } else if (
          filterText === "週次" &&
          card.classList.contains("result-type-week")
        ) {
          card.style.display = "block";
        } else if (
          filterText === "月次" &&
          card.classList.contains("result-type-month")
        ) {
          card.style.display = "block";
        } else if (
          filterText === "年次" &&
          card.classList.contains("result-type-year")
        ) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    }
  }
}

// function showPage() を実行
showPage();
window.addEventListener("hashchange", showPage);

// テーマの初期化
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
