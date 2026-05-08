"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import CommentSection from "./CommentSection";
import type { Task } from "@/lib/types";

type Props = {
  task: Task;
  index: number;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export default function TaskCard({ task, index, onToggle, onDelete }: Props) {
  const [showComments, setShowComments] = useState(false);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-white dark:bg-gray-700 rounded-xl shadow-sm border p-3 transition-shadow ${
            snapshot.isDragging
              ? "shadow-lg border-blue-300 dark:border-blue-500 rotate-1"
              : "border-gray-200 dark:border-gray-600 hover:shadow-md"
          }`}
        >
          {/* タスクヘッダー */}
          <div className="flex items-start gap-2">
            {/* ドラッグハンドル（専用グリップアイコン） */}
            <div
              {...provided.dragHandleProps}
              className="mt-0.5 flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing"
              aria-label="ドラッグして移動"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="9" cy="5" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="9" cy="19" r="1.5" />
                <circle cx="15" cy="5" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="15" cy="19" r="1.5" />
              </svg>
            </div>

            {/* チェックボックス */}
            <button
              onClick={() => onToggle(task.id, !task.completed)}
              className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                task.completed
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300 dark:border-gray-500 hover:border-blue-400"
              }`}
              aria-label={task.completed ? "未完了に戻す" : "完了にする"}
            >
              {task.completed && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>

            {/* タスクテキスト */}
            <p
              className={`flex-1 text-sm leading-relaxed ${
                task.completed
                  ? "line-through text-gray-400 dark:text-gray-500"
                  : "text-gray-700 dark:text-gray-200"
              }`}
            >
              {task.text}
            </p>

            {/* 削除ボタン */}
            <button
              onClick={() => onDelete(task.id)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              aria-label="タスクを削除"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* コメントトグルボタン */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="mt-2 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {showComments ? "コメントを閉じる" : "コメントを見る"}
          </button>

          {/* コメントセクション */}
          {showComments && <CommentSection taskId={task.id} />}
        </div>
      )}
    </Draggable>
  );
}
