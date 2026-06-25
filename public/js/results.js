"use strict";

// ===== リザルト機能 =====
// 週（月曜）・月（1日）・年（1月1日）の節目に前期間のサマリーを自動ポップアップ表示する

const RESULTS_STORAGE_KEY = "shownResults";

let resultChartBar = null;
let resultChartDoughnut = null;

// 今日の日付情報
function getTodayInfo() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1, // 1-indexed
    date: today.getDate(),
    day: today.getDay(), // 0=日, 1=月
  };
}

// 表示済みリザルトIDのセットを取得
function getShownResults() {
  try {
    return new Set(
      JSON.parse(localStorage.getItem(RESULTS_STORAGE_KEY) || "[]"),
    );
  } catch {
    return new Set();
  }
}

// 表示済みとしてマーク
function markResultShown(id) {
  const shown = getShownResults();
  shown.add(id);
  localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify([...shown]));
}

// 今日表示すべきリザルト一覧を生成
function getPendingResults() {
  const { year, month, date, day } = getTodayInfo();
  const shown = getShownResults();
  const results = [];

  // 週次リザルト：毎週月曜（day === 1）
  if (day === 1) {
    const id = `week-${year}-${month}-${date}`;
    if (!shown.has(id)) {
      const monday = new Date(year, month - 1, date);
      const prevMonday = new Date(monday);
      prevMonday.setDate(monday.getDate() - 7);
      const prevSunday = new Date(monday);
      prevSunday.setDate(monday.getDate() - 1);
      results.push({
        id,
        type: "week",
        label: `${prevMonday.getMonth() + 1}/${prevMonday.getDate()} 〜 ${prevSunday.getMonth() + 1}/${prevSunday.getDate()}`,
        periodLabel: "先週",
        startDate: prevMonday,
        endDate: prevSunday,
      });
    }
  }

  // 月次リザルト：毎月1日
  if (date === 1) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const id = `month-${prevYear}-${prevMonth}`;
    if (!shown.has(id)) {
      const startDate = new Date(prevYear, prevMonth - 1, 1);
      const endDate = new Date(prevYear, prevMonth, 0); // 月末
      results.push({
        id,
        type: "month",
        label: `${prevYear}年${prevMonth}月`,
        periodLabel: "先月",
        startDate,
        endDate,
      });
    }
  }

  // 年次リザルト：1月1日
  if (month === 1 && date === 1) {
    const prevYear = year - 1;
    const id = `year-${prevYear}`;
    if (!shown.has(id)) {
      const startDate = new Date(prevYear, 0, 1);
      const endDate = new Date(prevYear, 11, 31);
      results.push({
        id,
        type: "year",
        label: `${prevYear}年`,
        periodLabel: "昨年",
        startDate,
        endDate,
      });
    }
  }

  return results;
}

// 期間内のタスクを絞り込む
function filterTasksByPeriod(tasks, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return tasks.filter((t) => {
    const targetDateStr =
      t.status === "完了"
        ? t.end_date
        : t.end_planned_date || t.start_planned_date;
    if (!targetDateStr) return false;
    const d = new Date(targetDateStr);
    return d >= start && d <= end;
  });
}

function minutesToHours(min) {
  return Math.round((Number(min || 0) / 60) * 10) / 10;
}

