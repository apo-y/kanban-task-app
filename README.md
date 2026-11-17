# 看板ボード風タスク管理アプリ

要件定義書（`../看板ボード風タスク管理アプリ　要件定義書.docx`）に基づいて実装した、Next.js + Supabase 製のカンバンボード風タスク管理アプリです。

## 技術スタック

- Next.js（App Router）/ TypeScript
- Tailwind CSS
- Supabase（PostgreSQL・データ永続化・リアルタイム更新）

## 機能

- タスクの追加・完了切り替え・削除（即削除）
- 「未完了」「完了済み」の2カラムのカンバンボード表示、カード形式・ドラッグ&ドロップでの移動
- ユーザー選択によるログイン／名前・メールアドレスでの新規登録／ログアウト、ログイン状態はローカルストレージで保持
- プロフィール（名前・メールアドレス）の編集
- ユーザーごとのタスク分離（マルチユーザー対応）
- タスクカードごとのコメント表示・追加
- Supabase によるデータ永続化、複数タブ間のリアルタイム反映

## セットアップ手順

### 1. パッケージのインストール

```bash
npm install
```

### 2. Supabase プロジェクトを準備する

1. [Supabase](https://supabase.com/) でアカウントを作成し、新しいプロジェクトを作成します。
2. プロジェクトの `SQL Editor` を開き、[`supabase/schema.sql`](supabase/schema.sql) の内容を貼り付けて実行します。
   - `users` / `tasks` / `comments` の3テーブルが作成されます。
   - 全テーブルに RLS（Row Level Security）を有効化し、学習用として全操作を許可するポリシーを設定します。
   - リアルタイム更新（`supabase_realtime` パブリケーション）を有効化します。
   - 初期ユーザー（田中太郎・佐藤花子・山田次郎）を投入します。

### 3. 環境変数を設定する

`.env.local.example` を `.env.local` としてコピーし、Supabase プロジェクトの `Settings > API` にある値を設定します。

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

`.env.local` は Git にコミットしないでください（`.gitignore` で除外済みです）。

### 4. 開発サーバーを起動する

```bash
npm run dev
```

[http://localhost:3001](http://localhost:3001) を開いて動作を確認します。

## 注意事項（要件定義書に基づく除外範囲）

- メール確認（Confirm email）は無効化しています。
- パスワードによる認証は行わず、ユーザーの選択（ドロップダウン）による簡易ログインです（`users` テーブルにパスワード列はありません）。
- 本番環境へのデプロイ、CI/CD、テストコード、多言語対応、優先度・期限管理、ファイル添付機能は対象外です。
- RLS は学習用に全操作を許可する設定です。本番公開する場合はより厳格な認証・認可が必要です。

## ディレクトリ構成

```
src/
  app/
    layout.tsx             # ルートレイアウト（フォント・メタデータ）
    page.tsx               # ログイン状態に応じて画面を切り替えるエントリーポイント
    globals.css            # Tailwind CSS の読み込みとベーススタイル
  components/
    LoginScreen.tsx        # ログイン／新規登録
    Header.tsx             # ヘッダー（ようこそ表示・プロフィール編集・ログアウト）
    EditProfileModal.tsx   # プロフィール（名前・メールアドレス）編集モーダル
    KanbanBoard.tsx        # タスクの追加・更新・削除・リアルタイム購読
    TaskColumn.tsx         # カラム（未完了／完了済み）とドロップ処理
    TaskCard.tsx           # タスクカード（完了切り替え・削除・コメント・ドラッグ）
  lib/
    supabase.ts            # Supabase クライアント
    board.ts               # データ取得（ユーザー一覧・タスクとコメント）
    types.ts               # User / Task / Comment 型定義
    useLocalUser.ts        # ログイン状態をローカルストレージで保持するフック
supabase/
  schema.sql               # テーブル・RLS・リアルタイム設定・初期データ
```
