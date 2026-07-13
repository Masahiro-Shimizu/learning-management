function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

let chartDaily = null;
let chartStatus = null;
let chartBooks = null;
let chartProgress = null;
let chartCategoryTime = null;
let chartCategoryProgress = null;

const PERIOD_STORAGE_KEY = "dashboardPeriod";
const VALID_PERIODS = ["week", "month", "year", "all"];

function loadSavedPeriod() {
  const saved = localStorage.getItem(PERIOD_STORAGE_KEY);
  return VALID_PERIODS.includes(saved) ? saved : "week";
}

let currentPeriod = loadSavedPeriod();
let viewDate = new Date();

let allTasks = [];
let allBooks = [];

// 【修正】重複していた CHART_COLORS 定義は一元化したため、ここから削除しました
// (tasks.js側で定義されたグローバルの CHART_COLORS を自動的に参照します)

function minutesToHours(minutes) {
  return Math.round((minutes / 60) * 10) / 10;
}

// v2.21.14追加：サマリーカードの数値をフェードイン＋カウントアップで表示する
// endValueは最終的にそのままtextContentへ入る値（"3" や "3.5" など既存の表示フォーマットを崩さないため）
let summaryAnimCounter = 0;
function animateSummaryValue(el, endValue, { decimals = 0, duration = 700 } = {}) {
  if (!el) return;
  const numericEnd = Number(endValue) || 0;
  const animId = ++summaryAnimCounter;
  el.dataset.animId = animId;

  // フェードイン演出を毎回リプレイさせる（クラスを一旦外して強制リフロー→再付与）
  el.classList.remove("summary-value-anim--visible");
  void el.offsetWidth;
  el.classList.add("summary-value-anim--visible");

  const startTime = performance.now();

  function tick(now) {
    // 短時間に連続でトグルされた場合、古いアニメーションは自動的に中断する
    if (String(animId) !== el.dataset.animId) return;

    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

    if (progress < 1) {
      const current = numericEnd * eased;
      el.textContent = decimals > 0 ? current.toFixed(decimals) : Math.round(current);
      requestAnimationFrame(tick);
    } else {
      el.textContent = String(endValue); // 最終値は元の表示フォーマットのまま確定させる
    }
  }
  requestAnimationFrame(tick);
}

// v2.21.15追加：destroy→再生成ではなくupdate()でグラフを差し替え、
// 値が「古い状態→新しい状態」へ実際に動くアニメーションになるようにする
// v2.21.16修正：Chart.jsは生成時にoptionsを内部でProxy化して管理しているため、
// 既存のoptionsに対して手動でChart.helpers.merge()をかけると内部のresolverが
// 壊れ、「Ignoring resolver passed as options」「t.startsWith is not a function」
// が発生してしまっていた。optionsの中身（軸設定・凡例など）は毎回同じ内容しか
// 渡していないため、初回生成時以外はoptionsに一切触らず、data（labels/datasets）
// の差し替えとupdate()のみを行うようにした。
function upsertChart(existingChart, canvasEl, config) {
  if (existingChart) {
    existingChart.data.labels = config.data.labels;
    existingChart.data.datasets = config.data.datasets;
    existingChart.update();
    return existingChart;
  }
  return new Chart(canvasEl, config);
}

function shiftPeriod(direction) {
  if (currentPeriod === "week") {
    viewDate.setDate(viewDate.getDate() + 7 * direction);
  } else if (currentPeriod === "month") {
    viewDate.setMonth(viewDate.getMonth() + direction);
  } else if (currentPeriod === "year") {
    viewDate.setFullYear(viewDate.getFullYear() + direction);
  }
  renderCharts();
}

function isCurrentPeriod() {
  const today = new Date();
  if (currentPeriod === "week") {
    return getWeekStart(viewDate).getTime() === getWeekStart(today).getTime();
  } else if (currentPeriod === "month") {
    return (
      viewDate.getFullYear() === today.getFullYear() &&
      viewDate.getMonth() === today.getMonth()
    );
  } else if (currentPeriod === "year") {
    return viewDate.getFullYear() === today.getFullYear();
  }
  return true;
}

