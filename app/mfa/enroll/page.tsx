"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Step = "loading" | "already_enrolled" | "qr" | "verify" | "done";

export default function MfaEnrollPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp?.find((f) => f.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        setStep("already_enrolled");
        return;
      }

      // 未検証の既存ファクターがあれば再利用、なければ新規登録
      const unverified = factors?.totp?.find((f) => (f.status as string) === "unverified");
      if (unverified) {
        // 未完了の登録をクリーンアップして新規作成
        await supabase.auth.mfa.unenroll({ factorId: unverified.id });
      }

      await startEnrollment();
    };
    init();
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEnrollment = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "タスク管理ボード",
      friendlyName: "Google Authenticator",
    });
    if (error || !data) {
      setError("MFAの設定を開始できませんでした: " + (error?.message ?? "不明なエラー"));
      setStep("qr");
      return;
    }
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setFactorId(data.id);
    setStep("qr");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (error) {
      setError("コードが正しくありません。Google Authenticatorのコードを確認してください。");
      setLoading(false);
    } else {
      setStep("done");
      setLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!factorId) return;
    if (!confirm("Google Authenticatorの2段階認証を無効にしますか？")) return;
    setLoading(true);

    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      setError("削除に失敗しました: " + error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  // ── Loading ──────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-500 text-sm">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">2段階認証の設定</h1>
          <p className="text-sm text-gray-500 mt-1">Google Authenticatorで保護する</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* ── 登録済み ── */}
          {step === "already_enrolled" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800">2段階認証が有効です</p>
                  <p className="text-xs text-green-600 mt-0.5">Google Authenticatorでログインを保護しています</p>
                </div>
              </div>

              <button
                onClick={() => router.push("/")}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                ホームに戻る
              </button>

              <button
                onClick={handleUnenroll}
                disabled={loading}
                className="w-full py-3 px-4 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {loading ? "処理中..." : "2段階認証を無効にする"}
              </button>
            </div>
          )}

          {/* ── QRコード表示 ── */}
          {step === "qr" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">ステップ 1：アプリをインストール</p>
                <p className="text-sm text-gray-500">
                  スマートフォンに <span className="font-semibold text-gray-700">Google Authenticator</span> をインストールしてください。
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">ステップ 2：QRコードをスキャン</p>
                <p className="text-sm text-gray-500">
                  Google Authenticatorでアプリを開き、「+」→「QRコードをスキャン」を選択して下のQRコードを読み込んでください。
                </p>
                {qrCode ? (
                  <div className="flex justify-center p-4 bg-white border-2 border-gray-200 rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCode} alt="Google Authenticator QRコード" className="w-48 h-48" />
                  </div>
                ) : (
                  <div className="flex justify-center p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                    <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-sm">
                      QRコードを読み込み中...
                    </div>
                  </div>
                )}
              </div>

              {/* 手動入力用シークレット */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                >
                  {showSecret ? "シークレットキーを隠す" : "QRコードが読めない場合はこちら（手動入力）"}
                </button>
                {showSecret && secret && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">シークレットキー（手動入力用）</p>
                    <p className="font-mono text-sm text-gray-800 break-all select-all">{secret}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep("verify")}
                disabled={!qrCode}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                スキャンしました → 次へ
              </button>
            </div>
          )}

          {/* ── コード確認 ── */}
          {step === "verify" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setStep("qr")}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <p className="text-sm font-medium text-gray-700">ステップ 3：認証コードを確認</p>
              </div>
              <p className="text-sm text-gray-500">
                Google Authenticatorに表示されている6桁のコードを入力して、設定を完了してください。
              </p>

              <form onSubmit={handleVerify} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center tracking-widest text-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "確認中..." : "2段階認証を有効にする"}
                </button>
              </form>
            </div>
          )}

          {/* ── 完了 ── */}
          {step === "done" && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">設定完了！</p>
                <p className="text-sm text-gray-500 mt-1">
                  2段階認証が有効になりました。次回ログイン時からGoogle Authenticatorのコードが必要になります。
                </p>
              </div>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                ホームに戻る
              </button>
            </div>
          )}

          {/* 戻るリンク */}
          {(step === "qr" || step === "verify") && (
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <button
                onClick={() => router.push("/")}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                後で設定する
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
