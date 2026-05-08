import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { User as AuthUser } from "@supabase/supabase-js";

// リクエストの Authorization ヘッダーからアクセストークンを取得し
// Supabase で検証してユーザー情報を返す
export async function getSessionUser(
  request: NextRequest
): Promise<AuthUser | null> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) return null;

  // anon key でトークンの正当性を検証（DB 操作はしない）
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user;
}
