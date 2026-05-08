import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-key";

// Cookie ベースのストレージアダプター
// ミドルウェアがサーバーサイドでセッションを検証できるよう、
// デフォルトの localStorage の代わりに Cookie に保存する
function cookieStorage() {
  return {
    getItem(key: string): string | null {
      if (typeof document === "undefined") return null;
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = document.cookie.match(
        new RegExp(`(?:^|; )${escaped}=([^;]*)`)
      );
      return match ? decodeURIComponent(match[1]) : null;
    },
    setItem(key: string, value: string): void {
      if (typeof document === "undefined") return;
      const maxAge = 60 * 60 * 24 * 7; // 7日
      document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    },
    removeItem(key: string): void {
      if (typeof document === "undefined") return;
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    },
  };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: cookieStorage(),
    persistSession: true,
    autoRefreshToken: true,
  },
});
