-- 看板ボード風タスク管理アプリ - データベーススキーマ
-- Supabase の SQL Editor でこのファイルの内容を実行してください。

-- 拡張機能（gen_random_uuid を使うために必要）
create extension if not exists "pgcrypto";

-- =========================================
-- users テーブル
-- =========================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  created_at timestamp with time zone default now()
);

-- =========================================
-- tasks テーブル
-- =========================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  completed boolean default false,
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =========================================
-- comments テーブル
-- =========================================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  author_name text not null,
  author_id uuid references public.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists comments_task_id_idx on public.comments(task_id);
create index if not exists comments_author_id_idx on public.comments(author_id);

-- =========================================
-- テーブルアクセス権限（RLS はこの上に重ねて適用されるため両方必要）
-- =========================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.users, public.tasks, public.comments
  to anon, authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;

-- =========================================
-- Row Level Security（学習用途のため全操作を許可）
-- =========================================
alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Allow all on users" on public.users;
create policy "Allow all on users" on public.users
  for all using (true) with check (true);

drop policy if exists "Allow all on tasks" on public.tasks;
create policy "Allow all on tasks" on public.tasks
  for all using (true) with check (true);

drop policy if exists "Allow all on comments" on public.comments;
create policy "Allow all on comments" on public.comments
  for all using (true) with check (true);

-- =========================================
-- リアルタイム更新を有効化（未登録の場合のみ追加）
-- =========================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;
end $$;

-- =========================================
-- 初期データ（要件定義書 4.3 の初期ユーザー）
-- =========================================
insert into public.users (name, email)
values
  ('田中太郎', 'tanaka@example.com'),
  ('佐藤花子', 'sato@example.com'),
  ('山田次郎', 'yamada@example.com')
on conflict (email) do nothing;
