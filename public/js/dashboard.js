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

let currentPeriod = "week";
let viewDate = new Date();

let allTasks = [];
let allBooks = [];

const CHART_COLORS = [
  "#4d7fd4",
  "#e6a817",
  "#3a9d6e",
  "#e05c5c",
  "#9b6fd4",
  "#4dc4d4",
  "#d46f9b",
  "#7fd46f",
];

// 分を「X.X時間」に変換（グラフ表示用は小数）
function minutesToHours(minutes) {
  return Math.round((minutes / 60) * 10) / 10;
}

async function initDashboard() {
  const tasks = await api("/api/tasks");
  const books = await api("/api/books");

  allTasks = tasks;
  allBooks = books;

  // 期間切り替えボタン
  document.querySelectorAll(".btn-period").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".btn-period")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentPeriod = btn.dataset.period;
      viewDate = new Date();
      renderCharts();
    });
  });

  // 前へ／次へボタン
  document
    .getElementById("period-prev-btn")
    .addEventListener("click", () => shiftPeriod(-1));
  document
    .getElementById("period-next-btn")
    .addEventListener("click", () => shiftPeriod(1));

  renderCharts();
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
  }

  label.textContent = text;

  const nextBtn = document.getElementById("period-next-btn");
  nextBtn.disabled = isCurrentPeriod();
}

// サマリーカードのラベルを期間に合わせて更新
function updateSummaryCardLabel() {
  const el = document.getElementById("period-study-label");
  if (!el) return;
  if (currentPeriod === "week") el.textContent = "今週の学習時間";
  else if (currentPeriod === "month") el.textContent = "今月の学習時間";
  else el.textContent = "今年の学習時間";
}

