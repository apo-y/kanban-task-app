"use client";

import { useState } from "react";
import { useComments } from "@/hooks/useComments";

type Props = {
  taskId: string;
};

export default function CommentSection({ taskId }: Props) {
  const { comments, error, addComment } = useComments(taskId);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    await addComment(text);
    setText("");
    setLoading(false);
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">コメント</p>

      {/* エラー表示 */}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mb-2">{error}</p>
      )}

      {/* コメント一覧 */}
      <div className="space-y-1.5 mb-2">
        {comments.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">コメントはありません</p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="bg-gray-100 dark:bg-gray-600 rounded-lg px-3 py-2"
            >
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {c.author_name}
              </span>
              <p className="text-xs text-gray-700 dark:text-gray-200 mt-0.5">{c.text}</p>
            </div>
          ))
        )}
      </div>

      {/* コメント入力欄 */}
      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="コメントを入力..."
          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-300 placeholder-gray-400 dark:placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="px-2.5 py-1.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          追加
        </button>
      </form>
    </div>
  );
}
