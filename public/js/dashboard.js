function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

async function initDashboard() {
  const tasks = await api("/api/tasks");
  const books = await api("/api/books");

  //今週の学習時間
  const weeklyTime = tasks.reduce((sum, t) => sum + (t.study_time || 0), 0);
  document.getElementById("weekly-study-time").textContent = `${weeklyTime} 分`;

  //ステータス別件数
  const todo = tasks.filter((t) => t.status === "未着手").length;
  const inprogress = tasks.filter((t) => t.status === "進行中").length;
  const done = tasks.filter((t) => t.status === "完了").length;

  //円グラフ（ステータス別）
  new Chart(document.getElementById("chart-status"), {
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
  });

  //日別学習時間(棒グラフ)
  const days = ["月", "火", "水", "木", "金", "土", "日"];

  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const dailyData = weekDates.map((weekDate) => {
    return tasks
      .filter((t) => {
        if (!t.completed_date) return false;
        const completedDate = new Date(t.completed_date);
        return isSameDay(completedDate, weekDate);
      })
      .reduce((sum, t) => sum + (t.study_time || 0), 0);
  });

  new Chart(document.getElementById("chart-daily"), {
    type: "bar",
    data: {
      labels: days,
      datasets: [
        {
          label: "学習時間(分)",
          data: dailyData,
          backgroundColor: "hsl(234 70% 58%)",
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });

  // 書籍ごとに進捗を集計する
  const bookProgress = books.map((book) => {
    //この書籍に紐づくタスクを絞り込む
    const bookTasks = tasks.filter((t) => t.book_id === book.id);

    const total = bookTasks.length;
    const done = bookTasks.filter((t) => t.status === "完了").length;

    // 進捗率(%)を計算。totalが0の時は0にする
    const rate = total > 0 ? Math.round(done / total) * 100 : 0;

    return { title: book.title, rate };
  });

  const booksCanvas = document.getElementById("chart-books");
  booksCanvas.style.height = "80px";
  booksCanvas.style.width = "100px";

  new Chart(document.getElementById("chart-books"), {
    type: "bar",
    data: {
      labels: bookProgress.map((b) => b.title),
      datasets: [
        {
          label: "進捗率(%)",
          data: bookProgress.map((b) => b.rate),
          backgroundColor: "hsl(234 70% 58%)",
        },
      ],
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        x: {
          min: 0,
          max: 100,
        },
      },
    },
    plugins: [],
  });
}
