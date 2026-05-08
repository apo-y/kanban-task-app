import { supabase } from "./supabase";
import type { User } from "./types";

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const authUser = session.user;
  const email = authUser.email ?? null;
  const name =
    authUser.user_metadata?.full_name ??
    email?.split("@")[0] ??
    "ユーザー";

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (data) return data as User;

  // usersテーブルに未登録の場合は作成を試みる
  const { data: newUser } = await supabase
    .from("users")
    .insert({ id: authUser.id, name, email })
    .select()
    .single();

  // INSERT失敗時もセッションは有効なので、最低限のUserオブジェクトを返す
  // （無限リダイレクトを防ぐため）
  return (newUser as User | null) ?? {
    id: authUser.id,
    name,
    email: email ?? "",
    created_at: new Date().toISOString(),
  } as User;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
