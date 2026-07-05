// ===== タイムライン拡張機能：ステータスフィルタータブのイベント処理 =====

function getTimelineStatusFilter() {
  return localStorage.getItem("timeline_status_filter") || "all";
}

function saveTimelineStatusFilter(statusFilter) {
  localStorage.setItem("timeline_status_filter", statusFilter);
}

// ステータスフィルタータブのクリックイベントをバインド
function bindTimelineStatusFilterEvents() {
  document.querySelectorAll(".timeline-status-filter-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const selectedFilter = tab.dataset.statusFilter;
      saveTimelineStatusFilter(selectedFilter);

      // ❌ 古い処理：不要になったため削除しました（renderTimeline内で処理）
      // document.querySelectorAll(".timeline-status-filter-tab").forEach((t) => {
      //   t.classList.toggle("active", t === tab);
      // });

      // ✅ 新しい処理：最新データでタイムラインを再描画
      if (lastTaskViewData && typeof renderTimeline === "function") {
        renderTimeline(lastTaskViewData);
      }
    });
  });
}

// 既存の renderTimeline 関数を拡張
function renderTimelineEnhanced(data) {
  const { groups, tasks } = data;

  const today = new Date();
  const year = timelineDate.getFullYear();
  const month = timelineDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth);

  // 💡 タスクバーの計算(leftPercent)と完璧に同期させるため、「- 1（マスの左端基準）」に統一
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const todayLeftPercent = isCurrentMonth
    ? ((today.getDate() - 1) / daysInMonth) * 100
    : null;

  // 💡 横スクロールする「.timeline-track」の内部に埋め込むための共通オレンジ線HTML
  const commonTodayLineHtml =
    todayLeftPercent !== null
      ? `<div class="timeline-today-line" style="left: ${todayLeftPercent}%;"></div>`
      : "";

  const grid = document.getElementById("timeline-grid");
  grid.innerHTML = "";

  const axisCellsHtml = Array.from(
    { length: daysInMonth },
    (_, i) => `<div class="timeline-axis-cell">${i + 1}</div>`,
  ).join("");

  // 1. 一番上のカレンダー目盛り行の描画
  grid.insertAdjacentHTML(
    "beforeend",
    `<div class="timeline-row">
          <div class="timeline-row-header" style="min-height: 38px; padding: 4px 12px;">
            <div class="timeline-month-nav">
              <button type="button" id="btn-timeline-prev" class="btn btn-secondary" aria-label="前の月" style="padding: 1px 6px;">＜</button>
              <span id="timeline-month-label" class="timeline-month-label" role="button" tabindex="0"></span>
              <button type="button" id="btn-timeline-next" class="btn btn-secondary" aria-label="次の月" style="padding: 1px 6px;">＞</button>
              <input type="month" id="timeline-month-picker" class="timeline-month-picker" aria-label="年月を選択" />
            </div>
          </div>
          <div class="timeline-track" style="position: relative !important;">
            <div class="timeline-axis" style="display: grid !important; grid-template-columns: repeat(${daysInMonth}, 1fr) !important; width: 100% !important;">
              ${axisCellsHtml}
            </div>
            ${commonTodayLineHtml}
          </div>
        </div>`,
  );

  const hideCompleted =
    document.getElementById("timeline-hide-completed")?.checked ?? false;

  // 表示モード（���べて/予定/実績）をタブに反映
  const displayMode = getTimelineDisplayMode();
  document.querySelectorAll(".timeline-mode-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === displayMode);
  });

  // 【新規追加】ステータスフィルター対応
  const statusFilter = getTimelineStatusFilter();
  document.querySelectorAll(".timeline-status-filter-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.statusFilter === statusFilter);
  });

  const collapsedStatuses = getCollapsedTimelineStatuses();
  const collapsedGroups = getCollapsedTimelineGroups();

  const TASK_ROW_HEIGHT = displayMode === "all" ? 48 : 26;

  const statuses = ["未着手", "進行中", "完了"];

  // 【新規追加】ステータスフィルター適用：指定ステータスのみに絞る
  let targetStatuses = statuses;
  if (statusFilter !== "all") {
    targetStatuses = [statusFilter];
  }

  const groupedByStatus = { 未着手: [], 進行中: [], 完了: [] };
  groups.forEach((group) => {
    const status = calcStatus(group.id, tasks);
    (groupedByStatus[status] || groupedByStatus["未着手"]).push(group);
  });

  targetStatuses.forEach((status) => {
    const statusGroups = sortGroupsByEarliestPlannedDate(
      groupedByStatus[status] || [],
      tasks,
    );
    const isStatusCollapsed = collapsedStatuses.includes(status);
    const statusArrow = isStatusCollapsed ? "▸" : "▾";

    // ステータス大枠見出し行
    grid.insertAdjacentHTML(
      "beforeend",
      `<div class="timeline-status-header-row" data-timeline-status-toggle="${status}">
          <span class="status-row-toggle">${statusArrow}</span>${status}（${statusGroups.length}件）
        </div>`,
    );

    if (isStatusCollapsed) return;

    statusGroups.forEach((group) => {
      let childTasks = tasks.filter(
        (t) => String(t.group_id) === String(group.id),
      );
      if (hideCompleted && status === "完了") return;

      childTasks.sort((a, b) => {
        const aTime = a.start_planned_date
          ? new Date(a.start_planned_date).getTime()
          : 0;
        const bTime = b.start_planned_date
          ? new Date(b.start_planned_date).getTime()
          : 0;
        return aTime - bTime;
      });

      // 【新規追加】グループ折りたたみ状態の判定（データ属性に String() で統一）
      const isGroupCollapsed = collapsedGroups.includes(String(group.id));
      const groupArrow = isGroupCollapsed ? "▸" : "▾";

      // 💡 重なり防止用のレーン管理配列
      const lanes = [];
      let barsHtml = "";

      childTasks.forEach((task) => {
        // 予定バーの位置を計算
        const plannedPos = calcTimelineBarPosition(
          task.start_planned_date,
          task.end_planned_date,
          daysInMonth,
          monthStart,
          monthEnd,
        );

        let currentLane = 0;

        if (
          plannedPos &&
          (displayMode === "all" || displayMode === "planned")
        ) {
          let targetLane = 0;
          // 💡 【超重要】条件を「>=」に変更。これによって、同じ日から同時にスタートするタスクも確実に検知して段を分けます
          while (
            lanes[targetLane] !== undefined &&
            lanes[targetLane] >= plannedPos.leftPercent
          ) {
            targetLane++;
          }
          lanes[targetLane] = plannedPos.leftPercent + plannedPos.widthPercent;
          currentLane = targetLane;

          const topPosition = currentLane * 24 + 4;

          barsHtml += `<div class="timeline-bar timeline-bar--planned" data-task-id="${task.id}" style="left: ${plannedPos.leftPercent}%; width: ${plannedPos.widthPercent}%; top: ${topPosition}px;">
                  <span class="timeline-bar-title">${task.title}</span>
                </div>`;
        }

        // 実績バーの計算
        const actualPos = calcTimelineBarPosition(
          task.start_date,
          task.end_date,
          daysInMonth,
          monthStart,
          monthEnd,
        );
        if (actualPos && (displayMode === "all" || displayMode === "actual")) {
          if (!plannedPos) {
            let targetLane = 0;
            // 💡 実績バー単独のときも同様に修正します
            while (
              lanes[targetLane] !== undefined &&
              lanes[targetLane] > actualPos.leftPercent
            ) {
              targetLane++;
            }
            lanes[targetLane] = Math.max(
              lanes[targetLane] || 0,
              actualPos.leftPercent + actualPos.widthPercent,
            );
            currentLane = targetLane;
          }

          const topPosition =
            displayMode === "all"
              ? currentLane * 48 + 24
              : currentLane * 24 + 2;

          barsHtml += `<div class="timeline-bar timeline-bar--actual" data-task-id="${task.id}" style="left: ${actualPos.leftPercent}%; width: ${actualPos.widthPercent}%; top: ${topPosition}px;">
                  <span class="timeline-bar-title">${task.title}</span>
                </div>`;
        }
      });

      // 💡 タスクが多段になった分、背景のグレーの枠（トラック）の高さを動的に広げる
      const finalLaneCount = Math.max(lanes.length, 1);
      const trackHeight = isGroupCollapsed
        ? 40
        : Math.max(40, finalLaneCount * 24 + 16);

      const currentTodayLineHtml = !isGroupCollapsed ? commonTodayLineHtml : "";

      // 2. タスク行の描画
      grid.insertAdjacentHTML(
        "beforeend",
        `<div class="timeline-row">
            <div class="timeline-row-header">
              <button type="button" class="timeline-group-toggle" data-group-id="${group.id}" aria-label="子タスクの表示切替">${groupArrow}</button>
              <span class="timeline-row-header-title">${group.title}（${childTasks.length}件）</span>
            </div>
            <div class="timeline-track" data-group-id="${group.id}" style="min-height: ${trackHeight}px;">
              ${currentTodayLineHtml}
              ${barsHtml}
            </div>
          </div>`,
      );
    });
  });

  // 月選択ラベルの更新とイベント再バインド
  const monthLabel = document.getElementById("timeline-month-label");
  if (monthLabel) {
    monthLabel.textContent = `${year}年${month + 1}月`;
  }
  const monthPicker = document.getElementById("timeline-month-picker");
  if (monthPicker) {
    monthPicker.value = `${year}-${String(month + 1).padStart(2, "0")}`;
  }

  if (typeof bindTimelineEvents === "function") {
    bindTimelineEvents();
  }

  // 【新規追加】ステータスフィルタータブのイベントを再バインド
  bindTimelineStatusFilterEvents();
}

// 既存の renderTimeline 関数を上書き
const renderTimeline = renderTimelineEnhanced;
