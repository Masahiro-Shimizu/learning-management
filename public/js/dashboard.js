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
const GOAL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;

function loadSavedPeriod() {
  const saved = localStorage.getItem(PERIOD_STORAGE_KEY);
  return VALID_PERIODS.includes(saved) ? saved : "week";
}

let currentPeriod = loadSavedPeriod();
let viewDate = new Date();

let allTasks = [];
let allBooks = [];
let allSteps = []; // v2.21.19追加：学習時間集計のステップ単位化に使用
let allStudyLogs = []; // ← 追加

// 【修正】重複していた CHART_COLORS 定義は一元化したため、ここから削除しました
// (tasks.js側で定義されたグローバルの CHART_COLORS を自動的に参照します)

function minutesToHours(minutes) {
  return Math.round((minutes / 60) * 10) / 10;
}

// v2.21.25追加：開始日〜終了日の日数で学習時間を均等按分するヘルパー
// 実績（start_date〜end_date）・予定（start_planned_date〜end_planned_date）の
// 両方から呼び出す共通ロジック。開始日が無い、または終了日より後になっている
// 不整合なデータの場合は、従来通り終了日1日にまとめて計上するフォールバックとする
function distributeTimeEntry(entries, startStr, endStr, minutes, categoryName) {
  if (!minutes || !endStr) return;

  const start = startStr ? new Date(startStr) : new Date(endStr);
  const end = new Date(endStr);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    entries.push({ date: endStr, minutes, category_name: categoryName });
    return;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const dayCount = Math.round((end - start) / dayMs) + 1;

  if (dayCount <= 1) {
    entries.push({ date: endStr, minutes, category_name: categoryName });
    return;
  }

  const perDayMinutes = minutes / dayCount;
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    entries.push({
      date: `${y}-${m}-${day}`,
      minutes: perDayMinutes,
      category_name: categoryName,
    });
  }
}

// v2.21.25修正：終了日にまとめて計上する方式から、開始日〜終了日で
// 均等按分する方式に変更（実績・予定の両方）。長期間にまたがる
// ステップ/タスクの学習時間が最終日に偏って表示される問題を解消する
function buildTimeEntries(tasks, stepsByTaskId) {
  const actualEntries = [];
  const plannedEntries = [];

  tasks.forEach((task) => {
    const steps = stepsByTaskId[task.id] || [];

    if (steps.length > 0) {
      steps.forEach((step) => {
        distributeTimeEntry(
          actualEntries,
          step.start_date,
          step.end_date,
          Number(step.study_time) || 0,
          task.category_name,
        );
        distributeTimeEntry(
          plannedEntries,
          step.start_planned_date,
          step.end_planned_date,
          Number(step.planned_study_time) || 0,
          task.category_name,
        );
      });
    } else {
      distributeTimeEntry(
        actualEntries,
        task.start_date,
        task.end_date,
        Number(task.study_time) || 0,
        task.category_name,
      );
      distributeTimeEntry(
        plannedEntries,
        task.start_planned_date,
        task.end_planned_date,
        Number(task.planned_study_time) || 0,
        task.category_name,
      );
    }
  });

  return { actualEntries, plannedEntries };
}

// v2.21.19追加：エントリの日付が期間範囲内かどうかで絞り込む共通ヘルパー
function filterEntriesByRange(entries, range) {
  if (!range) return entries; // "全期間"は絞り込みなし
  return entries.filter((e) => {
    const d = new Date(e.date);
    return d >= range.start && d <= range.end;
  });
}

// v2.21.22追加：進捗率集計の単位（ステップ or フォールバックタスク）を組み立てる。
// 子タスク（実作業）はさらに孫タスク（ステップ）に分解されており、実際に手を
// 動かす最小単位はステップであるため、進捗率系の集計はタスクではなくステップを
// 母数とする。ステップが0件の子タスクは、タスク自体を1ステップ相当として
// カウントする（フォールバック。未完了/完了の2値で扱う）。
// 進捗率カード・進捗率推移グラフ・書籍別/カテゴリ別進捗率はこの単位で集計する。
// 「進行中タスク数」カード・「ステータス別件数」ドーナツは、タスクの3値ステータス
// （未着手/進行中/完了）を表すカードのため、引き続きタスク単位のfilteredTasksを
// 参照する（ステップ側にはis_completedの2値しかなく「進行中」に相当する状態がない）
function buildProgressUnits(tasks, stepsByTaskId) {
  const units = [];
  tasks.forEach((task) => {
    const steps = stepsByTaskId[task.id] || [];

    if (steps.length > 0) {
      steps.forEach((step) => {
        units.push({
          task_id: task.id,
          category_name: task.category_name,
          book_id: task.book_id,
          is_completed: !!Number(step.is_completed),
          planned_end_date: step.end_planned_date || null,
          actual_end_date: step.end_date || null,
          target_date_str:
            step.end_date ||
            step.end_planned_date ||
            step.start_planned_date ||
            null,
        });
      });
    } else {
      units.push({
        task_id: task.id,
        category_name: task.category_name,
        book_id: task.book_id,
        is_completed: task.status === "完了",
        planned_end_date: task.end_planned_date || null,
        actual_end_date: task.end_date || null,
        target_date_str:
          task.end_date ||
          task.end_planned_date ||
          task.start_planned_date ||
          null,
      });
    }
  });
  return units;
}

