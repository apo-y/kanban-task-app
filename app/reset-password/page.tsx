"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

type Step = "checking" | "mfa" | "password";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("checking");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMfa = async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp?.find((f) => f.status === "verified");
      if (totp) {
        setFactorId(totp.id);
        setStep("mfa");
      } else {
        setStep("password");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        checkMfa();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) checkMfa();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: mfaCode,
    });

    if (error) {
      setError("コードが正しくありません。もう一度お試しください。");
      setLoading(false);
    } else {
      setStep("password");
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordTouched(true);

    if (!isPasswordValid(password)) {
      setError("パスワードが要件を満たしていません。");
      return;
    }

    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("updateUser error:", error);
      const msg = error.message.includes("same password")
        ? "現在のパスワードと同じパスワードは設定できません。"
        : `パスワードの更新に失敗しました。(${error.message})`;
      setError(msg);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
  };

  const Layout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );

  if (step === "checking") {
    return (
      <Layout>
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
          <p className="text-gray-600 text-sm">認証情報を確認中...</p>
          <p className="text-gray-400 text-xs">
            このページはパスワードリセットメールのリンクからのみアクセスできます。
          </p>
          <Link
            href="/forgot-password"
            className="block w-full py-3 px-4 text-center bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            パスワードリセットメールを再送信
          </Link>
        </div>
      </Layout>
    );
  }

  if (step === "mfa") {
    return (
      <Layout>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">2段階認証</h1>
          <p className="text-sm text-gray-500 mt-1">パスワードを変更するには認証が必要です</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleMfaVerify} className="space-y-4">
            <div>
              <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700 mb-1.5">
                認証コード（6桁）
              </label>
              <input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                required
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center tracking-widest text-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                Google Authenticatorに表示されている6桁のコードを入力してください
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || mfaCode.length !== 6}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "確認中..." : "確認してパスワード変更へ"}
            </button>
          </form>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">新しいパスワードを設定</h1>
        <p className="text-sm text-gray-500 mt-1">新しいパスワードを入力してください</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              新しいパスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordTouched(true); }}
              required
              autoFocus
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {passwordTouched && (
              <ul className="mt-2 space-y-1">
                {passwordRules.map((rule) => (
                  <li key={rule.label} className={`text-xs flex items-center gap-1 ${rule.test(password) ? "text-green-600" : "text-gray-400"}`}>
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
            {loading ? "更新中..." : "パスワードを更新"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
