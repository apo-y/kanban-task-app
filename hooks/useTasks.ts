"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getAuthHeaders } from "@/lib/fetchHelpers";
import type { Task } from "@/lib/types";

export function useTasks(userId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // タスク一覧取得: GET /api/tasks
  const fetchTasks = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/tasks", { headers });
      if (res.ok) {
        const data = await res.json();
        setTasks(data as Task[]);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "タスクの取得に失敗しました");
      }
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Realtime subscription（WebSocket は引き続き Supabase クライアントを使用）
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`tasks:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) => [...prev, payload.new as Task]);
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Task).id ? (payload.new as Task) : t
              )
            );
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) =>
              prev.filter((t) => t.id !== (payload.old as Task).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // タスク追加: POST /api/tasks
  const addTask = async (text: string) => {
    if (!userId || !text.trim()) return;
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers,
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "タスクの追加に失敗しました");
      }
    } catch {
      setError("ネットワークエラーが発生しました");
    }
  };

  // タスク更新（完了状態の切り替え）: PATCH /api/tasks/[id]
  const toggleTask = async (id: string, completed: boolean) => {
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "タスクの更新に失敗しました");
      }
    } catch {
      setError("ネットワークエラーが発生しました");
    }
  };

  // タスク削除: DELETE /api/tasks/[id]
  const deleteTask = async (id: string) => {
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "タスクの削除に失敗しました");
      }
    } catch {
      setError("ネットワークエラーが発生しました");
    }
  };

  return { tasks, loading, error, addTask, toggleTask, deleteTask };
}
