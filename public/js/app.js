const pages = document.querySelectorAll("main section");

function showPage() {
  const pageId = location.hash.substring(1) || "page-dashboard";
  const targetPage = document.getElementById(pageId);

  /**
   * pages.forEach(...) → pagesの中身を1つずつ取り出す
   * (page) => { ... } → 取り出した1つをpageという名前で扱い、{ }の中の処理をする
   * page.style.display = 'none' → そのページを非表示にする（display: noneはCSSでもおなじみの「消す」指定
   */
  pages.forEach((page) => {
    page.style.display = "none";
  });

  targetPage.style.display = "block";
}
//function showPage()を実行
showPage();
//リンクをクリックして#が変わったときにもshowPage()を実行
/**
 * window → ブラウザのウィンドウ全体を対象にする
 * addEventListener → 「〜が起きたら実行する」を登録する
 * 'hashchange' → 「URLの#が変わった」というイベント
 * showPage → 起きたときに実行する関数
 */
window.addEventListener("hashchange", showPage);
