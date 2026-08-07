"use strict";

// ===== リザルト機能 =====
// 週（月曜）・月（1日）・年（1月1日）の節目に前期間のサマリーを自動ポップアップ表示する

const RESULTS_STORAGE_KEY = "shownResults";

/* モーダル専用とページ専用でグラフ変数を分離し、多重カード生成時の.destroy()の競合バグを永久に封殺します */
let modalChartBar = null;
let modalChartDoughnut = null;

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
// 変更後
function filterTasksByPeriod(tasks, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return tasks.filter((t) => {
    // v2.21.18修正：dashboard.jsと判定基準を統一。ステータスに関わらず
    // 実績終了日(end_date)があれば最優先する（進行中タスクでもステップの
    // 実績日ロールアップ（v2.21.17）でend_dateが確定していれば期間判定に使う）
    const targetDateStr =
      t.end_date || t.end_planned_date || t.start_planned_date;
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

// ===== グラフ描画（個別独立生成ロジック） =====

// const RESULT_CHART_COLORS = [
//   "#4d7fd4",
//   "#e6a817",
//   "#3a9d6e",
//   "#e05c5c",
//   "#9b6fd4",
//   "#4dc4d4",
//   "#d46f9b",
//   "#7fd46f",
// ];

// ===== グラフ描画（個別独立生成ロジック：アニメーション対応版） =====

function createBarChart(canvasEl, filteredTasks) {
  if (!canvasEl) return null;
  const categoryMap = new Map();
  filteredTasks.forEach((t) => {
    const name = t.category_name || "(言語不問)";
    categoryMap.set(name, (categoryMap.get(name) || 0) + (t.study_time || 0));
  });
  const catNames = [...categoryMap.keys()];
  const catHours = catNames.map((n) => minutesToHours(categoryMap.get(n)));

  // 1. 本来のデータを退避し、最初はすべて0のダミーデータを用意
  const originalData = catHours.length > 0 ? catHours : [];
  const dummyData = originalData.map(() => 0);

  const chart = new Chart(canvasEl, {
    type: "bar",
    data: {
      labels: catNames.length > 0 ? catNames : ["データなし"],
      datasets: [
        {
          label: "学習時間（h）",
          data: dummyData, // 最初は0をセットして生成
          backgroundColor: catNames.map((n) => getCategoryChartColor(n)),
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

  // 2. 画面の切り替え（揺れ）が収まる約400ms後に本来のデータを流し込んでアニメーション発動
  setTimeout(() => {
    chart.data.datasets[0].data = originalData;
    chart.update();
  }, 400);

  return chart;
}

function createDoughnutChart(canvasEl, filteredTasks) {
  if (!canvasEl) return null;
  const todo = filteredTasks.filter((t) => t.status === "未着手").length;
  const inprogress = filteredTasks.filter((t) => t.status === "進行中").length;
  const done = filteredTasks.filter((t) => t.status === "完了").length;

  // 1. 本来のデータを退避し、最初はすべて0のダミーデータを用意
  const originalData = [todo, inprogress, done];
  const dummyData = [0, 0, 0];

  const chart = new Chart(canvasEl, {
    type: "doughnut",
    data: {
      labels: [`未着手 ${todo}`, `進行中 ${inprogress}`, `完了 ${done}`],
      datasets: [
        {
          data: dummyData, // 最初は0をセットして生成
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

  // 2. 画面の切り替え（揺れ）が収まる約400ms後に本来のデータを流し込んでアニメーション発動
  setTimeout(() => {
    chart.data.datasets[0].data = originalData;
    chart.update();
  }, 400);

  return chart;
}
// ===== コンテンツHTML生成（モーダル・ページ共通） =====

function buildResultContent(result, tasks, allTasks, prefix = "") {
  const filtered = filterTasksByPeriod(tasks, result.startDate, result.endDate);
  const totalMinutes = filtered.reduce((s, t) => s + (t.study_time || 0), 0);
  const studyHours = minutesToHours(totalMinutes);
  const doneCount = filtered.filter((t) => t.status === "完了").length;

  const totalInPeriod = filtered.length;
  const progressRate =
    totalInPeriod > 0 ? Math.round((doneCount / totalInPeriod) * 100) : 0;

  const prevPeriod = getPrevPeriod(result);
  let prevStudyHours = null;
  let prevDoneCount = null;
  let prevProgressRate = null;

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
      prevProgressRate = Math.round(
        (prevDoneCount / prevFiltered.length) * 100,
      );
    }
  }

  const hasPrevData = prevStudyHours !== null;
  const typeIcon =
    result.type === "week" ? "📅" : result.type === "month" ? "🗓️" : "🏆";

  const barId = `${prefix}result-chart-bar-${result.id}`;
  const doughnutId = `${prefix}result-chart-doughnut-${result.id}`;

  // v2.18.0: 振り返りセクションを追加
  const reviewHtml = buildReviewSectionHtml(result, prefix);

  // ★統合修正：カード全体も、振り返りセクションも個別に▼で閉じられる構造にします
  return {
    html: `
          <details class="result-card-accordion" open>
            <summary class="result-card-summary">
              <div class="result-header-wrap">
                <span class="result-type-badge result-type-badge--${result.type}">
                  ${typeIcon} ${result.type === "week" ? "週次" : result.type === "month" ? "月次" : "年次"}
                </span>
                <p class="result-period">${result.label}</p>
              </div>
              <span class="result-card-toggle-icon">▼</span>
            </summary>
            
            <div class="result-card-body">
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
                  ${hasPrevData ? buildDiffBadgeHtml(progressRate, prevProgressRate, "%") : ""}
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
              ${reviewHtml}
            </div>
          </details>
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

  const modalEl = document.getElementById("result-modal");
  if (!modalEl) return;

  renderResultModalSlide();
  modalEl.classList.remove("hidden");
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
  if (container) container.innerHTML = html;

  const nav = document.getElementById("result-modal-nav");
  if (nav) {
    if (total <= 1) {
      nav.classList.add("hidden");
    } else {
      nav.classList.remove("hidden");
      const pageLabel = document.getElementById("result-modal-page");
      const prevBtn = document.getElementById("result-modal-prev");
      const nextBtn = document.getElementById("result-modal-next");
      if (pageLabel)
        pageLabel.textContent = `${currentResultIndex + 1} / ${total}`;
      if (prevBtn) prevBtn.disabled = currentResultIndex === 0;
      if (nextBtn) nextBtn.disabled = currentResultIndex === total - 1;
    }
  }

  setTimeout(() => {
    triggerStatAnimations();
    if (modalChartBar) modalChartBar.destroy();
    if (modalChartDoughnut) modalChartDoughnut.destroy();

    modalChartBar = createBarChart(document.getElementById(barId), filtered);
    modalChartDoughnut = createDoughnutChart(
      document.getElementById(doughnutId),
      filtered,
    );
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
  const modalEl = document.getElementById("result-modal");
  if (modalEl) modalEl.classList.add("hidden");
}

// ===== ページ（#page-results） =====

let resultsPageInitialized = false;

// v2.18.0: loadReviewsCache() を先頭で呼ぶ
async function initResults() {
  if (resultsPageInitialized) return;
  resultsPageInitialized = true;
  await loadReviewsCache();
  const tasks = await api("/api/tasks");
  renderResultsPage(tasks);
  initResultsPageFilter();
}
// ===== リザルト画面：タブ切り替えとアニメーション再発火 =====
function initResultsPageFilter() {
  const tabs = document.querySelectorAll(".results-filter-tab");
  if (tabs.length === 0) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // 💡 既に選択中のタブを押した場合は何もしない
      if (tab.classList.contains("active")) return;

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const text = tab.textContent.trim();
      
      document.querySelectorAll(".result-page-card").forEach((card) => {
        let isMatch = false;
        if (text === "全") isMatch = true;
        else if (text === "週" && card.classList.contains("result-type-week")) isMatch = true;
        else if (text === "月" && card.classList.contains("result-type-month")) isMatch = true;
        else if (text === "年" && card.classList.contains("result-type-year")) isMatch = true;
        
        if (isMatch) {
          card.style.display = "block";
          
          // 🚀 1. 数値とバッジのフェードインアニメーションを再発動
          card.querySelectorAll(".result-stat-value--anim").forEach((el) => {
            el.classList.remove("result-stat-value--visible");
            void el.offsetWidth; // リフロー強制
            el.classList.add("result-stat-value--visible");
          });
          card.querySelectorAll(".result-diff").forEach((el, i) => {
            el.classList.remove("result-diff--visible");
            void el.offsetWidth; // リフロー強制
            el.style.animationDelay = `${0.1 + i * 0.08}s`;
            el.classList.add("result-diff--visible");
          });

          // 🚀 2. グラフのアニメーションを「0」から再発動
          card.querySelectorAll("canvas").forEach((canvas) => {
            const chart = Chart.getChart(canvas);
            if (chart) {
              // 本来の数値をCanvas要素の裏側にバックアップ（初回のみ）
              if (!canvas.hasOwnProperty('_originalDataBackup')) {
                canvas._originalDataBackup = [...chart.data.datasets[0].data];
              }
              const originalData = canvas._originalDataBackup;
              
              // 一旦すべてのデータを「0」にして即時描画（アニメーションなし）
              chart.data.datasets[0].data = originalData.map(() => 0);
              chart.update("none");
              
              // 💡 【超重要】1回目の表示時（none -> block）に発生する巨大なリサイズ検知を
              // 完全にやり過ごすため、ダッシュボードと同じ「400ms」待ちます。
              setTimeout(() => {
                chart.data.datasets[0].data = [...originalData];
                chart.update();
              }, 400);
            }
          });

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

  if (!periods || periods.length === 0) {
    container.innerHTML = `<p style="color:var(--color-text-tertiary);padding:var(--space-24);text-align:center;">過去のリザルトデータがまだ蓄積されていません。</p>`;
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
    card.className = `result-page-card result-type-${result.type}`;
    card.innerHTML = html;
    container.appendChild(card);
    if (result.type !== "week") card.style.display = "none";

    setTimeout(
      () => {
        card
          .querySelectorAll(".result-stat-value--anim")
          .forEach((el) => el.classList.add("result-stat-value--visible"));
        card.querySelectorAll(".result-diff").forEach((el, i) => {
          el.style.animationDelay = `${0.1 + i * 0.08}s`;
          el.classList.add("result-diff--visible");
        });
        createBarChart(document.getElementById(barId), filtered);
        createDoughnutChart(document.getElementById(doughnutId), filtered);
      },
      100 * (idx + 1),
    );
  });
}

/* ーーー【完全復活】削ぎ落とされていた、本来の約100行に及ぶ全自動期間生成ロジック ーーー */
function generatePastPeriods() {
  const periods = [];
  const today = new Date();

  // 0. 今週（月曜〜日曜）を先頭に追加（目標設定・進行中の記録用）
  const dayOfWeekNow = today.getDay();
  const daysToMondayNow = dayOfWeekNow === 0 ? 6 : dayOfWeekNow - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysToMondayNow);
  thisMonday.setHours(0, 0, 0, 0);
  const thisSunday = new Date(thisMonday);
  thisSunday.setDate(thisMonday.getDate() + 6);
  thisSunday.setHours(23, 59, 59, 999);
  periods.push({
    id: "week-page-current",
    type: "week",
    label: `今週（${thisMonday.getMonth() + 1}/${thisMonday.getDate()} 〜 ${thisSunday.getMonth() + 1}/${thisSunday.getDate()}）`,
    periodLabel: "今週",
    startDate: thisMonday,
    endDate: thisSunday,
    isCurrent: true,
  });

  // 1. 直近4週分を月曜スタート・日曜エンドで厳密に算出
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

  // 2. 【修正】今月(0)を含めた直近12ヶ月分を毎月1日〜末日で厳密に算出
  for (let m = 0; m <= 12; m++) {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    periods.push({
      // 今月の場合は、特別なIDを付与する
      id: m === 0 ? "month-page-current" : `month-page-${d.getFullYear()}-${d.getMonth() + 1}`,
      type: "month",
      label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
      periodLabel: m === 0 ? "今月" : `${m}ヶ月前`, // m=0なら「今月」にする
      startDate,
      endDate,
      isCurrent: m === 0, // 今月のカードであることを明示
    });
  }

  // 3. 【修正】今年(0)と昨年(1)の1年間（1/1〜12/31）を算出
  const currentYear = today.getFullYear();
  for (let y = 0; y <= 1; y++) {
    const targetYear = currentYear - y;
    periods.push({
      id: y === 0 ? "year-page-current" : `year-page-${targetYear}`,
      type: "year",
      label: `${targetYear}年`,
      periodLabel: y === 0 ? "今年" : "昨年",
      startDate: new Date(targetYear, 0, 1),
      endDate: new Date(targetYear, 11, 31, 23, 59, 59, 999),
      isCurrent: y === 0, // 今年のカードであることを明示
    });
  }

  return periods;
}
/* ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー */

// v2.18.0: loadReviewsCache() を先頭で呼ぶ
async function checkAndShowResultPopup() {
  const pending = getPendingResults();
  if (pending.length === 0) return;
  if (!document.getElementById("result-modal")) return;
  await loadReviewsCache();
  const tasks = await api("/api/tasks");
  showResultModal(pending, tasks);
}

function initResultModal() {
  const closeX = document.getElementById("btn-result-modal-close-x");
  const closeBtn = document.getElementById("btn-result-modal-close");
  const modalBg = document.getElementById("result-modal");
  const prevBtn = document.getElementById("result-modal-prev");
  const nextBtn = document.getElementById("result-modal-next");
  const goPageBtn = document.getElementById("btn-result-modal-go-page");

  if (closeX) closeX.addEventListener("click", closeResultModal);
  if (closeBtn) closeBtn.addEventListener("click", closeResultModal);
  if (modalBg)
    modalBg.addEventListener("click", (e) => {
      if (e.target.id === "result-modal") closeResultModal();
    });
  if (prevBtn)
    prevBtn.addEventListener("click", () => {
      if (currentResultIndex > 0) {
        currentResultIndex--;
        renderResultModalSlide();
      }
    });
  if (nextBtn)
    nextBtn.addEventListener("click", () => {
      if (currentResultIndex < pendingResults.length - 1) {
        currentResultIndex++;
        renderResultModalSlide();
      }
    });
  if (goPageBtn)
    goPageBtn.addEventListener("click", () => {
      closeResultModal();
      location.hash = "#page-results";
    });
}

// ===== 振り返り（目標・実績・よかった点・反省点・備考）v2.18.0追加 =====

let reviewsCache = [];

async function loadReviewsCache() {
  reviewsCache = await api("/api/result-reviews");
  return reviewsCache;
}

function ymd(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function findReview(periodType, startDate, endDate) {
  const s = ymd(startDate);
  const e = ymd(endDate);
  return (
    reviewsCache.find(
      (r) =>
        r.period_type === periodType &&
        ymd(r.start_date) === s &&
        ymd(r.end_date) === e,
    ) || null
  );
}

// 月の振り返りを書く際に参考表示する「その月に含まれる週次振り返り」、
// 年の振り返りを書く際に参考表示する「その年に含まれる月次振り返り」を取得する
// （あくまで閲覧用の参考表示であり、自動集約・自動転記は行わない）
function findChildReviews(result) {
  if (result.type === "month") {
    return reviewsCache.filter((r) => {
      if (r.period_type !== "week") return false;
      const s = new Date(r.start_date);
      return s >= result.startDate && s <= result.endDate;
    });
  }
  if (result.type === "year") {
    return reviewsCache.filter((r) => {
      if (r.period_type !== "month") return false;
      const s = new Date(r.start_date);
      return s >= result.startDate && s <= result.endDate;
    });
  }
  return [];
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildChildReviewsHtml(result) {
  const children = findChildReviews(result);
  if (children.length === 0) return "";

  const childLabel = result.type === "month" ? "週次" : "月次";
  const items = children
    .map((r) => {
      const label = `${ymd(r.start_date).slice(5)} 〜 ${ymd(r.end_date).slice(5)}`;
      const parts = [];
      if (r.goal)
        parts.push(
          `<p class="review-ref-line"><span>🎯</span>${escapeHtml(r.goal)}</p>`,
        );
      if (r.good_points)
        parts.push(
          `<p class="review-ref-line"><span>👍</span>${escapeHtml(r.good_points)}</p>`,
        );
      if (r.reflection)
        parts.push(
          `<p class="review-ref-line"><span>🔍</span>${escapeHtml(r.reflection)}</p>`,
        );
      if (parts.length === 0) return "";
      return `
        <div class="review-ref-item">
          <p class="review-ref-period">${label}</p>
          ${parts.join("")}
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  if (!items) return "";

  return `
    <details class="review-ref-accordion">
      <summary>この期間の${childLabel}振り返りを見る（参考）</summary>
      <div class="review-ref-list">${items}</div>
    </details>
  `;
}

function buildReviewSectionHtml(result, prefix) {
  const review = findReview(result.type, result.startDate, result.endDate);
  const reviewId = `${prefix}review-${result.id}`;
  const childHtml = buildChildReviewsHtml(result);

  const moodOptions = ["😄", "🙂", "😐", "😣", "😢"];
  const currentMood = review?.mood || "";
  const moodHtml = moodOptions
    .map(
      (m) =>
        `<button type="button" class="review-mood-btn${m === currentMood ? " active" : ""}" data-mood="${m}">${m}</button>`,
    )
    .join("");

  return `
    <div class="review-section" data-review-id="${reviewId}"
      data-period-type="${result.type}"
      data-start-date="${ymd(result.startDate)}"
      data-end-date="${ymd(result.endDate)}">
      
      <details class="review-section-accordion">
        <summary class="review-section-summary">
          <span class="review-section-title">振り返りを入力・編集する</span>
          <span class="review-section-toggle-icon">▼</span>
        </summary>
        
        <div class="review-section-body">
          ${childHtml}
          <div class="review-field">
            <label>目標</label>
            <textarea class="review-input" data-field="goal" placeholder="この期間の目標">${escapeHtml(review?.goal)}</textarea>
          </div>
          <div class="review-field">
            <label>実績</label>
            <textarea class="review-input" data-field="achievement" placeholder="実際にやったこと">${escapeHtml(review?.achievement)}</textarea>
          </div>
          <div class="review-field">
            <label>よかった点</label>
            <textarea class="review-input" data-field="good_points" placeholder="うまくいったこと">${escapeHtml(review?.good_points)}</textarea>
          </div>
          <div class="review-field">
            <label>反省点</label>
            <textarea class="review-input" data-field="reflection" placeholder="改善したいこと">${escapeHtml(review?.reflection)}</textarea>
          </div>
          <div class="review-field">
            <label>備考</label>
            <textarea class="review-input" data-field="memo" placeholder="自由記述">${escapeHtml(review?.memo)}</textarea>
          </div>
          <div class="review-mood-row">
            <span class="review-mood-label">気分</span>
            ${moodHtml}
          </div>
          <div class="review-actions">
            <button type="button" class="btn btn-primary btn-review-save">保存</button>
            <span class="review-save-status"></span>
          </div>
        </div>
      </details>
    </div>
  `;
}

async function handleReviewSave(sectionEl) {
  const periodType = sectionEl.dataset.periodType;
  const startDate = sectionEl.dataset.startDate;
  const endDate = sectionEl.dataset.endDate;

  const body = {
    period_type: periodType,
    start_date: startDate,
    end_date: endDate,
  };
  sectionEl.querySelectorAll(".review-input").forEach((el) => {
    body[el.dataset.field] = el.value || null;
  });
  const activeMoodBtn = sectionEl.querySelector(".review-mood-btn.active");
  body.mood = activeMoodBtn ? activeMoodBtn.dataset.mood : null;

  const statusEl = sectionEl.querySelector(".review-save-status");
  if (statusEl) statusEl.textContent = "保存中…";

  const saved = await api("/api/result-reviews", "POST", body);

  const idx = reviewsCache.findIndex(
    (r) =>
      r.period_type === saved.period_type &&
      ymd(r.start_date) === ymd(saved.start_date) &&
      ymd(r.end_date) === ymd(saved.end_date),
  );
  if (idx >= 0) reviewsCache[idx] = saved;
  else reviewsCache.push(saved);

  if (statusEl) {
    statusEl.textContent = "✓ 保存しました";
    setTimeout(() => {
      if (statusEl) statusEl.textContent = "";
    }, 2000);
  }
}

// 振り返りセクション内のイベント（気分選択・保存ボタン）を委譲で処理
document.addEventListener("click", (e) => {
  const moodBtn = e.target.closest(".review-mood-btn");
  if (moodBtn) {
    const section = moodBtn.closest(".review-section");
    section
      .querySelectorAll(".review-mood-btn")
      .forEach((b) => b.classList.remove("active"));
    moodBtn.classList.add("active");
    return;
  }

  const saveBtn = e.target.closest(".btn-review-save");
  if (saveBtn) {
    const section = saveBtn.closest(".review-section");
    if (section) handleReviewSave(section);
    return;
  }
});