// グラフ描画
function renderResultCharts(filteredTasks, canvasBarId, canvasDoughnutId) {
  // カテゴリ別学習時間
  const categoryMap = new Map();
  filteredTasks.forEach((t) => {
    const name = t.category_name || "(言語不問)";
    categoryMap.set(name, (categoryMap.get(name) || 0) + (t.study_time || 0));
  });
  const catNames = [...categoryMap.keys()];
  const catHours = catNames.map((n) => minutesToHours(categoryMap.get(n)));

  const COLORS = [
    "#4d7fd4",
    "#e6a817",
    "#3a9d6e",
    "#e05c5c",
    "#9b6fd4",
    "#4dc4d4",
    "#d46f9b",
    "#7fd46f",
  ];

  const barCanvas = document.getElementById(canvasBarId);
  if (barCanvas) {
    if (resultChartBar) resultChartBar.destroy();
    resultChartBar = new Chart(barCanvas, {
      type: "bar",
      data: {
        labels: catNames.length > 0 ? catNames : ["データなし"],
        datasets: [
          {
            label: "学習時間（h）",
            data: catHours.length > 0 ? catHours : [0],
            backgroundColor: catNames.map((_, i) => COLORS[i % COLORS.length]),
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#aaa" }, grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { color: "#aaa", callback: (v) => v + "h" },
            grid: { color: "rgba(255,255,255,0.07)" },
          },
        },
      },
    });
  }

  // ステータス別件数
  const todo = filteredTasks.filter((t) => t.status === "未着手").length;
  const inprogress = filteredTasks.filter((t) => t.status === "進行中").length;
  const done = filteredTasks.filter((t) => t.status === "完了").length;

  const doughnutCanvas = document.getElementById(canvasDoughnutId);
  if (doughnutCanvas) {
    if (resultChartDoughnut) resultChartDoughnut.destroy();
    resultChartDoughnut = new Chart(doughnutCanvas, {
      type: "doughnut",
      data: {
        labels: [`未着手 ${todo}`, `進行中 ${inprogress}`, `完了 ${done}`],
        datasets: [
          {
            data: [todo, inprogress, done],
            backgroundColor: ["#808080", "#4d7fd4", "#3a9d6e"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#aaa",
              font: { size: 12 },
              usePointStyle: true,
              pointStyleWidth: 8,
              padding: 12,
            },
          },
        },
      },
    });
  }
}

// リザルトコンテンツHTMLを生成（モーダル・ページ共通）
function buildResultContent(result, tasks, allTasks, prefix = "") {
  const filtered = filterTasksByPeriod(tasks, result.startDate, result.endDate);
  const totalMinutes = filtered.reduce((s, t) => s + (t.study_time || 0), 0);
  const studyHours = minutesToHours(totalMinutes);
  const doneCount = filtered.filter((t) => t.status === "完了").length;
  const totalAll = allTasks.length;
  const doneAll = allTasks.filter((t) => t.status === "完了").length;
  const progressRate =
    totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

  const typeIcon =
    result.type === "week" ? "📅" : result.type === "month" ? "🗓️" : "🏆";

  const barId = `${prefix}result-chart-bar-${result.id}`;
  const doughnutId = `${prefix}result-chart-doughnut-${result.id}`;

  return {
    html: `
      <div class="result-header">
        <span class="result-type-badge result-type-badge--${result.type}">
          ${typeIcon} ${result.type === "week" ? "週次" : result.type === "month" ? "月次" : "年次"}
        </span>
        <p class="result-period">${result.label}</p>
      </div>
      <div class="result-stats">
        <div class="result-stat-card">
          <p class="result-stat-label">学習時間</p>
          <p class="result-stat-value">${studyHours}<span class="result-stat-unit">h</span></p>
        </div>
        <div class="result-stat-card">
          <p class="result-stat-label">完了タスク</p>
          <p class="result-stat-value">${doneCount}<span class="result-stat-unit">件</span></p>
        </div>
        <div class="result-stat-card">
          <p class="result-stat-label">進捗率（全体）</p>
          <p class="result-stat-value">${progressRate}<span class="result-stat-unit">%</span></p>
        </div>
      </div>
      <div class="result-charts">
        <div class="result-chart-block">
          <p class="result-chart-label">カテゴリ別学習時間</p>
          <div class="result-chart-wrap" style="height:180px;position:relative;">
            <canvas id="${barId}"></canvas>
          </div>
        </div>
        <div class="result-chart-block">
          <p class="result-chart-label">ステータス別件数</p>
          <div class="result-chart-wrap" style="height:180px;position:relative;">
            <canvas id="${doughnutId}"></canvas>
          </div>
        </div>
      </div>
    `,
    barId,
    doughnutId,
    filtered,
  };
}

