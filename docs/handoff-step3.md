# 引き継ぎメモ：AIDriven School 4ヶ月目課題

## 再開時にAIに伝えること

このファイルを添付して「ステップ⑤（Vercelデプロイ確認）から続けてください」と伝えてください。

---

## プロジェクト概要

**新規事業進捗管理ダッシュボード**
- リポジトリ: `~/src/workspace-ui-kit`
- GitHub: `https://github.com/tahichanTK/workspace-ui-kit`
- Vercel: `project-om9y9.vercel.app`（デプロイ済み・公開中）
- Vercel プロジェクト名: `tk-newbiz/workspace-ui-kit`
- 技術スタック: Next.js 16 / React 19 / TypeScript / Tailwind CSS / shadcn/ui / Zod / Neon（PostgreSQL）

---

## 課題のゴール

**AIDriven School 4ヶ月目「自分の画面に記憶を持たせる」**

1. データベース（Neon）と連携してリロードでもデータが消えないようにする
2. Vercelに公開して別の端末・他の人からも見られるようにする
3. 「どのデータをどこに、なぜ保存したか」を自分の言葉で説明できるようにする

---

## 完了済みのステップ

### ✅ ステップ① 何をどこに保存するか決める

**DBに入れるデータ（5テーブル）：**

```
themes               ← テーマ一覧・フェーズ・ステータス
kpi_snapshots        ← KPI値（themeId × フェーズ × カテゴリ × KPI項目）
weekly_summaries     ← 週次サマリーの親（themeId × 週ラベル）
weekly_summary_items ← 週次サマリーの箇条書き1行ごと
ai_suggestions       ← AI提案（themeId × 優先度）
```

**なぜこの設計か（発表時に使う説明）：**
- `themes` を軸に他のテーブルが紐づく（1テーマに複数週・複数KPIが積み上がる）
- JSONファイルは「今日の状態」しか持てないがDBは「歴史と学び」を持てる
- 1KPI・1サマリー項目を1行に展開することで、後から条件検索・部分更新できる

**DBには入れないデータ：**
- `workspace.json`（ダッシュボード名・アイコン）→ ほぼ変わらないのでリポジトリに残す

### ✅ ステップ② データベースの箱を用意する

- **Neon** データベース作成済み（プロジェクト名: neon-celeste-cushion）
- Vercelプロジェクトと接続済み（Production環境の環境変数に設定済み）
- ローカルの `.env.local` に `DATABASE_URL` を手動で追加済み

```bash
# 環境変数の場所
~/src/workspace-ui-kit/.env.local
# DATABASE_URL（Neon接続文字列）が入っている
```

### ✅ ステップ③ 保存の仕組みを作る

**実装した内容：**

1. `@neondatabase/serverless` パッケージをインストール
2. `lib/db.ts` — Neon接続クライアント
3. `scripts/setup-db.ts` — テーブル作成＋JSONデータ投入スクリプト（`npm run setup-db` で実行）
4. `lib/db-queries.ts` — DBからデータを読み取る関数群（`getThemes` / `getKpiMap` / `getWeeklySummaries` / `getAiSuggestions`）
5. `app/page.tsx` — JSONファイルの代わりにDBクエリ関数を呼び出すよう変更（Server Component）

**重要なファイル：**
```
workspace-ui-kit/
├── lib/
│   ├── db.ts           ← Neon接続
│   ├── db-queries.ts   ← DBクエリ関数
│   └── newbiz-schema.ts ← Zodスキーマ（変更なし）
├── scripts/
│   └── setup-db.ts     ← テーブル作成・シード（再実行可能）
└── app/
    └── page.tsx        ← async Server Component、DBから読み込む
```

### ✅ ステップ④ リロードで消えないか確認する

- `npm run dev` でローカル起動 → `http://localhost:3000` で画面表示を確認
- DBからデータが取得されていることを確認（レスポンス 200）

### ✅ ステップ⑤ Vercelに公開する（コード変更前に完了済み）

- `https://project-om9y9.vercel.app` でアクセス可能
- GitHubのmainブランチにpushすると自動デプロイされる

---

## 次にやること

### ステップ⑤' Vercelで動くか確認する

**やること：**
1. 変更をGitにコミットしてGitHubにpush
2. Vercelが自動デプロイするのを待つ（1〜2分）
3. `https://project-om9y9.vercel.app` を開いてDBのデータが表示されるか確認

```bash
cd ~/src/workspace-ui-kit
git add .
git commit -m "feat: NeonDBからデータを読み込むよう変更"
git push
```

**注意：** VercelのProduction環境にはすでに `DATABASE_URL` が設定されているので、追加作業は不要。

### 発表資料の準備

1. **公開URL**: `https://project-om9y9.vercel.app`
2. **図解URL**: creating-visual-explainers スキルで作成
   - ツールの画面キャプチャ
   - 保持できるようにしたデータ（5テーブル）
   - 保存先と選んだ理由
   - 工夫したポイントと苦戦したポイント（DATABASE_URLのEncrypted問題など）
3. **説明の練習**：「どのデータをどこに、なぜ保存したか」を自分の言葉で

---

## 発表で使える説明メモ

**「なぜNeonを使ったか」**
> JSONファイルはブラウザを閉じると消えるが、NeonはクラウドのDBなので
> 何度リロードしても、別の端末からアクセスしても同じデータが表示される。
> VercelとNeonは同じAWSのリージョンにあるので通信も速い。

**「データをどう分けたか」**
> テーマを中心に、KPI・週次サマリー・AI提案がそれぞれ別のテーブルで紐づく設計。
> JSONでは配列にまとめていたものを、DBでは1行1件に展開した。
> これにより「仮説検証フェーズのKPIだけ見る」などの絞り込みが将来できるようになる。
