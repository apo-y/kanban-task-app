"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useTasks } from "@/hooks/useTasks";
import Header from "@/components/Header";
import AddTaskInput from "@/components/AddTaskInput";
import KanbanBoard from "@/components/KanbanBoard";
import type { User } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // MFA有効ユーザーがAAL2未達の場合は認証画面へ強制リダイレクト
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.nextLevel === "aal2" && aalData.nextLevel !== aalData.currentLevel) {
        router.push("/mfa/verify");
        return;
      }

      setCurrentUser(user);
      setReady(true);
    };
    checkAuth();
  }, [router]);

  const { tasks, loading, error: taskError, addTask, toggleTask, deleteTask } = useTasks(
    currentUser?.id ?? null
  );

  if (!ready || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header user={currentUser} />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* エラーバナー */}
        {taskError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {taskError}
          </div>
        )}

        {/* タスク追加フォーム */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
            新しいタスクを追加
          </p>
          <AddTaskInput onAdd={addTask} />
        </div>

        {/* カンバンボード */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400 dark:text-gray-500">
            タスクを読み込み中...
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        )}
      </main>
    </div>
  );
}
