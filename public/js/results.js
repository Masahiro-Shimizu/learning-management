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
    month: today.getMonth() + 1,
    date: today.getDate(),
    day: today.getDay(), // 0=日, 1=月
  };
}

function getShownResults() {
  try {
    return new Set(
      JSON.parse(localStorage.getItem(RESULTS_STORAGE_KEY) || "[]"),
    );
  } catch {
    return new Set();
  }
}

function markResultShown(id) {
  const shown = getShownResults();
  shown.add(id);
  localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify([...shown]));
}

function getPendingResults() {
  const { year, month, date, day } = getTodayInfo();
  const shown = getShownResults();
  const results = [];

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

  if (date === 1) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const id = `month-${prevYear}-${prevMonth}`;
    if (!shown.has(id)) {
      const startDate = new Date(prevYear, prevMonth - 1, 1);
      const endDate = new Date(prevYear, prevMonth, 0);
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

// ===== 比較ロジック =====

function getPrevPeriod(result) {
  const start = new Date(result.startDate);
  const end = new Date(result.endDate);

  if (result.type === "week") {
    const prevStart = new Date(start);
    prevStart.setDate(start.getDate() - 7);
    const prevEnd = new Date(end);
    prevEnd.setDate(end.getDate() - 7);
    return { startDate: prevStart, endDate: prevEnd };
  }
  if (result.type === "month") {
    const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);
    prevEnd.setHours(23, 59, 59, 999);
    return { startDate: prevStart, endDate: prevEnd };
  }
  if (result.type === "year") {
    const prevStart = new Date(start.getFullYear() - 1, 0, 1);
    const prevEnd = new Date(start.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    return { startDate: prevStart, endDate: prevEnd };
  }
  return null;
}

function getDiffDirection(current, prev) {
  if (current > prev) return "up";
  if (current < prev) return "down";
  return "stay";
}

function buildDiffBadgeHtml(current, prev, unit = "") {
  if (prev === null) return "";
  const dir = getDiffDirection(current, prev);
  const diff =
    unit === "h"
      ? Math.abs(Math.round((current - prev) * 10) / 10)
      : Math.abs(current - prev);
  const sign = dir === "up" ? "+" : dir === "down" ? "-" : "±";
  const icon =
    dir === "up"
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>`
      : dir === "down"
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

  return `
    <span class="result-diff result-diff--${dir}">
      <span class="result-diff-icon">${icon}</span>
      <span class="result-diff-text">${sign}${diff}${unit}</span>
    </span>
  `;
}

// ===== グラフ描画 =====

const RESULT_CHART_COLORS = [
  "#4d7fd4",
  "#e6a817",
  "#3a9d6e",
  "#e05c5c",
  "#9b6fd4",
  "#4dc4d4",
  "#d46f9b",
  "#7fd46f",
];

function renderResultCharts(filteredTasks, canvasBarId, canvasDoughnutId) {
  const categoryMap = new Map();
  filteredTasks.forEach((t) => {
    const name = t.category_name || "(言語不問)";
    categoryMap.set(name, (categoryMap.get(name) || 0) + (t.study_time || 0));
  });
  const catNames = [...categoryMap.keys()];
  const catHours = catNames.map((n) => minutesToHours(categoryMap.get(n)));

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
            backgroundColor: catNames.map(
              (_, i) => RESULT_CHART_COLORS[i % RESULT_CHART_COLORS.length],
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

// ===== コンテンツHTML生成（モーダル・ページ共通） =====

function buildResultContent(result, tasks, allTasks, prefix = "") {
  const filtered = filterTasksByPeriod(tasks, result.startDate, result.endDate);
  const totalMinutes = filtered.reduce((s, t) => s + (t.study_time || 0), 0);
  const studyHours = minutesToHours(totalMinutes);
  const doneCount = filtered.filter((t) => t.status === "完了").length;

  // 進捗率は期間内タスクベース
  const totalInPeriod = filtered.length;
  const progressRate =
    totalInPeriod > 0 ? Math.round((doneCount / totalInPeriod) * 100) : 0;

  // 比較データ
  const prevPeriod = getPrevPeriod(result);
  let prevStudyHours = null;
  let prevDoneCount = null;

  if (prevPeriod) {
    const prevFiltered = filterTasksByPeriod(
      tasks,
      prevPeriod.startDate,
      prevPeriod.endDate,
    );
    if (prevFiltered.length > 0) {
      prevStudyHours = minutesToHours(
        prevFiltered.reduce((s, t) => s + (t.study_time || 0), 0),
      );
      prevDoneCount = prevFiltered.filter((t) => t.status === "完了").length;
    }
  }

  const hasPrevData = prevStudyHours !== null;
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
      ${hasPrevData ? `<p class="result-compare-label">前${result.type === "week" ? "週" : result.type === "month" ? "月" : "年"}との比較</p>` : ""}
      <div class="result-stats">
        <div class="result-stat-card">
          <p class="result-stat-label">学習時間</p>
          <p class="result-stat-value result-stat-value--anim">${studyHours}<span class="result-stat-unit">h</span></p>
          ${hasPrevData ? buildDiffBadgeHtml(studyHours, prevStudyHours, "h") : ""}
        </div>
        <div class="result-stat-card">
          <p class="result-stat-label">完了タスク</p>
          <p class="result-stat-value result-stat-value--anim">${doneCount}<span class="result-stat-unit">件</span></p>
          ${hasPrevData ? buildDiffBadgeHtml(doneCount, prevDoneCount, "件") : ""}
        </div>
        <div class="result-stat-card">
          <p class="result-stat-label">進捗率（期間内）</p>
          <p class="result-stat-value result-stat-value--anim">${progressRate}<span class="result-stat-unit">%</span></p>
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

  setTimeout(() => {
    triggerStatAnimations();
    renderResultCharts(filtered, barId, doughnutId);
  }, 50);
}

function triggerStatAnimations() {
  document.querySelectorAll(".result-stat-value--anim").forEach((el) => {
    el.classList.remove("result-stat-value--visible");
    void el.offsetWidth;
    el.classList.add("result-stat-value--visible");
  });
  document.querySelectorAll(".result-diff").forEach((el, i) => {
    el.style.animationDelay = `${0.15 + i * 0.1}s`;
    el.classList.remove("result-diff--visible");
    void el.offsetWidth;
    el.classList.add("result-diff--visible");
  });
}

function closeResultModal() {
  pendingResults.forEach((r) => markResultShown(r.id));
  document.getElementById("result-modal").classList.add("hidden");
}

// ===== ページ（#page-results） =====

let resultsPageInitialized = false;

async function initResults() {
  if (resultsPageInitialized) return;
  resultsPageInitialized = true;

  const tasks = await api("/api/tasks");
  renderResultsPage(tasks);

  // フィルタータブのクリックイベントを有効化
  initResultsPageFilter();
}

function initResultsPageFilter() {
  const tabs = document.querySelectorAll(".results-filter-tab");
  if (tabs.length === 0) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const filterText = tab.textContent.trim();
      const cards = document.querySelectorAll(".result-page-card");

      cards.forEach((card) => {
        if (filterText === "すべて") {
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
    });
  });
}

function renderResultsPage(tasks) {
  const container = document.getElementById("results-page-body");
  if (!container) return;
  container.innerHTML = "";

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
    // 絞り込みで判別できるようにクラス名を付与
    card.className = `result-page-card result-type-${result.type}`;
    card.innerHTML = html;
    container.appendChild(card);

    setTimeout(
      () => {
        // アニメーション
        card.querySelectorAll(".result-stat-value--anim").forEach((el) => {
          el.classList.add("result-stat-value--visible");
        });
        card.querySelectorAll(".result-diff").forEach((el, i) => {
          el.style.animationDelay = `${0.1 + i * 0.08}s`;
          el.classList.add("result-diff--visible");
        });

        // チャート描画
        const bc = document.getElementById(barId);
        const dc = document.getElementById(doughnutId);

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
                    (_, i) =>
                      RESULT_CHART_COLORS[i % RESULT_CHART_COLORS.length],
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

function generatePastPeriods() {
  const periods = [];
  const today = new Date();

  // 直近4週分
  for (let w = 1; w <= 4; w++) {
    const monday = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(today.getDate() - daysToMonday - 7 * w);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    periods.push({
      id: `week-page-${monday.getTime()}`,
      type: "week",
      label: `${monday.getMonth() + 1}/${monday.getDate()} 〜 ${sunday.getMonth() + 1}/${sunday.getDate()}`,
      periodLabel: `${w}週前`,
      startDate: monday,
      endDate: sunday,
    });
  }

  // 直近3ヶ月分
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

  // 昨年
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

// ===== イベントバインド =====

function initResultModal() {
  document
    .getElementById("btn-result-modal-close-x")
    .addEventListener("click", closeResultModal);
  document
    .getElementById("btn-result-modal-close")
    .addEventListener("click", closeResultModal);
  document.getElementById("result-modal").addEventListener("click", (e) => {
    if (e.target.id === "result-modal") closeResultModal();
  });

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

  document
    .getElementById("btn-result-modal-go-page")
    .addEventListener("click", () => {
      closeResultModal();
      location.hash = "#page-results";
    });
}