// ===== ポップアップモーダル =====

let pendingResults = [];
let currentResultIndex = 0;
let allTasksCache = [];

function showResultModal(results, tasks) {
  pendingResults = results;
  currentResultIndex = 0;
  allTasksCache = tasks;
  renderResultModalSlide();
  document.getElementById("result-modal").classList.remove("hidden");
}

function renderResultModalSlide() {
  const result = pendingResults[currentResultIndex];
  const total = pendingResults.length;
  const { html, barId, doughnutId, filtered } = buildResultContent(
    result,
    allTasksCache,
    allTasksCache,
    "modal-",
  );

  const container = document.getElementById("result-modal-content-area");
  container.innerHTML = html;

  // ページネーション表示
  const nav = document.getElementById("result-modal-nav");
  if (total <= 1) {
    nav.classList.add("hidden");
  } else {
    nav.classList.remove("hidden");
    document.getElementById("result-modal-page").textContent =
      `${currentResultIndex + 1} / ${total}`;
    document.getElementById("result-modal-prev").disabled =
      currentResultIndex === 0;
    document.getElementById("result-modal-next").disabled =
      currentResultIndex === total - 1;
  }

  // グラフ描画（少し遅延でcanvasが確実に存在するように）
  setTimeout(() => {
    renderResultCharts(filtered, barId, doughnutId);
  }, 50);
}

function closeResultModal() {
  // 表示したリザルトをすべて既読にする
  pendingResults.forEach((r) => markResultShown(r.id));
  document.getElementById("result-modal").classList.add("hidden");
}

// ===== ページ（#page-results）=====

let resultsPageInitialized = false;

async function initResults() {
  if (resultsPageInitialized) return;
  resultsPageInitialized = true;

  const tasks = await api("/api/tasks");
  renderResultsPage(tasks);
}

function renderResultsPage(tasks) {
  const container = document.getElementById("results-page-body");
  if (!container) return;
  container.innerHTML = "";

  // 表示するリザルト：過去の主要な期間を生成
  const periods = generatePastPeriods();

  if (periods.length === 0) {
    container.innerHTML = `<p style="color:var(--color-text-tertiary);padding:var(--space-24);">まだリザルトデータがありません。</p>`;
    return;
  }

  periods.forEach((result, idx) => {
    const { html, barId, doughnutId, filtered } = buildResultContent(
      result,
      tasks,
      tasks,
      `page-${idx}-`,
    );

    const card = document.createElement("div");
    card.className = "result-page-card";
    card.innerHTML = html;
    container.appendChild(card);

    setTimeout(
      () => {
        // カード内のチャートを独立して管理
        const bc = document.getElementById(barId);
        const dc = document.getElementById(doughnutId);
        const COLORS = [
          "#4d7fd4",
          "#e6a817",
          "#3a9d6e",
          "#e05c5c",
          "#9b6fd4",
          "#4dc4d4",
        ];

        if (bc) {
          const catMap = new Map();
          filtered.forEach((t) => {
            const n = t.category_name || "(言語不問)";
            catMap.set(n, (catMap.get(n) || 0) + (t.study_time || 0));
          });
          const names = [...catMap.keys()];
          const hours = names.map((n) => minutesToHours(catMap.get(n)));
          new Chart(bc, {
            type: "bar",
            data: {
              labels: names.length > 0 ? names : ["データなし"],
              datasets: [
                {
                  label: "学習時間（h）",
                  data: hours.length > 0 ? hours : [0],
                  backgroundColor: names.map(
                    (_, i) => COLORS[i % COLORS.length],
                  ),
                  borderRadius: 4,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: "#aaa" }, grid: { display: false } },
                y: {
                  beginAtZero: true,
                  ticks: { color: "#aaa", callback: (v) => v + "h" },
                  grid: { color: "rgba(255,255,255,0.07)" },
                },
              },
            },
          });
        }

        if (dc) {
          const todo = filtered.filter((t) => t.status === "未着手").length;
          const inp = filtered.filter((t) => t.status === "進行中").length;
          const done = filtered.filter((t) => t.status === "完了").length;
          new Chart(dc, {
            type: "doughnut",
            data: {
              labels: [`未着手 ${todo}`, `進行中 ${inp}`, `完了 ${done}`],
              datasets: [
                {
                  data: [todo, inp, done],
                  backgroundColor: ["#808080", "#4d7fd4", "#3a9d6e"],
                  borderWidth: 0,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: "65%",
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    color: "#aaa",
                    font: { size: 11 },
                    usePointStyle: true,
                    pointStyleWidth: 8,
                    padding: 10,
                  },
                },
              },
            },
          });
        }
      },
      100 * (idx + 1),
    );
  });
}

