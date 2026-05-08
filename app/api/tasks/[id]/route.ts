import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getSessionUser } from "@/lib/auth-server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Task } from "@/lib/types";

// PATCH /api/tasks/[id]
// タスクを更新する（自分のタスクのみ）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // レート制限: 1分間に60件まで
  const rl = checkRateLimit(`tasks:patch:${user.id}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってから再試行してください。" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  // 許可するフィールドのみ受け付ける（不正なフィールドの上書きを防ぐ）
  const allowedFields: Partial<Pick<Task, "text" | "completed">> = {};
  if (typeof body.completed === "boolean") {
    allowedFields.completed = body.completed;
  }
  if (typeof body.text === "string") {
    const trimmed = body.text.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "テキストは空にできません" }, { status: 400 });
    }
    if (trimmed.length > 500) {
      return NextResponse.json(
        { error: "テキストは500文字以内で入力してください" },
        { status: 400 }
      );
    }
    allowedFields.text = trimmed;
  }

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json({ error: "更新するフィールドがありません" }, { status: 400 });
  }

  // .eq("user_id", user.id) により、自分のタスクのみ更新できる
  const { data, error } = await supabaseServer
    .from("tasks")
    .update(allowedFields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "タスクが見つからないか、権限がありません" },
      { status: 404 }
    );
  }

  return NextResponse.json(data as Task);
}

// DELETE /api/tasks/[id]
// タスクを削除する（自分のタスクのみ）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // レート制限: 1分間に60件まで
  const rlDel = checkRateLimit(`tasks:delete:${user.id}`, 60, 60_000);
  if (!rlDel.allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってから再試行してください。" },
      { status: 429, headers: { "Retry-After": String(rlDel.retryAfter) } }
    );
  }

  const { id } = await params;

  // .eq("user_id", user.id) により、自分のタスクのみ削除できる
  const { error, count } = await supabaseServer
    .from("tasks")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (count === 0) {
    return NextResponse.json(
      { error: "タスクが見つからないか、権限がありません" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
