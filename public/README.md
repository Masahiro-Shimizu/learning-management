# 画面定義書：学習管理アプリケーション (Learning Log)

本アプリケーションの各画面の構成、表示項目、および入力ルールについての定義です。

画面定義書：学習管理アプリケーション (Learning Log) Ver.2.21.27
本ドキュメントは、学習管理アプリケーション「Learning Log」の全画面構成、表示項目、入力ルール、画面遷移、および最新の動作ロジック（v2.21.27）を定義した仕様書です。

### 画面キャプチャ

<details>

<summary>（クリックで展開）</summary>

<details>

<summary>ダッシュボード(週次/月次/年次/全期間)</summary>
▼週次
<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/6b772cb6-88ea-4875-9700-de7f374dda74" />

▼ 月次
<img width="2048" height="1152" alt="Image" src="https://github.com/user-attachments/assets/b9ae69ab-ef79-4f1d-9257-c6296a23841f" />

▼ 年次
<img width="2048" height="1152" alt="Image" src="https://github.com/user-attachments/assets/fadb9cb2-4fa2-4c84-92c9-f7ae9b33edf7" />

▼ 全期間
<img width="2048" height="1152" alt="Image" src="https://github.com/user-attachments/assets/d2aab773-f933-42e8-a51c-f9146a35efec" />

</details>

<details>

<summary>タスク一覧</summary>

<summary>カンバン</summary>
▼ 子タスク非表示
<img width="2048" height="1152" alt="Image" src="https://github.com/user-attachments/assets/5492bb78-3ee0-44ff-b933-4757ca7bfa9b" />

▼ 子タスク表示
<img width="2048" height="1152" alt="Image" src="https://github.com/user-attachments/assets/18673d25-5691-4eff-8918-9049c9357cb3" />

▼ 子タスク表示(スクロール後)
<img width="2048" height="1152" alt="Image" src="https://github.com/user-attachments/assets/b6cb914c-b271-4269-a059-886fbe34834e" />

<summary>テーブル</summary>
▼ ステータス非表示
<img width="2048" height="1152" alt="Image" src="https://github.com/user-attachments/assets/7df79340-cb14-4d6e-945c-ce4f8cf333c2" />

▼ ステータス表示+親タスク表示
<img width="2048" height="1152" alt="Image" src="https://github.com/user-attachments/assets/a2b01c04-86ca-4cd4-99b9-dc0be2453d99" />

▼ 子タスク表示
<img width="2048" height="1152" alt="Image" src="https://github.com/user-attachments/assets/ba603191-be33-4a7e-85b7-552b8a5600fd" />

▼ 子タスク表示(スクロール後)
<img width="2048" height="1152" alt="Image" src="https://github.com/user-attachments/assets/d6cd06c8-6a5b-49dc-80fd-2d60ba4979be" />

▼ 孫タスク表示
<img width="2048" height="1152" alt="Image" src="https://github.com/user-attachments/assets/b0e8d8ce-1d4e-42b9-a5ac-c8c1df9674e7" />

<summary>カレンダー</summary>
▼ すべて (孫タスク非表示)
<img width="2048" height="1152" alt="Image" src="https://github.com/user-attachments/assets/12173bfe-2fe6-4f46-83be-e36539640f86" />

▼ すべて (孫タスク表示)
<img width="2048" height="1152" alt="Image" src="https://github.com/user-attachments/assets/666439d0-49a6-4316-a19c-66c049165439" />

▼ タスク一覧(タイムライン・完了タスク表示)

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/00923897-f423-4cbc-858e-1c3f17d2c857" />

▼ タスク一覧(タイムライン・完了タスク非表示)

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/c9fca424-2ae1-498f-82c0-4764bd41684e" />

▼ 親タスク登録時モーダル(編集時)

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/a875ea82-fc30-465e-bded-5695678c6d07" />

▼ 子タスク登録時モーダル(編集時)

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/d12752e4-08b3-4886-aa10-1c832e9a3d65" />

▼ 孫タスク登録時モーダル(編集時)

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/98faeb61-8206-4299-9c6d-a3e55f1b98a5" />

▼ 孫タスク開閉時

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/6424aca5-e0e6-4b8b-b2b6-c096dbc4ab36" />

▼ 孫タスク完了時モーダル

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/4c41d716-7883-4c81-9d51-6409e603696f" />

</details>

▼ 書籍マスタ

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/ea1d5b89-d75b-41bd-97c9-6ec63413f830" />

▼ 書籍マスタ(検索時)

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/3d97c6e7-4e97-448c-8369-3439ef4c2b7a" />

▼ 書籍登録時ポップアップ

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/3c268a9d-dde9-427a-bd76-014c774948f0" />

▼ マンダラチャート開閉時

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/ca0593a3-41e1-45d0-aba5-b98c8dadf24f" />

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/2f4f0fdd-d66c-48ce-8d63-8616950aa536" />

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/ad13ecc4-7553-4f95-8770-f9cef4be1aa6" />