function getWeekStart(date) {
  const dayOfWeek = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// v2.21.7追加：week/month/year の「開始日・終了日」を任意の基準日（baseDate）から算出する汎用関数。
// 進捗率の締め日算出（renderCharts）と目標モーダルの期間表示（getCurrentPeriodRange）の
// 両方から共通で使うことで、期間の境界計算がズレる不具合を防ぐ。
function getPeriodRange(period, baseDate) {
  if (period === "week") {
    const monday = getWeekStart(baseDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  }
  if (period === "month") {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    return {
      start: new Date(year, month, 1, 0, 0, 0, 0),
      end: new Date(year, month + 1, 0, 23, 59, 59, 999),
    };
  }
  if (period === "year") {
    const year = baseDate.getFullYear();
    return {
      start: new Date(year, 0, 1, 0, 0, 0, 0),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }
  return null; // "all" は期間なし
}

function updatePeriodLabel() {
  const label = document.getElementById("period-label");
  let text = "";

  if (currentPeriod === "week") {
    const monday = getWeekStart(viewDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    text = `${monday.getMonth() + 1}/${monday.getDate()} 〜 ${sunday.getMonth() + 1}/${sunday.getDate()}`;
  } else if (currentPeriod === "month") {
    text = `${viewDate.getFullYear()}年${viewDate.getMonth() + 1}月`;
  } else if (currentPeriod === "year") {
    text = `${viewDate.getFullYear()}年`;
  } else if (currentPeriod === "all") {
    text = "全期間";
  }

  label.textContent = text;

  const nextBtn = document.getElementById("period-next-btn");
  nextBtn.disabled = currentPeriod === "all" || isCurrentPeriod();
}

function updateSummaryCardLabel() {
  const el = document.getElementById("period-study-label");
  if (!el) return;

  const progressLabelEl = document.getElementById("progress-card-title");
  if (progressLabelEl) progressLabelEl.textContent = "進捗率";

  const chartTitleEl = document.getElementById("chart-daily-title");

  if (currentPeriod === "week") {
    el.textContent = "今週の学習時間";
    if (chartTitleEl) chartTitleEl.textContent = "日別学習時間";
  } else if (currentPeriod === "month") {
    el.textContent = "今月の学習時間";
    if (chartTitleEl) chartTitleEl.textContent = "日別学習時間";
  } else if (currentPeriod === "year") {
    el.textContent = "今年の学習時間";
    if (chartTitleEl) chartTitleEl.textContent = "月別学習時間";
  } else if (currentPeriod === "all") {
    el.textContent = "通算の学習時間";
    if (chartTitleEl) chartTitleEl.textContent = "年別学習時間";
  }
}

function renderCharts() {
  const tasks = allTasks;
  const books = allBooks;

  updatePeriodLabel();
  updateSummaryCardLabel();

  let filteredTasks = [];
  let labels = [];
  let dailyData = [];
  let dailyPlannedData = [];

  if (currentPeriod === "week") {
    const monday = getWeekStart(viewDate);
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });

    const sunday = new Date(weekDates[6]);
    sunday.setHours(23, 59, 59, 999);

    labels = ["月", "火", "水", "木", "金", "土", "日"];

    dailyData = weekDates.map((weekDate) =>
      tasks
        .filter((t) => t.end_date && isSameDay(new Date(t.end_date), weekDate))
        .reduce((sum, t) => sum + (t.study_time || 0), 0),
    );

    dailyPlannedData = weekDates.map((weekDate) =>
      tasks
        .filter(
          (t) =>
            t.end_planned_date &&
            isSameDay(new Date(t.end_planned_date), weekDate),
        )
        .reduce((sum, t) => sum + (t.planned_study_time || 0), 0),
    );

    filteredTasks = tasks.filter((t) => {
      const targetDateStr =
        t.status === "完了"
          ? t.end_date
          : t.end_planned_date || t.start_planned_date;
      if (!targetDateStr) return false;
      const d = new Date(targetDateStr);
      return d >= monday && d <= sunday;
    });
  } else if (currentPeriod === "month") {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

    dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return tasks
        .filter((t) => t.end_date && isSameDay(new Date(t.end_date), date))
        .reduce((sum, t) => sum + (t.study_time || 0), 0);
    });

    dailyPlannedData = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return tasks
        .filter(
          (t) =>
            t.end_planned_date && isSameDay(new Date(t.end_planned_date), date),
        )
        .reduce((sum, t) => sum + (t.planned_study_time || 0), 0);
    });

    filteredTasks = tasks.filter((t) => {
      const targetDateStr =
        t.status === "完了"
          ? t.end_date
          : t.end_planned_date || t.start_planned_date;
      if (!targetDateStr) return false;
      const d = new Date(targetDateStr);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  } else if (currentPeriod === "year") {
    const year = viewDate.getFullYear();
    labels = [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月",
    ];

    dailyData = Array.from({ length: 12 }, (_, i) =>
      tasks
        .filter((t) => {
          if (!t.end_date) return false;
          const d = new Date(t.end_date);
          return d.getFullYear() === year && d.getMonth() === i;
        })
        .reduce((sum, t) => sum + (t.study_time || 0), 0),
    );

    dailyPlannedData = Array.from({ length: 12 }, (_, i) =>
      tasks
        .filter((t) => {
          if (!t.end_planned_date) return false;
          const d = new Date(t.end_planned_date);
          return d.getFullYear() === year && d.getMonth() === i;
        })
        .reduce((sum, t) => sum + (t.planned_study_time || 0), 0),
    );

    filteredTasks = tasks.filter((t) => {
      const targetDateStr =
        t.status === "完了"
          ? t.end_date
          : t.end_planned_date || t.start_planned_date;
      if (!targetDateStr) return false;
      const d = new Date(targetDateStr);
      return d.getFullYear() === year;
    });
  } else if (currentPeriod === "all") {
    const years = Array.from(
      new Set(
        tasks
          .map((t) => {
            const d = t.end_date
              ? new Date(t.end_date)
              : t.end_planned_date
                ? new Date(t.end_planned_date)
                : null;
            return d ? d.getFullYear() : null;
          })
          .filter((y) => y !== null),
      ),
    );
    if (years.length === 0) years.push(new Date().getFullYear());
    years.sort((a, b) => a - b);

    labels = years.map((y) => `${y}年`);
    filteredTasks = tasks;

    dailyData = years.map((year) =>
      tasks
        .filter(
          (t) => t.end_date && new Date(t.end_date).getFullYear() === year,
        )
        .reduce((sum, t) => sum + (t.study_time || 0), 0),
    );
    dailyPlannedData = years.map((year) =>
      tasks
        .filter(
          (t) =>
            t.end_planned_date &&
            new Date(t.end_planned_date).getFullYear() === year,
        )
        .reduce((sum, t) => sum + (t.planned_study_time || 0), 0),
    );
  }

  // ===== サマリーカード更新 =====

  const periodTotalMinutes = filteredTasks.reduce(
    (sum, t) => sum + (t.study_time || 0),
    0,
  );
  const periodHours = minutesToHours(periodTotalMinutes);
  animateSummaryValue(document.getElementById("period-study-time"), periodHours, {
    decimals: 1,
  });

  let prevFilteredTasks = [];
  if (currentPeriod === "week") {
    const monday = getWeekStart(viewDate);
    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);
    const prevSunday = new Date(monday);
    prevSunday.setDate(monday.getDate() - 1);
    prevSunday.setHours(23, 59, 59, 999);
    prevFilteredTasks = tasks.filter((t) => {
      if (!t.end_date) return false;
      const d = new Date(t.end_date);
      return d >= prevMonday && d <= prevSunday;
    });
  } else if (currentPeriod === "month") {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    prevFilteredTasks = tasks.filter((t) => {
      if (!t.end_date) return false;
      const d = new Date(t.end_date);
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });
  } else if (currentPeriod === "year") {
    const prevYear = viewDate.getFullYear() - 1;
    prevFilteredTasks = tasks.filter((t) => {
      if (!t.end_date) return false;
      const d = new Date(t.end_date);
      return d.getFullYear() === prevYear;
    });
  }
  const prevMinutes = prevFilteredTasks.reduce(
    (sum, t) => sum + (t.study_time || 0),
    0,
  );
  const diffHours = minutesToHours(periodTotalMinutes - prevMinutes);
  const diffSign = diffHours > 0 ? "+" : "";
  const periodLabel =
    currentPeriod === "week"
      ? "先週比"
      : currentPeriod === "month"
        ? "先月比"
        : "前年比";
  if (currentPeriod === "all") {
    document.getElementById("period-study-sub").innerHTML =
      `<span class="sub-highlight">全データの通算</span>`;
  } else {
    document.getElementById("period-study-sub").innerHTML =
      `${periodLabel} <span class="sub-highlight">${diffSign}${diffHours}時間</span>`;
  }

  // ② 進捗率
  // v2.21.13：母数を「全タスク」から「期間内タスクのみ」に変更。
  // 従来（v2.21.7）は締め日時（borderDate）までに完了した全タスクの割合、
  // つまり全体に対する累積進捗を表していたが、下部の「進捗率推移」グラフ
  // （v2.21.12）と考え方がズレて画面内で数字が一致しないことがあった。
  // 進捗率推移グラフと同じ考え方に統一し、週/月/年トグル時は
  // 「その期間に属するタスクのうち完了しているものの割合」を表示する。
  // 「全期間」表示時は filteredTasks が全タスクと一致するため、
  // 従来通り全体に対する進捗率と同じ値になる（挙動は変わらない）。
  const periodCompletedCount = filteredTasks.filter(
    (t) => t.status === "完了",
  ).length;

  const currentProgressRate =
    filteredTasks.length > 0
      ? Math.round((periodCompletedCount / filteredTasks.length) * 100)
      : 0;

  const progressRateEl = document.getElementById("progress-rate");
  if (progressRateEl) {
    animateSummaryValue(progressRateEl, currentProgressRate);
  }

  let prevProgressRate = 0;

  if (currentPeriod !== "all") {
    // 表示中の期間の「1つ前の期間」の日付範囲を算出し、
    // filteredTasks と同じ判定条件（完了なら end_date、それ以外は予定日）で
    // 前期間に属するタスクを抽出する
    const prevBaseDate = new Date(viewDate);
    if (currentPeriod === "week") {
      prevBaseDate.setDate(viewDate.getDate() - 7);
    } else if (currentPeriod === "month") {
      prevBaseDate.setMonth(viewDate.getMonth() - 1);
    } else if (currentPeriod === "year") {
      prevBaseDate.setFullYear(viewDate.getFullYear() - 1);
    }

    const prevRange = getPeriodRange(currentPeriod, prevBaseDate);

    const prevPeriodTasks = tasks.filter((t) => {
      const targetDateStr =
        t.status === "完了"
          ? t.end_date
          : t.end_planned_date || t.start_planned_date;
      if (!targetDateStr) return false;
      const d = new Date(targetDateStr);
      return d >= prevRange.start && d <= prevRange.end;
    });

    const prevCompletedCount = prevPeriodTasks.filter(
      (t) => t.status === "完了",
    ).length;

    prevProgressRate =
      prevPeriodTasks.length > 0
        ? Math.round((prevCompletedCount / prevPeriodTasks.length) * 100)
        : 0;
  }

  const progressDiff = currentProgressRate - prevProgressRate;
  const progressDiffSign = progressDiff > 0 ? "+" : "";
  const progressLabel =
    currentPeriod === "week"
      ? "先週比"
      : currentPeriod === "month"
        ? "先月比"
        : "前年比";

  const progressSubEl = document.getElementById("progress-sub");
  if (progressSubEl) {
    if (currentPeriod === "all") {
      progressSubEl.innerHTML = `<span class="sub-highlight">全データの通算</span>`;
    } else {
      const diffText =
        progressDiff === 0 ? "0%" : `${progressDiffSign}${progressDiff}%`;
      progressSubEl.innerHTML = `${progressLabel} <span class="sub-highlight">${diffText}</span>`;
    }
  }

  // ③ 進行中タスク数
  const inProgressCount = filteredTasks.filter(
    (t) => t.status === "進行中",
  ).length;
  const doneCountInPeriod = filteredTasks.filter(
    (t) => t.status === "完了",
  ).length;
  const totalCount = filteredTasks.length;
  animateSummaryValue(document.getElementById("done-count"), inProgressCount);
  document.getElementById("done-sub").innerHTML =
    `完了 <span class="sub-highlight">${doneCountInPeriod}</span> / 全 ${totalCount} 件`;

  // ④ 読了書籍数
  const readBooks = books.filter(
    (b) => b.total_chapters && Number(b.completed_count) >= b.total_chapters,
  ).length;
  animateSummaryValue(document.getElementById("books-read-count"), readBooks);
  document.getElementById("books-read-sub").innerHTML =
    `読了 <span class="sub-highlight">${readBooks}</span> / 全 ${books.length} 冊`;

  // ===== グラフ =====
  // v2.21.15：destroy→再生成をやめ、upsertChart()でdataだけ差し替えてupdate()する。
  // Chart.jsの値遷移アニメーションが効くようになり、「今の値→次の値」へ実際に
  // 棒や線が動く見た目になる（destroy/recreateだと毎回ゼロから描画されるだけで、
  // 値の移動というより毎回"出現"するだけに見えていた）。

  const todo = filteredTasks.filter((t) => t.status === "未着手").length;
  const inprogress = filteredTasks.filter((t) => t.status === "進行中").length;
  const done = filteredTasks.filter((t) => t.status === "完了").length;

  const CHART_ANIMATION = { duration: 700, easing: "easeOutQuart" };

  const dailyHours = dailyData.map(minutesToHours);
  const dailyPlannedHours = dailyPlannedData.map(minutesToHours);
  const dailyCanvas = document.getElementById("chart-daily");
  const ctx = dailyCanvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, "hsl(234 70% 58%)");
  gradient.addColorStop(1, "hsla(234, 70%, 58%, 0.25)");

  chartDaily = upsertChart(chartDaily, dailyCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "予定時間（時間）",
          data: dailyPlannedHours,
          backgroundColor: "rgba(245, 158, 11, 0.35)",
          borderColor: "rgba(245, 158, 11, 0.7)",
          borderWidth: 1,
          borderRadius: 3,
          barPercentage: 0.7,
          categoryPercentage: 0.75,
        },
        {
          label: "実績時間（時間）",
          data: dailyHours,
          backgroundColor: gradient,
          borderRadius: 3,
          barPercentage: 0.7,
          categoryPercentage: 0.75,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 2.5,
      animation: CHART_ANIMATION,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          stacked: false,
          ticks: { color: "#aaa" },
          grid: { display: false },
        },
        y: {
          stacked: false,
          beginAtZero: true,
          ticks: { color: "#aaa", callback: (v) => v + "h" },
          grid: { color: "rgba(255, 255, 255, 0.05)" },
        },
      },
    },
  });

  chartStatus = upsertChart(chartStatus, document.getElementById("chart-status"), {
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
      animation: CHART_ANIMATION,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            color: "#aaa",
            font: { size: 13 },
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
      },
    },
  });

  const bookProgress = books
    .map((book) => {
      const total = book.task_count || 0;
      const completed = Number(book.completed_count) || 0;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { title: book.title, rate, total };
    })
    .filter((b) => b.total > 0);

  const booksWrapper = document.getElementById("books-wrapper-js");
  if (booksWrapper) {
    const barHeight = bookProgress.length > 6 ? 32 : 45;
    booksWrapper.style.height = `${Math.max(bookProgress.length * barHeight, 250)}px`;
  }

  chartBooks = upsertChart(chartBooks, document.getElementById("chart-books"), {
    type: "bar",
    data: {
      labels: bookProgress.map((b) => b.title),
      datasets: [
        {
          label: "進捗率(%)",
          data: bookProgress.map((b) => b.rate),
          backgroundColor: bookProgress.map((b) => {
            const title = b.title || "";
            if (title.includes("JavaScript"))
              return getCategoryChartColor("JavaScript");
            if (title.includes("TypeScript"))
              return getCategoryChartColor("TypeScript");
            if (title.includes("HTML") || title.includes("CSS"))
              return getCategoryChartColor("HTML&CSS");
            if (title.includes("React")) return getCategoryChartColor("React");
            if (title.includes("Java")) return getCategoryChartColor("Java");
            if (title.includes("Python"))
              return getCategoryChartColor("Python");
            return getCategoryChartColor(title); // それ以外の書籍はタイトル文字列のハッシュ色
          }),
          barPercentage: bookProgress.length > 6 ? 0.6 : 0.8,
        },
      ],
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      responsive: true,
      animation: CHART_ANIMATION,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          min: 0,
          max: 100,
          ticks: { color: "#aaa" },
          grid: { color: "rgba(255, 255, 255, 0.1)" },
        },
        y: {
          ticks: {
            color: "#eee",
            font: { size: 11 },
            callback: function (value) {
              const label = this.getLabelForValue(value);
              return label.length > 15 ? label.substr(0, 15) + "..." : label;
            },
          },
          grid: { display: false },
        },
      },
      layout: { padding: { left: 10 } },
    },
  });

  const categoryMap = new Map();
  filteredTasks.forEach((t) => {
    const name = t.category_name || "(言語不問)";
    if (!categoryMap.has(name)) {
      categoryMap.set(name, { time: 0, total: 0, done: 0 });
    }
    const entry = categoryMap.get(name);
    entry.time += t.study_time || 0;
    entry.total += 1;
    if (t.status === "完了") entry.done += 1;
  });

  const categoryNames = Array.from(categoryMap.keys()).filter(
    (name) => categoryMap.get(name).total > 0,
  );
  const categoryTimeData = categoryNames.map((name) =>
    minutesToHours(categoryMap.get(name).time),
  );
  const categoryProgressData = categoryNames.map((name) => {
    const entry = categoryMap.get(name);
    return entry.total > 0 ? Math.round((entry.done / entry.total) * 100) : 0;
  });
  // 【修正】配列の並び順ではなく、GitHub色 / 文字列ハッシュ共通関数から一意の色を決定する
  const categoryColors = categoryNames.map((name) =>
    getCategoryChartColor(name),
  );

  chartCategoryTime = upsertChart(
    chartCategoryTime,
    document.getElementById("chart-category-time"),
    {
      type: "bar",
      data: {
        labels: categoryNames.length > 0 ? categoryNames : ["データなし"],
        datasets: [
          {
            label: "学習時間（時間）",
            data: categoryTimeData.length > 0 ? categoryTimeData : [],
            backgroundColor:
              categoryColors.length > 0 ? categoryColors : ["#808080"],
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        aspectRatio: 2.5,
        animation: CHART_ANIMATION,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: "#aaa" },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "#aaa", callback: (v) => v + "h" },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
          },
        },
      },
    },
  );

  const categoryProgressWrapper = document.getElementById(
    "category-wrapper-js",
  );
  if (categoryProgressWrapper) {
    const catBarHeight = categoryNames.length > 6 ? 32 : 45;
    categoryProgressWrapper.style.height = `${Math.max(categoryNames.length * catBarHeight, 200)}px`;
  }

  chartCategoryProgress = upsertChart(
    chartCategoryProgress,
    document.getElementById("chart-category-progress"),
    {
      type: "bar",
      data: {
        labels: categoryNames.length > 0 ? categoryNames : ["データなし"],
        datasets: [
          {
            label: "進捗率(%)",
            data: categoryProgressData.length > 0 ? categoryProgressData : [],
            backgroundColor:
              categoryColors.length > 0 ? categoryColors : ["#808080"],
            barPercentage: categoryNames.length > 6 ? 0.6 : 0.8,
          },
        ],
      },
      options: {
        indexAxis: "y",
        maintainAspectRatio: false,
        responsive: true,
        animation: CHART_ANIMATION,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            min: 0,
            max: 100,
            ticks: { color: "#aaa" },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
          },
          y: {
            ticks: {
              color: "#eee",
              font: { size: 11 },
              callback: function (value) {
                const label = this.getLabelForValue(value);
                return label.length > 15 ? label.substr(0, 15) + "..." : label;
              },
            },
            grid: { display: false },
          },
        },
        layout: { padding: { left: 20 } },
      },
    },
  );

  // 進捗率推移（累積カーブ・折れ線グラフ）
  let progressLabelDates = [];
  if (currentPeriod === "week") {
    const monday = getWeekStart(viewDate);
    progressLabelDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      d.setHours(23, 59, 59, 999);
      return d;
    });
  } else if (currentPeriod === "month") {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    progressLabelDates = Array.from({ length: daysInMonth }, (_, i) => {
      return new Date(year, month, i + 1, 23, 59, 59, 999);
    });
  } else if (currentPeriod === "year") {
    const year = viewDate.getFullYear();
    progressLabelDates = Array.from({ length: 12 }, (_, i) => {
      return new Date(year, i + 1, 0, 23, 59, 59, 999);
    });
  } else if (currentPeriod === "all") {
    const years = Array.from(
      new Set(
        tasks
          .map((t) => {
            const d = t.end_date
              ? new Date(t.end_date)
              : t.end_planned_date
                ? new Date(t.end_planned_date)
                : null;
            return d ? d.getFullYear() : null;
          })
          .filter((y) => y !== null),
      ),
    );

    const minYear =
      years.length > 0 ? Math.min(...years) : new Date().getFullYear();
    const maxYear = new Date().getFullYear();
    const maxMonth = new Date().getMonth();

    labels = [];
    progressLabelDates = [];

    for (let y = minYear; y <= maxYear; y++) {
      const endM = y === maxYear ? maxMonth : 11;
      for (let m = 0; m <= endM; m++) {
        labels.push(`${y}年${m + 1}月`);
        progressLabelDates.push(new Date(y, m + 1, 0, 23, 59, 59, 999));
      }
    }
  }

  // v2.21.12: 進捗率推移は「その期間に該当するタスクのうち、その日までに完了/予定済みの割合」に変更。
  // 従来は母数が常に「全タスク」（allTasks / totalAllTasks）だったため、週や月の初日でも
  // 既に全体の進捗率（例：69%）がそのままグラフの開始値になってしまい、
  // 「その期間の進捗が0%からどう積み上がったか」が見えない状態だった。
  // 母数を「その期間に属するタスクのみ」（filteredTasks）に変更することで、
  // 期間の開始時点は0%からスタートし、期間内で完了が進むごとに上昇する見た目になる。
  // 「全期間」トグル時は filteredTasks === tasks（全件）となるため、
  // 従来通りの全体累積進捗と同じ結果になる（挙動は変わらない）。
  const periodTaskCount = filteredTasks.length;

  const plannedProgressData = progressLabelDates.map((labelDate) => {
    if (periodTaskCount === 0) return 0;
    const count = filteredTasks.filter((t) => {
      if (!t.end_planned_date) return false;
      return new Date(t.end_planned_date) <= labelDate;
    }).length;
    return Math.round((count / periodTaskCount) * 100);
  });

  const actualProgressData = progressLabelDates.map((labelDate) => {
    if (periodTaskCount === 0) return 0;
    const count = filteredTasks.filter((t) => {
      if (t.status !== "完了" || !t.end_date) return false;
      return new Date(t.end_date) <= labelDate;
    }).length;
    return Math.round((count / periodTaskCount) * 100);
  });

  chartProgress = upsertChart(chartProgress, document.getElementById("chart-progress"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "予定進捗（%）",
          data: plannedProgressData,
          borderColor: "#e6a817",
          backgroundColor: "transparent",
          borderWidth: 2,
          tension: 0.2,
        },
        {
          label: "実績進捗（%）",
          data: actualProgressData,
          borderColor: "#4d7fd4",
          backgroundColor: "rgba(77, 127, 212, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      // 🔴 変更：CHART_ANIMATION（下から伸びるY軸アニメーション）ではなく、
      // 左→右に点を順番に描画していく専用アニメーションに差し替え
      animations: {
        x: {
          type: "number",
          easing: "linear",
          duration: 700,
          from: NaN, // 開始時は各点を「まだ描画しない」状態にする
          delay(ctx) {
            if (ctx.type !== "data" || ctx.xStarted) return 0;
            ctx.xStarted = true;
            const total = ctx.chart.data.labels.length || 1;
            return ctx.index * (700 / total); // 点ごとに描画タイミングをずらす＝左から右へ
          },
        },
        y: {
          type: "number",
          easing: "linear",
          duration: 700,
          from(ctx) {
            if (ctx.type !== "data" || ctx.yStarted) return;
            ctx.yStarted = true;
            // 出現時のY座標を線の位置に合わせておき、ワープして見えないようにする
            return ctx.chart.scales.y.getPixelForValue(ctx.parsed?.y ?? 0);
          },
        },
      },
      plugins: {
        legend: { position: "bottom", labels: { color: "#aaa" } },
      },
      scales: {
        x: {
          ticks: { color: "#aaa" },
          grid: { color: "rgba(255, 255, 255, 0.1)" },
        },
        y: {
          min: 0,
          max: 100,
          ticks: { color: "#aaa", callback: (v) => v + "%" },
          grid: { color: "rgba(255, 255, 255, 0.1)" },
        },
      },
    },
  });
  // v2.18.0: トグル切替のたびに現在期間の目標をサブテキストに反映
  loadAndShowCurrentPeriodGoal(currentPeriod);
}

