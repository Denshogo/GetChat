# GetChat

司法書士試験向けの学習支援AI 初期版です。

## OpenAI セットアップ

このアプリの `/api/ai` はサーバー側で `process.env.OPENAI_API_KEY` を読みます。
`.env.example` はテンプレートです。自動読込はしていないため、起動前に shell で環境変数を設定してください。

```bash
cd /Users/denndoshogo/Downloads/getchat
export OPENAI_API_KEY="sk-..."
```

モデルはサーバー側で `gpt-5-mini` に固定しています。
`OPENAI_API_KEY` が未設定の場合、`/api/ai` は mock provider にフォールバックします。

## 起動方法

```bash
cd /Users/denndoshogo/Downloads/getchat
npm run serve
```

ブラウザで `http://localhost:8000/app/` を開きます。

## explain モード疎通確認

サーバー起動後、別ターミナルで以下を実行します。

```bash
curl -s http://127.0.0.1:8000/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "explain",
    "subject": "民法",
    "user_message": "無権代理を説明して",
    "active_quiz_data": null
  }'
```

`meta.provider` が `openai` なら実 API 接続、`mock` ならフォールバック動作です。

## 実装済み機能（v0.6 初期版）

- AI統合チャット
  - 回答先頭に `【検索用キーワード】` を表示
  - 回答末尾に `課題追加` / `関連問題` 導線
- 課題管理ボックス
  - 手入力追加、一覧表示、重複登録ガード
  - 完了チェック、完了時のみ `確認問題を解く`
- AI作問3ルート
  - 課題カード起点
  - チャット自然言語起点（`〇〇の問題を出して`）
  - ヘッダーの `🎲 ランダム腕試し`
- 問題カードモーダル
  - 択一、回答選択、採点、正答表示、解説表示
  - 長文問題をチャットに流さない設計
- 科目選択
  - 主要10科目のチップ
  - チャット応答・作問スコープへ反映
- ポイント / 山ランク
  - 初回正解と不正解後解説確認で加点
  - 閾値定数（0/20/50/100/200）
  - 同一問題の重複加点抑制
- 永続化
  - `localStorage` で課題・進捗を保存

## 構成（4層）

- UI層
  - `/Users/denndoshogo/Downloads/getchat/app/index.html`
  - `/Users/denndoshogo/Downloads/getchat/app/styles.css`
  - `/Users/denndoshogo/Downloads/getchat/app/src/components/`
- 状態管理層
  - `/Users/denndoshogo/Downloads/getchat/app/src/state/appStore.js`
- ドメイン / ロジック層
  - `/Users/denndoshogo/Downloads/getchat/app/src/features/`
  - `/Users/denndoshogo/Downloads/getchat/app/src/services/`
- インフラ / 永続化層
  - `/Users/denndoshogo/Downloads/getchat/app/src/repositories/`
  - `/Users/denndoshogo/Downloads/getchat/app/src/storage.js`

エントリポイント:
- `/Users/denndoshogo/Downloads/getchat/app/src/app.js`（画面オーケストレーション）

## 開発コマンド

```bash
npm run check      # app配下のJS構文チェック
npm run build      # appをdistへコピー
npm run typecheck  # TS未導入のためスキップ
npm run smoke      # 主要ロジックのスモークテスト
```

## 注意（暫定実装）

- `OPENAI_API_KEY` 未設定時のみ mock provider を利用します。
- 画像入力UIは未実装ですが、`attachments` 受け口は用意済みです。
- 永続化は初期版として `localStorage` を採用しています（将来DB移行前提）。
