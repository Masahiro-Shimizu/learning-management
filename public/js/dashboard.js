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

async function initDashboard() {
  const tasks = await api("/api/tasks");
  const books = await api("/api/books");

  allTasks = tasks;
  allBooks = books;

  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  // 今週の学習時間
  const weeklyTime = tasks
    .filter((t) => {
      if (!t.end_date) return false;
      const endDate = new Date(t.end_date);
      return endDate >= monday && endDate <= today;
    })
    .reduce((sum, t) => sum + (t.study_time || 0), 0);
  document.getElementById("weekly-study-time").textContent = weeklyTime;

  // 先週比
  const lastMonday = new Date(monday);
  lastMonday.setDate(monday.getDate() - 7);
  const lastSunday = new Date(monday);
  lastSunday.setDate(monday.getDate() - 1);

  const lastWeekTime = tasks
    .filter((t) => {
      if (!t.end_date) return false;
      const endDate = new Date(t.end_date);
      return endDate >= lastMonday && endDate <= lastSunday;
    })
    .reduce((sum, t) => sum + (t.study_time || 0), 0);

  const diff = weeklyTime - lastWeekTime;
  const diffText =
    diff > 0 ? `+${diff}分` : diff < 0 ? `${diff}分` : "先週と同じ";
  document.getElementById("weekly-study-sub").textContent =
    `先週比 ${diffText}`;

  // 今月の学習時間
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthlyTime = tasks
    .filter((t) => {
      if (!t.end_date) return false;
      const d = new Date(t.end_date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((sum, t) => sum + (t.study_time || 0), 0);
  document.getElementById("monthly-study-time").textContent = monthlyTime;
  document.getElementById("monthly-study-sub").textContent =
    `${year}年${month + 1}月の合計`;

  // 進行中タスク数
  const inprogressCount = tasks.filter((t) => t.status === "進行中").length;
  const totalCount = tasks.length;
  document.getElementById("inprogress-count").textContent = inprogressCount;
  document.getElementById("inprogress-sub").textContent =
    `全 ${totalCount} 件中`;

  // 登録書籍数
  const booksCount = books.length;
  document.getElementById("books-count").textContent = booksCount;
  document.getElementById("books-sub").textContent = "登録済み";

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

function renderCharts() {
  const tasks = allTasks;
  const books = allBooks;

  updatePeriodLabel();

  let filteredTasks = [];
  let labels = [];
  let dailyData = [];

  if (currentPeriod === "week") {
    const monday = getWeekStart(viewDate);
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
    const sunday = weekDates[6];

    labels = ["月", "火", "水", "木", "金", "土", "日"];
    dailyData = weekDates.map((weekDate) =>
      tasks
        .filter((t) => {
          if (!t.end_date) return false;
          return isSameDay(new Date(t.end_date), weekDate);
        })
        .reduce((sum, t) => sum + (t.study_time || 0), 0),
    );
    filteredTasks = tasks.filter((t) => {
      if (!t.end_date) return true;
      const d = new Date(t.end_date);
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
        .filter((t) => {
          if (!t.end_date) return false;
          return isSameDay(new Date(t.end_date), date);
        })
        .reduce((sum, t) => sum + (t.study_time || 0), 0);
    });
    filteredTasks = tasks.filter((t) => {
      if (!t.end_date) return true;
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
    dailyData = Array.from({ length: 12 }, (_, i) =>
      tasks
        .filter((t) => {
          if (!t.end_date) return false;
          const d = new Date(t.end_date);
          return d.getFullYear() === year && d.getMonth() === i;
        })
        .reduce((sum, t) => sum + (t.study_time || 0), 0),
    );
    filteredTasks = tasks.filter((t) => {
      if (!t.end_date) return true;
      const d = new Date(t.end_date);
      return d.getFullYear() === year;
    });
  }

  // ステータス別件数
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

  // 日別学習時間（棒グラフ）
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
          label: "予定時間（分）",
          data: dailyData.map(
            () =>
              tasks.reduce((sum, t) => sum + (t.planned_study_time || 0), 0) /
              labels.length,
          ),
          backgroundColor: "#B5D4F4",
        },
        {
          label: "実績時間（分）",
          data: dailyData,
          backgroundColor: gradient,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
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

  // 書籍別進捗率（横棒グラフ）
  const bookProgress = books.map((book) => {
    const total = book.task_count || 0;
    const completed = Number(book.completed_count) || 0;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { title: book.title, rate };
  });

  // 書籍数に応じてラッパーの高さを動的に設定
  const booksWrapperEl = document.querySelector(".chart-books-wrapper");
  booksWrapperEl.style.height = Math.max(120, bookProgress.length * 60) + "px";

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
        },
      ],
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { min: 0, max: 100 } },
    },
  });

  // カテゴリ別集計（学習時間・進捗率）
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

  const categoryNames = Array.from(categoryMap.keys());
  const categoryTimeData = categoryNames.map(
    (name) => categoryMap.get(name).time,
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
        labels: categoryNames,
        datasets: [
          {
            label: "学習時間（分）",
            data: categoryTimeData,
            backgroundColor: categoryColors,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    },
  );

  // カテゴリ数に応じてラッパーの高さを動的に設定
  const catProgressWrapperEl = document.querySelector(
    ".chart-category-progress-wrapper",
  );
  catProgressWrapperEl.style.height =
    Math.max(120, categoryNames.length * 60) + "px";

  // カテゴリ別進捗率（横棒グラフ）
  chartCategoryProgress = new Chart(
    document.getElementById("chart-category-progress"),
    {
      type: "bar",
      data: {
        labels: categoryNames,
        datasets: [
          {
            label: "進捗率(%)",
            data: categoryProgressData,
            backgroundColor: categoryColors,
          },
        ],
      },
      options: {
        indexAxis: "y",
        maintainAspectRatio: false,
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { min: 0, max: 100 } },
      },
    },
  );

  // 進捗率推移（累積カーブ・折れ線グラフ）
  const totalAllTasks = allTasks.length;

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
          borderColor: "#9FE1CB",
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3,
        },
        {
          label: "実績進捗（%）",
          data: actualProgressData,
          borderColor: "#1D9E75",
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: "#aaa",
            font: { size: 12 },
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 100,
          ticks: { callback: (v) => v + "%" },
        },
      },
    },
  });
}
