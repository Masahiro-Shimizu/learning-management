/**
 * タスク1件のオブジェクト
 * { title: "Javaの基礎", type: "本", status: "未着手", study_time: 30 }
 */
const tasks = [
  { title: "Javaの基礎", type: "本", status: "未着手", study_time: 30 },
  { title: "PHPの基礎", type: "動画", status: "進行中", study_time: 40 },
  { title: "Reactの基礎", type: "本", status: "完了", study_time: 120 },
];

/**
 * JSで文字列を組み立てるとき、テンプレートリテラルという書き方が便利
 * バッククォート（）で囲むと、中に${ }`でJSの値を埋め込める
 * ${task.type}の部分が、実際のデータ（本・動画など）に置き換わる
 */
tasks.forEach((task) => {
  const cardHtml = `
    <div class="card kanban-card">
    <span class="task-type">${task.type}</span>
    <p>${task.title}</p>
    <span class="task-time">学習時間:${task.study_time}分</span>
    </div>
    `;
  /**
   * まず、ステータスに合うカード置き場を掴む
   */
  const container = document.querySelector(`[data-status="${task.status}"]`);
  /**
   * そこにカードHTMLを追加します。要素にHTMLを追加するにはinsertAdjacentHTMLを使う
   * beforeend'は「その要素の中の、一番最後に追加する」という意味
   */
  container.insertAdjacentHTML("beforeend", cardHtml);
});
