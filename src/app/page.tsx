"use client";

import { isSupabaseConfigured } from "@/lib/supabase";
import { useLocalUser } from "@/lib/useLocalUser";
import Header from "@/components/Header";
import LoginScreen from "@/components/LoginScreen";
import KanbanBoard from "@/components/KanbanBoard";

export default function Home() {
  const { user, login, logout } = useLocalUser();

  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  if (!user) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white">
      <Header user={user} onLogout={logout} onUserUpdate={login} />
      <KanbanBoard currentUser={user} />
    </div>
  );
}

function SetupNotice() {
  return (
    <main className="flex flex-1 items-center justify-center bg-white p-6">
      <div className="max-w-lg rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-900 shadow-sm">
        <h1 className="mb-2 text-lg font-bold">Supabase の設定が必要です</h1>
        <p className="text-sm leading-relaxed">
          <code>.env.local</code> に <code>NEXT_PUBLIC_SUPABASE_URL</code> と{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> を設定し、
          <code>supabase/schema.sql</code> を Supabase の SQL Editor で実行してから、
          開発サーバーを再起動してください。詳しい手順は README.md を参照してください。
        </p>
      </div>
    </main>
  );
}
