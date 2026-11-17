"use client";

import { useState, type DragEvent, type FormEvent } from "react";
import type { Comment, Task } from "@/lib/types";

type Props = {
  task: Task;
  comments: Comment[];
  onToggleComplete: () => void;
  onDelete: () => void;
  onAddComment: (text: string) => void;
};

export default function TaskCard({
  task,
  comments,
  onToggleComplete,
  onDelete,
  onAddComment,
}: Props) {
  const [commentText, setCommentText] = useState("");

  function handleSubmitComment(e: FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(commentText);
    setCommentText("");
  }

  function handleDragStart(e: DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="cursor-grab rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={onToggleComplete}
          className="mt-1 h-4 w-4 shrink-0 accent-indigo-600"
          aria-label="タスクを完了にする"
        />
        <p
          className={`flex-1 break-words text-sm leading-relaxed ${
            task.completed ? "text-slate-400 line-through" : "text-slate-800"
          }`}
        >
          {task.text}
        </p>
        <button
          type="button"
          onClick={onDelete}
          aria-label="タスクを削除"
          className="shrink-0 rounded-full px-1.5 py-0.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
        >
          ×
        </button>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-400">コメントはありません</p>
        ) : (
          <ul className="space-y-1.5">
            {comments.map((c) => (
              <li key={c.id} className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">
                  {c.author_name}
                </span>
                : {c.text}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleSubmitComment} className="mt-2 flex gap-1.5">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="コメントを追加..."
            className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
          >
            追加
          </button>
        </form>
      </div>
    </div>
  );
}