function renderCharts() {
  const tasks = allTasks;
  const books = allBooks;

  updatePeriodLabel();
  updateSummaryCardLabel();

  let filteredTasks = [];
  let labels = [];
  let dailyData = []; // 分単位
  let dailyPlannedData = []; // 【追加】予定時間（分単位）用の配列

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

    // 実績時間の集計
    dailyData = weekDates.map((weekDate) =>
      tasks
        .filter((t) => t.end_date && isSameDay(new Date(t.end_date), weekDate))
        .reduce((sum, t) => sum + (t.study_time || 0), 0),
    );

    // 【追加】予定時間の集計（end_planned_dateを基準に曜日ごとに集計）
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

    // 実績時間の集計
    dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return tasks
        .filter((t) => t.end_date && isSameDay(new Date(t.end_date), date))
        .reduce((sum, t) => sum + (t.study_time || 0), 0);
    });

    // 【追加】予定時間の集計（end_planned_dateを基準に日にちごとに集計）
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
      if (!t.end_date) return false;
      const d = new Date(t.end_date);
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

    // 実績時間の集計
    dailyData = Array.from({ length: 12 }, (_, i) =>
      tasks
        .filter((t) => {
          if (!t.end_date) return false;
          const d = new Date(t.end_date);
          return d.getFullYear() === year && d.getMonth() === i;
        })
        .reduce((sum, t) => sum + (t.study_time || 0), 0),
    );

    // 【追加】予定時間の集計（end_planned_dateを基準に月ごとに集計）
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
      if (!t.end_date) return false;
      const d = new Date(t.end_date);
      return d.getFullYear() === year;
    });
  }

  // ===== サマリーカード更新 =====

  // ① 期間の学習時間（時間単位）
  const periodTotalMinutes = filteredTasks.reduce(
    (sum, t) => sum + (t.study_time || 0),
    0,
  );
  const periodHours = minutesToHours(periodTotalMinutes);
  document.getElementById("period-study-time").textContent = periodHours;

  // 先週・先月・前年との比較
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
  document.getElementById("period-study-sub").textContent =
    `${periodLabel} ${diffSign}${diffHours}時間`;

  // ② 進捗率（全タスクベースの完了率%）
  const totalAllTasks = tasks.length;
  const completedAllTasks = tasks.filter((t) => t.status === "完了").length;
  const progressRate =
    totalAllTasks > 0
      ? Math.round((completedAllTasks / totalAllTasks) * 100)
      : 0;
  document.getElementById("progress-rate").textContent = progressRate;
  document.getElementById("progress-sub").textContent =
    `完了 ${completedAllTasks} / 全 ${totalAllTasks} 件`;

  // ③ 完了タスク数
  const doneCount = filteredTasks.filter((t) => t.status === "完了").length;
  const totalCount = filteredTasks.length;
  document.getElementById("done-count").textContent = doneCount;
  document.getElementById("done-sub").textContent = `全 ${totalCount} 件中`;

  // ④ 読了書籍数（completed_count >= total_chapters かつ total_chapters > 0）
  const readBooks = books.filter(
    (b) => b.total_chapters && Number(b.completed_count) >= b.total_chapters,
  ).length;
  document.getElementById("books-read-count").textContent = readBooks;
  document.getElementById("books-read-sub").textContent =
    `読了 / 全 ${books.length} 冊`;

  // ===== グラフ =====

  const todo = filteredTasks.filter((t) => t.status === "未着手").length;
  const inprogress = filteredTasks.filter((t) => t.status === "進行中").length;
  const done = filteredTasks.filter((t) => t.status === "完了").length;

  // グラフ破棄
  if (chartDaily) chartDaily.destroy();
  if (chartStatus) chartStatus.destroy();
  if (chartBooks) chartBooks.destroy();
  if (chartProgress) chartProgress.destroy();
  if (chartCategoryTime) chartCategoryTime.destroy();
  if (chartCategoryProgress) chartCategoryProgress.destroy();

  // 日別学習時間（棒グラフ）— 時間単位
  // 日別学習時間（棒グラフ）— 時間単位
  const dailyHours = dailyData.map(minutesToHours);
  const dailyPlannedHours = dailyPlannedData.map(minutesToHours); // 【追加】予定時間を時間単位に変換
  const dailyCanvas = document.getElementById("chart-daily");
  const ctx = dailyCanvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, "hsl(234 70% 58%)");
  gradient.addColorStop(1, "hsla(234, 70%, 58%, 0.25)");

  chartDaily = new Chart(dailyCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "予定時間（時間）",
          data: dailyPlannedHours, // 【変更】一律の平均値から、リアルな日別予定データへ
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
          ticks: {
            color: "#aaa",
            callback: (v) => v + "h",
          },
          grid: { color: "rgba(255, 255, 255, 0.05)" },
        },
      },
    },
  });

  // ステータス別件数（ドーナツグラフ）
  chartStatus = new Chart(document.getElementById("chart-status"), {
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

  // ===== 書籍別進捗率（横棒グラフ）=====
  const bookProgress = books
    .map((book) => {
      const total = book.task_count || 0;
      const completed = Number(book.completed_count) || 0;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { title: book.title, rate, total };
    })
    .filter((b) => b.total > 0); // タスク数が1件以上ある書籍のみ表示

  // 書籍数に合わせて親要素の高さを動的計算
  const booksWrapper = document.getElementById("books-wrapper-js");
  if (booksWrapper) {
    const barHeight = bookProgress.length > 6 ? 32 : 45;
    booksWrapper.style.height = `${Math.max(bookProgress.length * barHeight, 250)}px`;
  }

  chartBooks = new Chart(document.getElementById("chart-books"), {
    type: "bar",
    data: {
      labels: bookProgress.map((b) => b.title),
      datasets: [
        {
          label: "進捗率(%)",
          data: bookProgress.map((b) => b.rate),
          backgroundColor: bookProgress.map(
            (_, i) => CHART_COLORS[i % CHART_COLORS.length],
          ),
          barPercentage: bookProgress.length > 6 ? 0.6 : 0.8,
        },
      ],
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      responsive: true,
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

  // ===== カテゴリ別集計（学習時間・進捗率）=====
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

  // タスク1件以上あるカテゴリのみ表示
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
  const categoryColors = categoryNames.map(
    (_, i) => CHART_COLORS[i % CHART_COLORS.length],
  );

  // カテゴリ別学習時間（縦棒グラフ）
  chartCategoryTime = new Chart(
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
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: "#aaa" },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: "#aaa",
              callback: (v) => v + "h",
            },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
          },
        },
      },
    },
  );

  // カテゴリ別進捗率（横棒グラフ）
  const categoryProgressWrapper = document.getElementById(
    "category-wrapper-js",
  );
  if (categoryProgressWrapper) {
    const catBarHeight = categoryNames.length > 6 ? 32 : 45;
    categoryProgressWrapper.style.height = `${Math.max(categoryNames.length * catBarHeight, 200)}px`;
  }

  chartCategoryProgress = new Chart(
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
  }

  const plannedProgressData = progressLabelDates.map((labelDate) => {
    if (totalAllTasks === 0) return 0;
    const count = allTasks.filter((t) => {
      if (!t.end_planned_date) return false;
      return new Date(t.end_planned_date) <= labelDate;
    }).length;
    return Math.round((count / totalAllTasks) * 100);
  });

  const actualProgressData = progressLabelDates.map((labelDate) => {
    if (totalAllTasks === 0) return 0;
    const count = allTasks.filter((t) => {
      if (t.status !== "完了" || !t.end_date) return false;
      return new Date(t.end_date) <= labelDate;
    }).length;
    return Math.round((count / totalAllTasks) * 100);
  });

  chartProgress = new Chart(document.getElementById("chart-progress"), {
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
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#aaa" },
        },
      },
      scales: {
        x: {
          ticks: { color: "#aaa" },
          grid: { color: "rgba(255, 255, 255, 0.1)" },
        },
        y: {
          min: 0,
          max: 100,
          ticks: {
            color: "#aaa",
            callback: (v) => v + "%",
          },
          grid: { color: "rgba(255, 255, 255, 0.1)" },
        },
      },
    },
  });

  // 描画直後のつぶれ防止
  if (chartDaily) chartDaily.resize();
  if (chartCategoryTime) chartCategoryTime.resize();
}
