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
let chartProgress = null; // ← 追加

async function initDashboard() {
  const tasks = await api("/api/tasks");
  const books = await api("/api/books");

  // 今週の学習時間（サマリーは常に今週固定）
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const weeklyTime = tasks
    .filter((t) => {
      if (!t.end_date) return false;
      const endDate = new Date(t.end_date);
      return endDate >= monday && endDate <= today;
    })
    .reduce((sum, t) => sum + (t.study_time || 0), 0);
  document.getElementById("weekly-study-time").textContent = `${weeklyTime} 分`;

  // 先週の学習時間
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
  document.getElementById("monthly-study-time").textContent =
    `${monthlyTime} 分`;
  document.getElementById("monthly-study-sub").textContent =
    `${year}年${month + 1}月の合計`;

  // 進行中タスク数
  const inprogressCount = tasks.filter((t) => t.status === "進行中").length;
  const totalCount = tasks.length;
  document.getElementById("inprogress-count").textContent =
    `${inprogressCount} 件`;
  document.getElementById("inprogress-sub").textContent =
    `全 ${totalCount} 件中`;

  // 登録書籍数
  const booksCount = books.length;
  document.getElementById("books-count").textContent = `${booksCount} 冊`;
  document.getElementById("books-sub").textContent = `登録済み`;

  // 期間切り替えボタン
  document.querySelectorAll(".btn-period").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".btn-period")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderCharts(btn.dataset.period, tasks, books);
    });
  });

  // 初期描画（週）
  renderCharts("week", tasks, books);
}

function renderCharts(period, tasks, books) {
  const today = new Date();
  let filteredTasks = [];
  let labels = [];
  let dailyData = [];

  if (period === "week") {
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });

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
      return d >= monday && d <= today;
    });
  } else if (period === "month") {
    const year = today.getFullYear();
    const month = today.getMonth();
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
  } else if (period === "year") {
    const year = today.getFullYear();
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

  // グラフを破棄して再描画
  if (chartDaily) chartDaily.destroy();
  if (chartStatus) chartStatus.destroy();
  if (chartBooks) chartBooks.destroy();
  if (chartProgress) chartProgress.destroy();

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

  const totalTasks = filteredTasks.length;
  const doneTasks = filteredTasks.filter((t) => t.status === "完了").length;
  const actualRate =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  chartProgress = new Chart(document.getElementById("chart-progress"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "予定進捗（%）",
          data: labels.map((_, i) =>
            Math.round(((i + 1) / labels.length) * 100),
          ),
          borderColor: "#9FE1CB",
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3,
        },
        {
          label: "実績進捗（%）",
          data: labels.map(() => actualRate),
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
      plugins: { legend: { display: false } },
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

  chartStatus = new Chart(document.getElementById("chart-status"), {
    type: "doughnut",
    data: {
      labels: ["未着手", "進行中", "完了"],
      datasets: [
        {
          data: [todo, inprogress, done],
          backgroundColor: ["#808080", "#4d7fd4", "#3a9d6e"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  const bookProgress = books.map((book) => {
    const bookTasks = tasks.filter((t) => t.book_id === book.id);
    const total = bookTasks.length;
    const doneTasks = bookTasks.filter((t) => t.status === "完了").length;
    const rate = total > 0 ? Math.round((doneTasks / total) * 100) : 0;
    return { title: book.title, rate };
  });

  const bookColors = [
    "#4d7fd4",
    "#e6a817",
    "#3a9d6e",
    "#e05c5c",
    "#9b6fd4",
    "#4dc4d4",
    "#d46f9b",
    "#7fd46f",
  ];

  chartBooks = new Chart(document.getElementById("chart-books"), {
    type: "bar",
    data: {
      labels: bookProgress.map((b) => b.title),
      datasets: [
        {
          label: "進捗率(%)",
          data: bookProgress.map((b) => b.rate),
          backgroundColor: bookProgress.map(
            (_, i) => bookColors[i % bookColors.length],
          ),
        },
      ],
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      responsive: true,
      scales: { x: { min: 0, max: 100 } },
    },
  });
}
