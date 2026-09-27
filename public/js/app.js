"use strict";

const pages = document.querySelectorAll("main section");

let booksInitialized = false;
let dashboardInitialized = false;
let settingsInitialized = false;
let studyLogsPageInited = false;
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
      // v2.21.24修正：#page-tasks の .tasks-header と .view-tabs は
      // tasks.css / tasks.js（syncTaskViewHeights）側で実測値をもとに
      // sticky位置を正確に管理しているため、ここでの対象から除外する。
      const mainHeaders = [
        ".mandala-header",
        ".results-page-header",
        "#page-books > h2",
        ".study-logs-page-header",
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

      if (pageId === "page-tasks") {
        if (typeof syncTaskViewHeights === "function") {
          syncTaskViewHeights();
        }
        if (
          typeof currentView !== "undefined" &&
          currentView === "timeline" &&
          typeof syncTimelineStickyOffsets === "function"
        ) {
          syncTimelineStickyOffsets();
        }
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

  if (pageId === "page-dashboard") {
    if (!dashboardInitialized) {
      initDashboard();
      dashboardInitialized = true;
    } else {
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

  if (pageId === "page-study-logs") {
    if (!studyLogsPageInited) {
      studyLogsPageInited = true;
      initStudyLogsPage();
    } else if (typeof renderStudyLogsTable === "function") {
      renderStudyLogsTable();
    }
  }

  if (pageId === "page-results") {
    if (!resultsInitialized) {
      initResults();
      resultsInitialized = true;
    } else {
      // 🔴 v2.21.38修正：2回目以降の表示の際、現在アクティブなタブに合わせて
      // カードの表示状態を復元する処理。以前は「週次」「月次」「年次」「すべて（全）」
      // という旧仕様の文字列とタブのtextContentを比較していたが、実際のタブ表記は
      // 「週」「月」「年」「全」（results.jsのinitResultsPageFilter()と同一）のため
      // 一致条件に一度もマッチせず、全カードがdisplay:noneになってリザルトページに
      // 戻ると画面が真っ白になる不具合があった。tabのdata-filter属性と
      // カードのresult-type-*クラスを直接突き合わせる方式に修正し解消。
      const activeTab = document.querySelector(".results-filter-tab.active");
      const filterKey = activeTab ? activeTab.dataset.filter : "week";
      const cards = document.querySelectorAll(".result-page-card");
      cards.forEach((card) => {
        const isMatch =
          filterKey === "all" ||
          card.classList.contains(`result-type-${filterKey}`);
        card.style.display = isMatch ? "block" : "none";
      });
    }
  }
}

// function showPage() を実行
showPage();
window.addEventListener("hashchange", showPage);

// v2.21.35変更：絵文字ではなくアイコンSVG＋テキストで表示するためinnerHTMLに変更
const SUN_TOGGLE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
const MOON_TOGGLE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>`;

function renderThemeToggleLabel(isLight) {
  const btn = document.getElementById("btn-theme-toggle");
  if (!btn) return;
  btn.innerHTML = isLight
    ? `<span class="icon-btn-inline">${MOON_TOGGLE_ICON}</span>ダーク`
    : `<span class="icon-btn-inline">${SUN_TOGGLE_ICON}</span>ライト`;
}

// テーマの初期化
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  document.documentElement.classList.add("light");
}
renderThemeToggleLabel(savedTheme === "light");

document.getElementById("btn-theme-toggle").addEventListener("click", () => {
  const isLight = document.documentElement.classList.toggle("light");
  renderThemeToggleLabel(isLight);
  localStorage.setItem("theme", isLight ? "light" : "dark");
});

// app.js の末尾に追加
initResultModal();
setTimeout(checkAndShowResultPopup, 800);