▼ リザルト画面(週次/月次/年次/全期間)

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/6d2eda3c-ce36-4988-a0fd-3564b63dc7f5" />

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/9124c7b0-f925-47c4-8c0f-db8e27ff89cb" />

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/ade6ceda-395b-4a5e-95bc-350768ad8ae8" />

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/f4914f79-aba3-4e39-b460-fde62455b59d" />

▼ リザルトポップアップ

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/e437935f-cc74-405b-a810-440650bb38cf" />

▼ 設定画面

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/47e1b394-c748-40c2-b8d8-440044170c83" />

▼ 設定画面(追加時)

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/df26bbd5-0ef7-4527-8e24-a74c19fb68b2" />

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/58b033ba-adf3-4aeb-9660-69aa273f2856" />

</details>

1. システム構成・タスク階層概要
   本システムにおけるタスクは以下の 3 階層構造 で管理・自動集計されます。

[親タスク (グループ / マイルストーン)]
└── [子タスク (実作業 / 章・節単位)]
└── [孫タスク (ステップ / 最小アクション)]
実績学習時間・進捗ログ（v2.21.27）: ステップ詳細保存、またはステップ 0 件の子タスク保存をトリガーとし、前後の差分（増分）のみを study_logs テーブルへ日次記録します。

マイルストーン自動算出: 親タスクの日付（予定/実績の開始・終了日）は、紐づく子タスクの最小・最大日付から自動計算されます。

2. 共通レイアウト（サイドナビゲーション）
   全画面の左側に常時表示されるメインナビゲーションです。

構成要素
No 項目名 種別 説明 / 遷移先・機能
1 ロゴ（学習管理） ロゴ トップページ（ダッシュボード）へ遷移
2 ダッシュボード メニュー 「ダッシュボード」画面へ遷移
3 タスク一覧 メニュー 「タスク一覧」画面へ遷移（カンバン/テーブル/カレンダー/タイムライン）
4 書籍マスタ メニュー 「書籍マスタ」画面へ遷移
5 マンダラチャート メニュー 「マンダラチャート」画面へ遷移（9×9 目標構造化）
6 リザルト メニュー 「リザルト」画面へ遷移（週次・月次・年次の振り返り）
7 ライト / ダーク ボタン 画面テーマ（背景・配色）をトグル切り替え
8 設定 ボタン 「設定」画面へ遷移 3. ダッシュボード画面
学習の進捗状況や現在のステータスをグラフや数値で可視化する画面です。上部で期間（週次/月次/年次/全期間）の切り替えが可能です。

3.1 画面上部：サマリーカード
カード名 表示内容 サブテキスト・集計ルール
今週の目標 設定された今週の定型目標を表示 「目標を設定」ボタンから編集モーダルを起動
期間の学習時間 選択期間内の合計学習時間（h） 前期間比（±N 時間）。全期間時は累計時間
進捗率 選択期間に属するタスクの完了率（％） 前期間比（±N％）。期間開始時は 0%からスタート
進行中タスク 選択期間内の進行中タスク数 完了 N / 全 N 件
読了書籍 読了済み冊数（completed_count >= total_chapters） 読了 / 全 N 冊
3.2 画面中部・下部：グラフエリア
グラフ名 種別 説明
日別学習時間 棒グラフ 曜日ごと（月〜日）の実績学習時間（h）を表示
カテゴリ別学習時間 ドーナツ/円 技術要素・カテゴリごとの学習時間内訳
ステータス別件数 棒/パイ 未着手 / 進行中 / 完了 のタスク件数分布
書籍別進捗率 横棒グラフ 各登録書籍の進捗度（％）
カテゴリ別進捗率 レーダー/棒 カテゴリごとの完了進捗率
進捗率推移 折れ線グラフ 日別の「予定進捗（％）」と「実績進捗（％）」の比較 4. タスク一覧画面
登録されたタスクを 4 つのビュー（カンバン・テーブル・カレンダー・タイムライン）で管理します。

4.1 画面共通ヘッダー・ツールバー
「＋ 親タスク追加」ボタン: 親タスク（グループ）作成ダイアログを起動。

ビュー切替タブ: 「カンバン」「テーブル」「カレンダー」「タイムライン」の表示モード切り替え。

子タスク表示/非表示トグル: カンバンおよびテーブルでの下層タスクの展開・折りたたみ。

検索・フィルターバー: カテゴリ、ステータス、キーワードによるリアルタイム絞り込み。

4.2 各ビューの表示仕様
ビュー名 概要・特徴的な操作
カンバン 「未着手」「進行中」「完了」の 3 カラム構造。ドラッグ＆ドロップでステータス変更可能。カードにはカテゴリタグ、期日、予定/実績時間、ステップ達成度（孫タスク消化率）を表示。
テーブル 親タスクをアコーディオン形式で展開し、子タスクを一覧表示。タイトル、種別、ステータス、予定日、完了日、学習時間、ステップ数（例: 2/4）をテーブル表示。
カレンダー 月間カレンダー。各タスクを期間バー形式で配置。空きセルをクリックすると、その日付を初期値として子タスク追加モーダルが開く。
タイムライン (ガント) 左側に親タスク名、右側に日付軸（1 日〜30 日等）を配置。ヘッダーはスクロール追従（sticky）。バー端のドラッグで期間変更が可能。完了タスクの表示/非表示切り替えトグル付き。 5. 書籍マスタ画面
学習書籍の登録・進捗管理を行う画面です。Google Books API による検索・自動登録に対応しています。

