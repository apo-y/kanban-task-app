"use client";

import { useState, type DragEvent } from "react";
import type { Comment, Task } from "@/lib/types";
import TaskCard from "./TaskCard";

type Props = {
  title: string;
  accentColor: string;
  tasks: Task[];
  comments: Record<string, Comment[]>;
  onToggleComplete: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddComment: (taskId: string, text: string) => void;
  onDropTask: (taskId: string) => void;
};

export default function TaskColumn({
  title,
  accentColor,
  tasks,
  comments,
  onToggleComplete,
  onDelete,
  onAddComment,
  onDropTask,
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) onDropTask(taskId);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col rounded-2xl border bg-white transition ${
        isDragOver
          ? "border-indigo-300 bg-indigo-50/40 ring-2 ring-indigo-100"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 font-bold text-slate-700">
          <span className={`h-2.5 w-2.5 rounded-full ${accentColor}`} />
          {title}
        </h2>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-500">
          {tasks.length}
        </span>
      </div>
      <div className="flex min-h-[140px] flex-1 flex-col gap-3 p-4">
        {tasks.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">
            タスクはありません
          </p>
        )}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            comments={comments[task.id] ?? []}
            onToggleComplete={() => onToggleComplete(task)}
            onDelete={() => onDelete(task.id)}
            onAddComment={(text) => onAddComment(task.id, text)}
          />
        ))}
      </div>
    </div>
  );
}
