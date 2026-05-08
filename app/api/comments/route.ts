import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getSessionUser } from "@/lib/auth-server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Comment } from "@/lib/types";

// GET /api/comments?taskId=xxx
// 指定タスクのコメント一覧を取得する（認証済みユーザー全員が読める）
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const taskId = request.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "taskId は必須です" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as Comment[]);
}

// POST /api/comments
// コメントを投稿する
// author_name はクライアントから受け取らず、サーバーで users テーブルから取得する
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // レート制限: 1分間に20件まで
  const rl = checkRateLimit(`comments:post:${user.id}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってから再試行してください。" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const { text, taskId } = body;

  // サーバーサイドバリデーション
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "コメント本文は必須です" }, { status: 400 });
  }
  if (text.trim().length > 1000) {
    return NextResponse.json(
      { error: "コメントは1000文字以内で入力してください" },
      { status: 400 }
    );
  }
  if (!taskId || typeof taskId !== "string") {
    return NextResponse.json({ error: "taskId は必須です" }, { status: 400 });
  }

  // author_name をサーバーで取得（クライアントの値を信頼しない）
  const { data: userData, error: userError } = await supabaseServer
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: "ユーザー情報の取得に失敗しました" }, { status: 500 });
  }

  const { data, error } = await supabaseServer
    .from("comments")
    .insert({
      text: text.trim(),
      author_id: user.id,
      author_name: userData.name, // サーバーで取得した名前を使用
      task_id: taskId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as Comment, { status: 201 });
}
