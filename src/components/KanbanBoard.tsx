"use client";

import { useEffect, useState, type FormEvent } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { fetchBoard, type BoardData } from "@/lib/board";
import type { Comment, Task, User } from "@/lib/types";
import TaskColumn from "./TaskColumn";

type Props = {
  currentUser: User;
};

export default function KanbanBoard({ currentUser }: Props) {
  const {
    data,
    error: fetchError,
    isLoading,
    mutate,
  } = useSWR(["board", currentUser.id], () => fetchBoard(currentUser.id));

  const [newTaskText, setNewTaskText] = useState("");
  const [actionError, setActionError] = useState("");

  const tasks = data?.tasks ?? [];
  const comments = data?.comments ?? {};
  const errorMessage =
    actionError ||
    (fetchError ? "タスクの取得に失敗しました: " + fetchError.message : "");

  // 別タブでの変更をリアルタイムに反映する（外部システムの変化を購読する effect）
  useEffect(() => {
    const channel = supabase!
      .channel(`kanban-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => mutate(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `author_id=eq.${currentUser.id}`,
        },
        () => mutate(),
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [currentUser.id, mutate]);

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    const text = newTaskText.trim();
    if (!text) return;
    setNewTaskText("");
    setActionError("");

    const { data: inserted, error } = await supabase!
      .from("tasks")
      .insert({ text, user_id: currentUser.id, completed: false })
      .select()
      .single();

    if (error) {
      setActionError("タスクの追加に失敗しました: " + error.message);
      return;
    }

    mutate(
      (current): BoardData | undefined =>
        current && {
          ...current,
          tasks: [...current.tasks, inserted as Task],
        },
      { revalidate: false },
    );
  }

  async function handleToggleComplete(task: Task) {
    const nextCompleted = !task.completed;
    setActionError("");

    mutate(
      (current): BoardData | undefined =>
        current && {
          ...current,
          tasks: current.tasks.map((t) =>
            t.id === task.id ? { ...t, completed: nextCompleted } : t,
          ),
        },
      { revalidate: false },
    );

    const { error } = await supabase!
      .from("tasks")
      .update({
        completed: nextCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    if (error) {
      setActionError("タスクの更新に失敗しました: " + error.message);
      mutate();
    }
  }

  async function handleDeleteTask(taskId: string) {
    setActionError("");

    mutate(
      (current): BoardData | undefined =>
        current && {
          ...current,
          tasks: current.tasks.filter((t) => t.id !== taskId),
        },
      { revalidate: false },
    );

    const { error } = await supabase!.from("tasks").delete().eq("id", taskId);
    if (error) {
      setActionError("タスクの削除に失敗しました: " + error.message);
      mutate();
    }
  }

  async function handleAddComment(taskId: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setActionError("");

    const { data: inserted, error } = await supabase!
      .from("comments")
      .insert({
        text: trimmed,
        author_name: currentUser.name,
        author_id: currentUser.id,
        task_id: taskId,
      })
      .select()
      .single();

    if (error) {
      setActionError("コメントの追加に失敗しました: " + error.message);
      return;
    }

    mutate(
      (current): BoardData | undefined => {
        if (!current) return current;
        const existing = current.comments[taskId] ?? [];
        return {
          ...current,
          comments: {
            ...current.comments,
            [taskId]: [...existing, inserted as Comment],
          },
        };
      },
      { revalidate: false },
    );
  }

  function handleDropOnColumn(taskId: string, completed: boolean) {
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.completed !== completed) {
      handleToggleComplete(task);
    }
  }

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <main className="flex-1 p-6">
      <form onSubmit={handleAddTask} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="新しいタスクを入力..."
          className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          追加
        </button>
      </form>

      {errorMessage && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <p className="text-slate-500">読み込み中...</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TaskColumn
            title="未完了"
            accentColor="bg-amber-400"
            tasks={incompleteTasks}
            comments={comments}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDeleteTask}
            onAddComment={handleAddComment}
            onDropTask={(taskId) => handleDropOnColumn(taskId, false)}
          />
          <TaskColumn
            title="完了済み"
            accentColor="bg-emerald-400"
            tasks={completedTasks}
            comments={comments}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDeleteTask}
            onAddComment={handleAddComment}
            onDropTask={(taskId) => handleDropOnColumn(taskId, true)}
          />
        </div>
      )}
    </main>
  );
}