// 過去の期間リストを生成（直近3ヶ月分の週次・月次 + 直近1年次）
function generatePastPeriods() {
  const periods = [];
  const today = new Date();

  // 直近4週分の週次リザルト
  for (let w = 1; w <= 4; w++) {
    const monday = new Date(today);
    // 今週の月曜を計算
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(today.getDate() - daysToMonday - 7 * w);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const label = `${monday.getMonth() + 1}/${monday.getDate()} 〜 ${sunday.getMonth() + 1}/${sunday.getDate()}`;
    periods.push({
      id: `week-page-${monday.getTime()}`,
      type: "week",
      label,
      periodLabel: `${w}週前`,
      startDate: monday,
      endDate: sunday,
    });
  }

  // 直近3ヶ月分の月次リザルト
  for (let m = 1; m <= 3; m++) {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    periods.push({
      id: `month-page-${d.getFullYear()}-${d.getMonth() + 1}`,
      type: "month",
      label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
      periodLabel: `${m}ヶ月前`,
      startDate,
      endDate,
    });
  }

  // 直近1年分の年次リザルト
  const prevYear = today.getFullYear() - 1;
  periods.push({
    id: `year-page-${prevYear}`,
    type: "year",
    label: `${prevYear}年`,
    periodLabel: "昨年",
    startDate: new Date(prevYear, 0, 1),
    endDate: new Date(prevYear, 11, 31, 23, 59, 59, 999),
  });

  return periods;
}

// ===== 自動ポップアップ起動 =====

async function checkAndShowResultPopup() {
  const pending = getPendingResults();
  if (pending.length === 0) return;

  const tasks = await api("/api/tasks");
  showResultModal(pending, tasks);
}

// ===== イベントバインド（app.js の初期化後に呼ぶ） =====

function initResultModal() {
  // 閉じるボタン
  document
    .getElementById("btn-result-modal-close-x")
    .addEventListener("click", closeResultModal);
  document
    .getElementById("btn-result-modal-close")
    .addEventListener("click", closeResultModal);
  document.getElementById("result-modal").addEventListener("click", (e) => {
    if (e.target.id === "result-modal") closeResultModal();
  });

  // 前へ／次へ
  document.getElementById("result-modal-prev").addEventListener("click", () => {
    if (currentResultIndex > 0) {
      currentResultIndex--;
      renderResultModalSlide();
    }
  });
  document.getElementById("result-modal-next").addEventListener("click", () => {
    if (currentResultIndex < pendingResults.length - 1) {
      currentResultIndex++;
      renderResultModalSlide();
    }
  });

  // 「リザルトページで見る」ボタン
  document
    .getElementById("btn-result-modal-go-page")
    .addEventListener("click", () => {
      closeResultModal();
      location.hash = "#page-results";
    });
}
