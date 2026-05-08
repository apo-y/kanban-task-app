"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasExchanged = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // React StrictMode の二重実行対策：ref で一度だけ実行する
      if (hasExchanged.current) return;
      hasExchanged.current = true;

      const code = searchParams.get("code");
      // Supabase は PKCE パスワードリセット時に type=recovery をクエリに付与する
      const urlType = searchParams.get("type");

      // Implicit Flow: ハッシュに type=recovery が含まれる場合
      if (!code) {
        const hash = typeof window !== "undefined"
          ? new URLSearchParams(window.location.hash.slice(1))
          : null;
        if (hash?.get("type") === "recovery") {
          localStorage.removeItem("pw_reset_pending");
          router.push("/reset-password");
          return;
        }
        router.push("/login");
        return;
      }

      // PKCE リカバリーフロー: URL の type=recovery で確実に判定する。
      // localStorage フラグのみに頼ると、30分以内の Google OAuth ログインで
      // 誤って /reset-password へリダイレクトしてしまうバグを防ぐ。
      if (urlType === "recovery") {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        localStorage.removeItem("pw_reset_pending");
        if (error) {
          console.error("認証コードの交換に失敗しました:", error.message);
          router.push("/login");
          return;
        }
        router.push("/reset-password");
        return;
      }

      // OAuth / メールログインなど recovery 以外のフロー:
      // 古い pw_reset_pending フラグは必ずここでクリアする
      localStorage.removeItem("pw_reset_pending");

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("認証コードの交換に失敗しました:", error.message);
        router.push("/login");
        return;
      }

      const session = data.session;

      if (session?.user) {
        const authUser = session.user;
        const email = authUser.email!;
        const name =
          authUser.user_metadata?.full_name ?? email.split("@")[0];

        // emailでusersテーブルを確認し、なければ新規登録
        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .single();

        if (!existing) {
          const { error: insertError } = await supabase
            .from("users")
            .insert({ id: authUser.id, name, email });
          if (insertError) {
            console.error("ユーザー登録に失敗しました:", insertError.message);
          }
        }
      }

      // MFAが有効な場合はAAL2への昇格が必要かチェックする
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.nextLevel === "aal2" && aalData.nextLevel !== aalData.currentLevel) {
        router.push("/mfa/verify");
      } else {
        router.push("/");
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-gray-500 text-sm">認証中...</div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-gray-500 text-sm">読み込み中...</div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
