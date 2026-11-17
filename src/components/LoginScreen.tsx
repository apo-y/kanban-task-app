"use client";

import { useState, type FormEvent } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { supabase } from "@/lib/supabase";
import { fetchUsers } from "@/lib/board";
import type { User } from "@/lib/types";

type Props = {
  onLogin: (user: User) => void;
};

const USERS_KEY = "users";

export default function LoginScreen({ onLogin }: Props) {
  const {
    data: users = [],
    error: usersError,
    isLoading: isLoadingUsers,
  } = useSWR(USERS_KEY, fetchUsers);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveSelectedId = selectedUserId || users[0]?.id || "";
  const displayError =
    formError ||
    (usersError ? "ユーザー一覧の取得に失敗しました: " + usersError.message : "");

  function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    const user = users.find((u) => u.id === effectiveSelectedId);
    if (user) onLogin(user);
  }

  async function handleSignupSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !email.trim()) {
      setFormError("名前とメールアドレスを入力してください");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase!
      .from("users")
      .insert({ name: name.trim(), email: email.trim() })
      .select()
      .single();
    setIsSubmitting(false);

    if (error) {
      setFormError(
        error.code === "23505"
          ? "このメールアドレスは既に登録されています"
          : "登録に失敗しました: " + error.message,
      );
      return;
    }

    if (data) {
      globalMutate(USERS_KEY);
      onLogin(data as User);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-white p-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-slate-800">
          看板ボード風タスク管理
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          {mode === "login" ? "ログインしてください" : "新規登録してください"}
        </p>

        <div className="mb-6 flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md py-2 transition ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md py-2 transition ${
              mode === "signup"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            新規登録
          </button>
        </div>

        {displayError && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {displayError}
          </p>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                ユーザーを選択
              </label>
              <select
                value={effectiveSelectedId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={isLoadingUsers || users.length === 0}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                {isLoadingUsers && <option>読み込み中...</option>}
                {!isLoadingUsers && users.length === 0 && (
                  <option>登録済みユーザーがいません</option>
                )}
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}（{u.email}）
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={!effectiveSelectedId}
              className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ログイン
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                名前
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田太郎"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="taro@example.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "登録中..." : "登録してログイン"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
