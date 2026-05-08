import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getSessionUser } from "@/lib/auth-server";
import { checkRateLimit } from "@/lib/rate-limit";

// DELETE /api/comments/[id]
// コメントを削除する（投稿者のみ）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // レート制限: 1分間に30件まで
  const rl = checkRateLimit(`comments:delete:${user.id}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってから再試行してください。" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { id } = await params;

  // .eq("author_id", user.id) により、自分が投稿したコメントのみ削除できる
  const { error, count } = await supabaseServer
    .from("comments")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (count === 0) {
    return NextResponse.json(
      { error: "コメントが見つからないか、権限がありません" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
