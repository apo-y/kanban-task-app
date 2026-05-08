import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getSessionUser } from "@/lib/auth-server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Task } from "@/lib/types";

// GET /api/tasks
// 自分のタスク一覧を取得する
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data, error } = await supabaseServer
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as Task[]);
}

// POST /api/tasks
// 新しいタスクを追加する
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // レート制限: 1分間に30件まで
  const rl = checkRateLimit(`tasks:post:${user.id}`, 30, 60_000);
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

  const { text } = body;

  // サーバーサイドバリデーション
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "テキストは必須です" }, { status: 400 });
  }
  if (text.trim().length > 500) {
    return NextResponse.json(
      { error: "テキストは500文字以内で入力してください" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseServer
    .from("tasks")
    .insert({
      text: text.trim(),
      completed: false,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as Task, { status: 201 });
}