// v2.21.22追加：進捗率ユニットを期間範囲で絞り込む共通ヘルパー（filterEntriesByRangeの進捗率版）
function filterProgressUnitsByRange(units, range) {
  if (!range) return units; // "全期間"は絞り込みなし
  return units.filter((u) => {
    if (!u.target_date_str) return false;
    const d = new Date(u.target_date_str);
    return d >= range.start && d <= range.end;
  });
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
// ===== グラフ =====
// アニメーションスキップ問題を根本解決する、完全固定バリア方式の upsertChart
// ===== グラフ =====
// アニメーションスキップ問題を根本解決する「遅延update」方式の upsertChart
function upsertChart(existingChart, canvasEl, config) {
  if (existingChart) {
    existingChart.destroy();
  }

  // 【最強の裏技】
  // 初期化時は「すべて0」のデータで生成し、画面の揺れが収まってから本来のデータを流し込むことで、
  // リサイズ検知によるアニメーションの強制終了を完全に回避します。

  // 1. 本来のデータセットを安全に退避
  const originalDatasets = config.data.datasets;
  
  // 2. グラフ生成用には「すべて0」のダミーデータセットを作成してセット
  config.data.datasets = originalDatasets.map(dataset => ({
    ...dataset,
    data: dataset.data ? dataset.data.map(() => 0) : []
  }));

  // 3. データ0の状態でグラフインスタンスを生成（呼び出し元の処理を止めないようすぐ返す）
  const chart = new Chart(canvasEl, config);

  // 4. CSSフェードイン等の微小な画面の揺れが完全に終わる頃合い（約400ms後）に、
  //    本来のデータを注入してアニメーションを意図的に発動させる！
  setTimeout(() => {
    chart.data.datasets = originalDatasets;
    chart.update(); // 🌟ここで確実に「0からスゥーッと伸びる」アニメーションが再生されます
  }, 400);

  return chart;
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

// v2.21.21追加：期間ラベルクリックでネイティブの週/月/年ピッカーを開く
function dateToIsoWeekString(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function isoWeekStringToMonday(value) {
  const [yearStr, weekStr] = value.split("-W");
  const year = Number(yearStr);
  const week = Number(weekStr);
  if (!year || !week) return null;
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay() || 7;
  simple.setDate(simple.getDate() - dayOfWeek + 1);
  return simple;
}

function openPeriodPicker() {
  if (currentPeriod === "all") return;

  const weekPicker = document.getElementById("period-week-picker");
  const monthPicker = document.getElementById("period-month-picker");
  const yearPicker = document.getElementById("period-year-picker");

  let target = null;

  if (currentPeriod === "week" && weekPicker) {
    weekPicker.value = dateToIsoWeekString(viewDate);
    target = weekPicker;
  } else if (currentPeriod === "month" && monthPicker) {
    const y = viewDate.getFullYear();
    const m = String(viewDate.getMonth() + 1).padStart(2, "0");
    monthPicker.value = `${y}-${m}`;
    target = monthPicker;
  } else if (currentPeriod === "year" && yearPicker) {
    yearPicker.value = `${viewDate.getFullYear()}-01`;
    target = yearPicker;
  }

  if (!target) return;
  if (typeof target.showPicker === "function") {
    target.showPicker();
  } else {
    target.focus();
    target.click();
  }
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

  // v2.21.19追加：groupStepsByTaskId()はtasks.jsで定義済みのものを再利用
  const stepsByTaskId = groupStepsByTaskId(allSteps);
  const { actualEntries, plannedEntries } = buildTimeEntries(tasks, stepsByTaskId);
  // v2.21.22追加：進捗率系（カード・推移グラフ・書籍別/カテゴリ別）の集計に使う
  // ステップ単位の進捗ユニット一覧。期間での絞り込みは後段でrangeごとに行う
  const allProgressUnits = buildProgressUnits(tasks, stepsByTaskId);


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

    // 変更後
    // v2.21.19修正：タスク単位ではなくステップ単位（timeEntries）で日別に集計
    dailyData = weekDates.map((weekDate) =>
      allStudyLogs
        .filter((log) => isSameDay(new Date(log.log_date), weekDate))
        .reduce((sum, log) => sum + Number(log.study_time || 0), 0)
    );

    dailyPlannedData = weekDates.map((weekDate) =>
      plannedEntries
        .filter((e) => isSameDay(new Date(e.date), weekDate))
        .reduce((sum, e) => sum + e.minutes, 0),
    );

    filteredTasks = tasks.filter((t) => {
      // 変更後
      // v2.21.18修正：ステータスに関わらず、実績終了日(end_date)があれば
      // それを最優先する。進行中タスクでもステップの実績日ロールアップ（v2.21.17）で
      // end_dateが確定していれば、その日付で期間判定できるようにする
      const targetDateStr =
      t.end_date || t.end_planned_date || t.start_planned_date;
      if (!targetDateStr) return false;
      const d = new Date(targetDateStr);
      return d >= monday && d <= sunday;
    });
  } else if (currentPeriod === "month") {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

    // 変更後
    // v2.21.19修正：ステップ単位（timeEntries）で日別に集計
    dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return allStudyLogs
        .filter((log) => isSameDay(new Date(log.log_date), date))
        .reduce((sum, log) => sum + Number(log.study_time || 0), 0);
    });

    dailyPlannedData = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return plannedEntries
        .filter((e) => isSameDay(new Date(e.date), date))
        .reduce((sum, e) => sum + e.minutes, 0);
    });

    // 修正後
    filteredTasks = tasks.filter((t) => {
      const targetDateStr =
        t.end_date || t.end_planned_date || t.start_planned_date;
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

    // 変更後
    // v2.21.19修正：ステップ単位（timeEntries）で月別に集計
    dailyData = Array.from({ length: 12 }, (_, i) =>
      allStudyLogs
        .filter((log) => {
          const d = new Date(log.log_date);
          return d.getFullYear() === year && d.getMonth() === i;
        })
        .reduce((sum, log) => sum + Number(log.study_time || 0), 0)
    );

    dailyPlannedData = Array.from({ length: 12 }, (_, i) =>
      plannedEntries
        .filter((e) => {
          const d = new Date(e.date);
          return d.getFullYear() === year && d.getMonth() === i;
        })
        .reduce((sum, e) => sum + e.minutes, 0),
    );

    // 修正後
    filteredTasks = tasks.filter((t) => {
      const targetDateStr =
        t.end_date || t.end_planned_date || t.start_planned_date;
      if (!targetDateStr) return false;
      const d = new Date(targetDateStr);
      return d.getFullYear() === year;
    });
  // 変更後
  } else if (currentPeriod === "all") {
    // v2.21.19修正：年の一覧・学習時間データをタスクではなくtimeEntries（ステップ単位）から算出
    const entryYears = new Set();
    actualEntries.forEach((e) => {
      const y = new Date(e.date).getFullYear();
      if (!Number.isNaN(y)) entryYears.add(y);
    });
    plannedEntries.forEach((e) => {
      const y = new Date(e.date).getFullYear();
      if (!Number.isNaN(y)) entryYears.add(y);
    });
    const years = Array.from(entryYears);
    if (years.length === 0) years.push(new Date().getFullYear());
    years.sort((a, b) => a - b);

    labels = years.map((y) => `${y}年`);
    filteredTasks = tasks;

    dailyData = years.map((year) =>
      allStudyLogs
        .filter((log) => new Date(log.log_date).getFullYear() === year)
        .reduce((sum, log) => sum + Number(log.study_time || 0), 0)
    );
    dailyPlannedData = years.map((year) =>
      plannedEntries
        .filter((e) => new Date(e.date).getFullYear() === year)
        .reduce((sum, e) => sum + e.minutes, 0),
    );
  }

  // 変更後
  // ===== サマリーカード更新 =====

  // v2.21.19追加：前期間（先週/先月/前年）の日付範囲を一度だけ算出し、
  // 学習時間・進捗率どちらの比較でも共通利用する（従来は2箇所で別々に算出していた）
  let prevRange = null;
  if (currentPeriod !== "all") {
    const prevBaseDate = new Date(viewDate);
    if (currentPeriod === "week") {
      prevBaseDate.setDate(viewDate.getDate() - 7);
    } else if (currentPeriod === "month") {
      prevBaseDate.setMonth(viewDate.getMonth() - 1);
    } else if (currentPeriod === "year") {
      prevBaseDate.setFullYear(viewDate.getFullYear() - 1);
    }
    prevRange = getPeriodRange(currentPeriod, prevBaseDate);
  }

  // 現在の期間の日付範囲（"all"はnull＝絞り込みなし）
  const currentRange =
    currentPeriod === "all" ? null : getPeriodRange(currentPeriod, viewDate);

  // v2.21.19修正：学習時間はタスクではなくtimeEntries（ステップ単位）から算出。
  // タスク単位のままだと、週や月をまたいで作業したタスクの時間が最新ステップの
  // 日付にまとめて計上され、期間をまたぐ実績が正しく分配されない問題があった
  // 変更後：study_logsから期間内のデータを絞り込む
  const filteredLogs = currentRange
    ? allStudyLogs.filter((log) => {
        const d = new Date(log.log_date);
        return d >= currentRange.start && d <= currentRange.end;
      })
    : allStudyLogs;

  // 変更：変数名を変更し、minutesToHoursを通さずに直接時間を合計する
  const periodTotalHours = filteredLogs.reduce(
    (sum, log) => sum + Number(log.study_time || 0),
    0,
  );
  // 小数第1位で丸めてそのままアニメーションへ渡す
  animateSummaryValue(document.getElementById("period-study-time"), periodTotalHours.toFixed(1), {
    decimals: 1,
  });

  const prevLogs = prevRange
    ? allStudyLogs.filter((log) => {
        const d = new Date(log.log_date);
        return d >= prevRange.start && d <= prevRange.end;
      })
    : [];

  // 変更：過去のデータもそのまま「時間」として合計する
  const prevTotalHours = prevLogs.reduce((sum, log) => sum + Number(log.study_time || 0), 0);
  
  // 変更：÷60 (minutesToHours) は使わずに直接引き算し、小数第1位で丸める
  let diffHours = periodTotalHours - prevTotalHours;
  diffHours = Math.round(diffHours * 10) / 10;
  
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
      `${periodLabel} <span class="sub-highlight">${diffSign}${diffHours}h</span>`;
  }

  // ② 進捗率
  // v2.21.22修正：進捗率カード・推移グラフの母数を「子タスク」から「ステップ」に変更。
  // 子タスク（実作業の単位）はさらに孫タスク（ステップ）に分解されており、実際に
  // 手を動かす最小単位はステップであるため、進捗率もステップ単位で集計する方が
  // 実態に近い。ステップが0件の子タスクは、そのタスク自体を1ステップ相当として
  // カウントする（フォールバック。未完了/完了の2値で扱う）。
  // なお「進行中タスク数」カード・「ステータス別件数」ドーナツは、タスクの
  // ステータス（未着手/進行中/完了の3値）を表すカードのため、引き続きタスク単位
  // （filteredTasks）のまま据え置く（ステップにはis_completedの2値しかなく
  // 「進行中」に相当する状態が存在しないため）。
  const filteredProgressUnits = filterProgressUnitsByRange(
    allProgressUnits,
    currentRange,
  );

  const periodCompletedUnits = filteredProgressUnits.filter(
    (u) => u.is_completed,
  ).length;

  const currentProgressRate =
    filteredProgressUnits.length > 0
      ? Math.round((periodCompletedUnits / filteredProgressUnits.length) * 100)
      : 0;

  const progressRateEl = document.getElementById("progress-rate");
  if (progressRateEl) {
    animateSummaryValue(progressRateEl, currentProgressRate);
  }

  let prevProgressRate = 0;
  const prevProgressUnits = filterProgressUnitsByRange(
    allProgressUnits,
    prevRange,
  );

  if (currentPeriod !== "all" && prevRange) {
    const prevCompletedUnits = prevProgressUnits.filter(
      (u) => u.is_completed,
    ).length;

    prevProgressRate =
      prevProgressUnits.length > 0
        ? Math.round((prevCompletedUnits / prevProgressUnits.length) * 100)
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

  // 変更後：dailyDataはstudy_logs由来（すでに時間）なので÷60不要
  const dailyHours = dailyData.map((h) => Math.round(h * 10) / 10);
  const dailyPlannedHours = dailyPlannedData.map(minutesToHours); // 予定は分のままなのでこちらは維持
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

  // v2.21.22修正：書籍別進捗率もステップ単位で集計する（期間絞り込みなし＝
  // 通算進捗という位置づけは従来通り。allProgressUnitsは絞り込み前の全ユニット）
  const bookUnitMap = new Map();
  allProgressUnits.forEach((u) => {
    if (!u.book_id) return;
    const key = String(u.book_id);
    if (!bookUnitMap.has(key)) bookUnitMap.set(key, { total: 0, done: 0 });
    const entry = bookUnitMap.get(key);
    entry.total += 1;
    if (u.is_completed) entry.done += 1;
  });

  const bookProgress = books
    .map((book) => {
      const entry = bookUnitMap.get(String(book.id)) || { total: 0, done: 0 };
      const rate =
        entry.total > 0 ? Math.round((entry.done / entry.total) * 100) : 0;
      return { title: book.title, rate, total: entry.total };
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

  // 変更後：型変換(String)とステップ経由の自動補完を入れた安全なカテゴリ集計
  const taskCategoryMap = new Map(allTasks.map((t) => [String(t.id), t.category_name]));
  const stepTaskMap = new Map(allSteps.map((s) => [String(s.id), String(s.task_id)]));

  const categoryTimeMap = new Map();
  filteredLogs.forEach((log) => {
    // task_id が無ければ step_id から親タスクの ID を紐づけ
    let taskIdStr = log.task_id ? String(log.task_id) : null;
    if (!taskIdStr && log.step_id) {
      taskIdStr = stepTaskMap.get(String(log.step_id)) || null;
    }

    const catName = (taskIdStr && taskCategoryMap.get(taskIdStr)) || "(言語不問)";
    const minutes = Number(log.study_time || 0);
    categoryTimeMap.set(catName, (categoryTimeMap.get(catName) || 0) + minutes);
  });

  const categoryTimeNames = Array.from(categoryTimeMap.keys());
  // 変更後：categoryTimeMapの値もstudy_logs由来（すでに時間）
  const categoryTimeData = categoryTimeNames.map((name) =>
    Math.round(categoryTimeMap.get(name) * 10) / 10,
  );
  const categoryTimeColors = categoryTimeNames.map((name) =>
    getCategoryChartColor(name),
  );

  const categoryProgressMap = new Map();
  filteredProgressUnits.forEach((u) => {
    const name = u.category_name || "(言語不問)";
    if (!categoryProgressMap.has(name)) {
      categoryProgressMap.set(name, { total: 0, done: 0 });
    }
    const entry = categoryProgressMap.get(name);
    entry.total += 1;
    if (u.is_completed) entry.done += 1;
  });
  const categoryProgressNames = Array.from(categoryProgressMap.keys());
  const categoryProgressData = categoryProgressNames.map((name) => {
    const entry = categoryProgressMap.get(name);
    return entry.total > 0 ? Math.round((entry.done / entry.total) * 100) : 0;
  });
  const categoryProgressColors = categoryProgressNames.map((name) =>
    getCategoryChartColor(name),
  );

  chartCategoryTime = upsertChart(
    chartCategoryTime,
    document.getElementById("chart-category-time"),
    {
      type: "bar",
      data: {
        labels: categoryTimeNames.length > 0 ? categoryTimeNames : ["データなし"],
        datasets: [
          {
            label: "学習時間（時間）",
            data: categoryTimeData.length > 0 ? categoryTimeData : [],
            backgroundColor:
              categoryTimeColors.length > 0 ? categoryTimeColors : ["#808080"],
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
    const catBarHeight = categoryProgressNames.length > 6 ? 32 : 45;
    categoryProgressWrapper.style.height = `${Math.max(categoryProgressNames.length * catBarHeight, 200)}px`;
  }

  chartCategoryProgress = upsertChart(
    chartCategoryProgress,
    document.getElementById("chart-category-progress"),
    {
      type: "bar",
      data: {
        labels:
          categoryProgressNames.length > 0
            ? categoryProgressNames
            : ["データなし"],
        datasets: [
          {
            label: "進捗率(%)",
            data: categoryProgressData.length > 0 ? categoryProgressData : [],
            backgroundColor:
              categoryProgressColors.length > 0
                ? categoryProgressColors
                : ["#808080"],
            barPercentage: categoryProgressNames.length > 6 ? 0.6 : 0.8,
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

  // v2.21.22修正：進捗率推移グラフの母数もステップ単位（filteredProgressUnits）に変更。
  // 従来はfilteredTasks（子タスク数）を母数にしていたが、進捗率カード・
  // カテゴリ/書籍別進捗率と考え方を統一し、実際の作業単位であるステップを分母にする。
  const periodUnitCount = filteredProgressUnits.length;

  const plannedProgressData = progressLabelDates.map((labelDate) => {
    if (periodUnitCount === 0) return 0;
    const count = filteredProgressUnits.filter((u) => {
      if (!u.planned_end_date) return false;
      return new Date(u.planned_end_date) <= labelDate;
    }).length;
    return Math.round((count / periodUnitCount) * 100);
  });

  const actualProgressData = progressLabelDates.map((labelDate) => {
    if (periodUnitCount === 0) return 0;
    const count = filteredProgressUnits.filter((u) => {
      if (!u.is_completed || !u.actual_end_date) return false;
      return new Date(u.actual_end_date) <= labelDate;
    }).length;
    return Math.round((count / periodUnitCount) * 100);
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
      week: "今週の目標を設定",
      month: "今月の目標を設定",
      year: "今年の目標を設定",
    };
    btnEl.innerHTML = `<span class="icon-btn-inline">${GOAL_ICON}</span>${btnLabels[period] || "目標を設定"}`;
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

    const reviews = await api("/api/result-reviews");
    const matchingReview = Array.isArray(reviews)
      ? reviews.find(
         (r) =>
           r.period_type === period &&
           ymdDash(r.start_date) === startDateStr &&
           ymdDash(r.end_date) === endDateStr,
        )
      : null;
    const savedGoal = matchingReview?.goal;

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
    titleEl.innerHTML = `<span class="icon-btn-inline">${GOAL_ICON}</span>${periodTitles[currentPeriod] || ""}の目標`;

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
    const input = document.getElementById("goal-input-text");
    if (input) input.value = existing?.goal || "";
  });

  document.getElementById("goal-modal").classList.remove("hidden");
}

function closeGoalModal() {
  document.getElementById("goal-modal").classList.add("hidden");
}

// ↓ この関数をここに追加
async function saveGoalFromModal() {
  const range = getCurrentPeriodRange(currentPeriod);
  if (!range) return;

  const goal = document.getElementById("goal-input-text")?.value || null;

  await api("/api/result-reviews", "POST", {
    period_type: currentPeriod,
    start_date: ymdDash(range.start),
    end_date: ymdDash(range.end),
    goal,
  });

  closeGoalModal();
  await loadAndShowCurrentPeriodGoal(currentPeriod);
}


async function refreshDashboard() {
  await loadDashboardData();
  renderCharts();
  loadAndShowCurrentPeriodGoal(currentPeriod);
}

// 変更後
// v2.21.20追加：データ取得部分を切り出し、初回表示（initDashboard）・
// 2回目以降の再訪問（refreshDashboard）の両方から呼べるようにする
async function loadDashboardData() {
  const tasks = await api("/api/tasks");
  const books = await api("/api/books");
  const steps = await api("/api/steps");
  const studyLogs = await api("/api/study-logs"); // ← 追加

  allTasks = tasks;
  allBooks = books;
  allSteps = steps;
  allStudyLogs = studyLogs; // ← 追加
}


async function initDashboard() {
  await loadDashboardData();

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

    document
  .getElementById("period-label-wrap")
  ?.addEventListener("click", openPeriodPicker);
document
  .getElementById("period-label-wrap")
  ?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPeriodPicker();
    }
  });

document
  .getElementById("period-week-picker")
  ?.addEventListener("change", (e) => {
    const monday = isoWeekStringToMonday(e.target.value);
    if (!monday) return;
    viewDate = monday;
    renderCharts();
  });

document
  .getElementById("period-month-picker")
  ?.addEventListener("change", (e) => {
    const value = e.target.value;
    if (!value) return;
    const [y, m] = value.split("-").map(Number);
    viewDate = new Date(y, m - 1, 1);
    renderCharts();
  });

document
  .getElementById("period-year-picker")
  ?.addEventListener("change", (e) => {
    const value = e.target.value;
    if (!value) return;
    const [y] = value.split("-").map(Number);
    viewDate = new Date(y, 0, 1);
    renderCharts();
  });

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
  ?.addEventListener("click", saveGoalFromModal);


  // 最初のロード時に現在期間の目標を表示
  loadAndShowCurrentPeriodGoal(currentPeriod);

  // 最後に初期グラフ全体のレンダリングを実行
  renderCharts();
}