5.1 画面構成
検索・フィルターエリア: Google Books API での新刊検索フォーム、および登録済み書籍のキーワード絞り込み。

書籍カード一覧（グリッド表示）: 表紙画像、タイトル、著者名、進捗バー（N/M 章 (X%)）を表示。

5.2 書籍詳細・編集パネル（右サイドパネル形式）
書籍カードをクリックすると、画面右端からスライドイン表示されます。

項目名 種別 説明 / 入力ルール
表紙画像 / タイトル 表示 登録情報の表示（タイトル編集不可）
著者名 / 全章数 テキスト/数値 著者の変更、および総章数（total_chapters）の入力
目次（章タスク一覧） アコーディオン 各章（子タスク）の完了チェックボックス、タスク詳細リンク
└ 章別メモ欄 テキストエリア 「▶」展開で表示される 「理解したこと (understood_memo)」 と 「不明点 (unclear_points)」 の記録欄および保存ボタン 6. マンダラチャート画面（目標構造化ツール）
9×9（全 81 マス）のグリッドで目標を構造化・可視化する画面です。

6.1 構成と同期仕様
中央 3×3 ブロック: 中央マス（大目標）と周りの 8 マス（サブテーマ）。

外周 8 ブロック: 中央で入力した 8 箇所のサブテーマ名が、外周各ブロックの中心マスへ自動同期。

アクションセル (64 マス): クリックで「達成トグル（色変化）」が可能。画面上部のプログレスバーに達成率（N / 64）を反映。

子タスク連携機能: 各セルからアプリ内の「子タスク」として直接登録・紐づけが可能。モーダル内で親タスクを選択し、紐づく子タスクを絞り込んで選択できます。

7. リザルト画面（振り返り・KPT）
   週次・月次・年次の学習成果をカード形式で振り返る画面です。

7.1 機能仕様
自動振り返りポップアップ: 未振り返りの過去期間（先週や先月）が存在する場合、画面遷移時に振り返りモーダルが自動起動します。

振り返りカード一覧: 過去の確定期間＋「現在進行中（今週/今月/今年）」のカードを並列表示。

振り返り入力項目:

期間の指標サマリー（合計時間、完了数、進捗率）

目標 (Goal) / 実績 (Result)

よかった点 (Keep) / 反省点・改善策 (Problem / Try)

気分・達成感 (Mood): 5 段階のアイコン評価選択

8. 設定画面
   アプリ全体のマスタデータを管理する画面です。

タスク種別管理: タスク種別（例：本、YouTube、動画、記事等）の追加・インプレース編集・削除。

カテゴリ / 技術要素管理: 技術カテゴリ（例：TypeScript, Python, Java 等）の追加・編集・削除。

テーマ設定: ライトモード / ダークモードのデフォルト設定。

9. ダイアログ・モーダル仕様
   9.1 親タスク（グループ）登録・編集ダイアログ
   項目名 種別 説明 / 入力ルール
   タイトル テキスト 【必須】親タスク名
   メモ テキストエリア 自由記述
   マイルストーン期間 日付表示 子タスクから自動計算された planned_start, planned_end, actual_start, actual_end を表示（手動編集不可・自動算出バッジを表示）
   ボタン群 ボタン 「削除（編集時のみ）」「キャンセル」「保存」
   9.2 子タスク（実作業）詳細・編集ダイアログ
   項目名 種別 説明 / 入力ルール
   タイトル テキスト 【必須】タスク名（例：Chapter 2 シンタックス）
   親タスク (グループ) セレクト 紐づける親タスクを選択
   種別 / ステータス / カテゴリ セレクト マスタから選択 / 未着手・進行中・完了
   紐づく書籍 セレクト 書籍マスタの登録書籍から選択
   進んだページ / 章数 (progress_value) 数値 （v2.21.27 追加） 書籍紐づき時に有効化。今回の作業量（未入力時は 1）
   予定日 / 実績日 日付選択 予定開始・終了日 / 実績開始・終了日
   予定時間 / 実績時間 (h) 数値 小数点入力可。実績時間は学習ログ（study_logs）の増分計算に使用
   メモ テキストエリア 詳細説明
   孫タスク（ステップエリア） リスト ステップ追加フォーム、完了チェックボックス、個別の「編集」「削除」ボタン
   9.3 孫タスク（ステップ）登録・編集・完了時ダイアログ
   ステップ詳細ダイアログ: 個別ステップのメモや細かな作業時間を設定・更新。

全ステップ完了時ポップアップ: 孫タスクが全件完了した際、「親/子タスクのステータスも『完了』に変更しますか？」とユーザーに確認するモーダルを起動。
