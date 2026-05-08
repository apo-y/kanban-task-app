import { createClient } from "@supabase/supabase-js";

// サーバーサイド専用クライアント
// NEXT_PUBLIC_ プレフィックスなし = ブラウザには渡らない
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を .env.local に設定してください"
  );
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // サーバーサイドではセッションを永続化しない
    persistSession: false,
    autoRefreshToken: false,
  },
});
