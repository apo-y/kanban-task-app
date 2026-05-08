"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DarkModeToggle from "@/components/DarkModeToggle";


// パスワード要件チェック
const passwordRules = [
  { label: "8文字以上",         test: (v: string) => v.length >= 8 },
  { label: "大文字を含む",       test: (v: string) => /[A-Z]/.test(v) },
  { label: "小文字を含む",       test: (v: string) => /[a-z]/.test(v) },
  { label: "数字を含む",         test: (v: string) => /[0-9]/.test(v) },
  { label: "記号を含む (!@#$…)", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

function isPasswordValid(v: string) {
  return passwordRules.every((r) => r.test(v));
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) router.push("/");
    };
    checkSession();
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordTouched(true);

    if (!isPasswordValid(password)) {
      setError("パスワードが要件を満たしていません。");
      return;
    }

    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) {
      if (error.message === "User already registered") {
        setError("このメールアドレスはすでに登録されています。ログインページからサインインしてください。");
      } else if (error.message.includes("Email rate limit exceeded") || error.message.includes("too_many_requests")) {
        setError("メール送信の上限に達しました。しばらく待ってからお試しください。");
      } else if (error.message.includes("invalid") && error.message.includes("email")) {
        setError("メールアドレスの形式が正しくありません。");
      } else if (error.message.includes("signup_disabled")) {
        setError("現在アカウント登録を受け付けていません。");
      } else {
        setError("アカウントの作成に失敗しました。もう一度お試しください。");
      }
      setLoading(false);
      return;
    }

    // メール確認不要の場合はそのままログイン状態
    if (data.session) {
      const authUser = data.user!;
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("id", authUser.id)
        .single();
      if (!existing) {
        await supabase
          .from("users")
          .insert({ id: authUser.id, name, email, phone: null });
      }
      router.push("/");
    } else {
      // 確認メール送信済み
      setSignupDone(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <DarkModeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">アカウントを作成</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">タスク管理ボードへようこそ</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {signupDone ? (
            <div className="space-y-4 text-center">
              <p className="text-lg font-bold text-gray-800 dark:text-gray-100">確認メールを送信しました</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                メールに記載されたリンクをクリックして登録を完了してください。
              </p>
              <Link
                href="/login"
                className="block w-full py-3 px-4 text-center bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                ログインページへ戻る
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">お名前</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="山田 太郎"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">メールアドレス</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">パスワード</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordTouched(true); }}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {passwordTouched && (
                  <ul className="mt-2 space-y-1">
                    {passwordRules.map((rule) => (
                      <li key={rule.label} className={`text-xs flex items-center gap-1 ${rule.test(password) ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
                        <span>{rule.test(password) ? "✓" : "○"}</span>
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? "登録中..." : "アカウントを作成"}
              </button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                すでにアカウントをお持ちの方は{" "}
                <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  ログイン
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
