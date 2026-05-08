"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getAuthHeaders } from "@/lib/fetchHelpers";
import type { Comment } from "@/lib/types";

export function useComments(taskId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);

  // コメント一覧取得: GET /api/comments?taskId=xxx
  const fetchComments = useCallback(async () => {
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/comments?taskId=${taskId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setComments(data as Comment[]);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "コメントの取得に失敗しました");
      }
    } catch {
      setError("ネットワークエラーが発生しました");
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Realtime subscription（WebSocket は引き続き Supabase クライアントを使用）
  useEffect(() => {
    const channel = supabase
      .channel(`comments:${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setComments((prev) => [...prev, payload.new as Comment]);
          } else if (payload.eventType === "DELETE") {
            setComments((prev) =>
              prev.filter((c) => c.id !== (payload.old as Comment).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  // コメント投稿: POST /api/comments
  // author_id / author_name はサーバーサイドで取得するため引数から削除
  const addComment = async (text: string) => {
    if (!text.trim()) return;
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/comments", {
        method: "POST",
        headers,
        body: JSON.stringify({ text, taskId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "コメントの投稿に失敗しました");
      }
    } catch {
      setError("ネットワークエラーが発生しました");
    }
  };

  return { comments, error, addComment };
}