// ===== 現在期間の目標表示・設定モーダル（dashboard-sub） v2.18.0追加 =====

const DASHBOARD_DEFAULT_SUB_TEXTS = {
  week: "今週もコツコツ積み上げています。",
  month: "今月もコツコツ積み上げています。",
  year: "今年もコツコツ積み上げています。",
  all: "コツコツ積み上げています。",
};

function ymdDash(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

// viewDateを基準に現在表示中の期間の開始日・終了日を返す
// v2.21.7：算出ロジック本体は getPeriodRange(period, baseDate) に切り出し、
// ここでは viewDate を基準日として渡す薄いラッパーにした（他箇所からの呼び出し方は変更なし）
function getCurrentPeriodRange(period) {
  return getPeriodRange(period, viewDate);
}

// トグルに連動してサブテキストと設定ボタンを更新する（構文エラー修正版）
async function loadAndShowCurrentPeriodGoal(period) {
  const subEl = document.querySelector(".dashboard-sub");
  const btnEl = document.getElementById("btn-open-goal-modal");
  if (!subEl) return;

  // 1. 全期間（all）が選択された場合の処理
  if (period === "all") {
    subEl.textContent =
      DASHBOARD_DEFAULT_SUB_TEXTS.all || "コツコツ積み上げています。";
    if (btnEl) btnEl.style.display = "none";
    return;
  }

  // 2. week / month / year の場合は設定ボタンを表示状態に戻す
  if (btnEl) {
    btnEl.style.display = "inline-block";
    const btnLabels = {
      week: "🎯 今週の目標を設定",
      month: "🎯 今月の目標を設定",
      year: "🎯 今年の目標を設定",
    };
    btnEl.textContent = btnLabels[period] || "🎯 目標を設定";
  }

  // 3. 選択されている期間の日付範囲を取得してAPIからレビュー（目標）データを取得
  const goalLabels = {
    week: "今週の目標",
    month: "今月の目標",
    year: "今年の目標",
  };

  try {
    const range = getCurrentPeriodRange(period);
    if (!range) {
      subEl.textContent =
        DASHBOARD_DEFAULT_SUB_TEXTS[period] || "コツコツ積み上げています。";
      return;
    }

    const startDateStr = ymdDash(range.start);
    const endDateStr = ymdDash(range.end);

    const res = await api(
      `/api/result-reviews?period_type=${period}&start_date=${startDateStr}&end_date=${endDateStr}`,
    );

    const savedGoal = res && (res.goal || (Array.isArray(res) && res[0]?.goal));

    if (savedGoal) {
      // インラインスタイルを直接指定して、確実に「オレンジ色」と「太字」を強制します
      subEl.innerHTML = `<strong style="color: #ffc107; font-weight: bold; margin-right: 8px;">${goalLabels[period]}</strong><span>${savedGoal}</span>`;
    } else {
      subEl.textContent =
        DASHBOARD_DEFAULT_SUB_TEXTS[period] || "コツコツ積み上げています。";
    }
  } catch (e) {
    console.error("目標（レビュー）データの取得に失敗しました:", e);
    subEl.textContent =
      DASHBOARD_DEFAULT_SUB_TEXTS[period] || "コツコツ積み上げています。";
  }
}

// ===== 目標設定モーダル v2.18.0追加 =====

function openGoalModal() {
  const range = getCurrentPeriodRange(currentPeriod);
  if (!range) return;

  // モーダルタイトルを期間に合わせて更新
  const titleEl = document.querySelector("#goal-modal h3");
  const periodTitles = { week: "今週", month: "今月", year: "今年" };
  if (titleEl)
    titleEl.textContent = `🎯 ${periodTitles[currentPeriod] || ""}の目標`;

  // 期間ラベル
  const periodEl = document.getElementById("goal-modal-period");
  if (periodEl) {
    if (currentPeriod === "week") {
      periodEl.textContent = `${range.start.getMonth() + 1}/${range.start.getDate()} 〜 ${range.end.getMonth() + 1}/${range.end.getDate()}`;
    } else if (currentPeriod === "month") {
      periodEl.textContent = `${range.start.getFullYear()}年${range.start.getMonth() + 1}月`;
    } else if (currentPeriod === "year") {
      periodEl.textContent = `${range.start.getFullYear()}年`;
    }
  }

  // 既存のgoalがあれば初期値にセット
  api("/api/result-reviews").then((reviews) => {
    const startStr = ymdDash(range.start);
    const endStr = ymdDash(range.end);
    const existing = reviews.find(
      (r) =>
        r.period_type === currentPeriod &&
        ymdDash(r.start_date) === startStr &&
        ymdDash(r.end_date) === endStr,
    );
    const input = document.getElementById("goal-modal-input");
    if (input) input.value = existing?.goal || "";
  });

  document.getElementById("goal-modal").classList.remove("hidden");
}

function closeGoalModal() {
  document.getElementById("goal-modal").classList.add("hidden");
}

async function initDashboard() {
  const tasks = await api("/api/tasks");
  const books = await api("/api/books");

  allTasks = tasks;
  allBooks = books;

  document.querySelectorAll(".btn-period").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.period === currentPeriod);
  });

  document.querySelectorAll(".btn-period").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".btn-period")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentPeriod = btn.dataset.period;
      localStorage.setItem(PERIOD_STORAGE_KEY, currentPeriod);
      viewDate = new Date();
      // 1. まずは最優先でグラフと集計カードを描画・更新する
      renderCharts();
      // 2. そのあと裏側で非同期に目標データを取得して反映させる
      loadAndShowCurrentPeriodGoal(currentPeriod);
    });
  });

  document
    .getElementById("period-prev-btn")
    .addEventListener("click", () => shiftPeriod(-1));
  document
    .getElementById("period-next-btn")
    .addEventListener("click", () => shiftPeriod(1));

  // ========================================================
  // 【修正】すべてのイベントが安全にバインドされるように位置を一番下にまとめました
  // ========================================================
  document
    .getElementById("btn-open-goal-modal")
    ?.addEventListener("click", openGoalModal);
  document
    .getElementById("btn-goal-modal-close-x")
    ?.addEventListener("click", closeGoalModal);
  document
    .getElementById("btn-goal-modal-cancel")
    ?.addEventListener("click", closeGoalModal);
  document.getElementById("goal-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "goal-modal") closeGoalModal();
  });
  document
    .getElementById("btn-goal-modal-save")
    ?.addEventListener("click", () => {
      if (typeof saveGoalFromModal === "function") {
        saveGoalFromModal();
      } else {
        console.warn("saveGoalFromModalがまだ読み込まれていません");
      }
    });

  // 最初のロード時に現在期間の目標を表示
  loadAndShowCurrentPeriodGoal(currentPeriod);

  // 最後に初期グラフ全体のレンダリングを実行
  renderCharts();
}