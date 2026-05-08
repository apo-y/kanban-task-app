"use client";

import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import type { Task } from "@/lib/types";

type Props = {
  droppableId: "todo" | "done";
  title: string;
  tasks: Task[];
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  headerColor: string;
  badgeColor: string;
};

export default function TaskColumn({
  droppableId,
  title,
  tasks,
  onToggle,
  onDelete,
  headerColor,
  badgeColor,
}: Props) {
  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
      {/* カラムヘッダー */}
      <div className={`px-4 py-3 ${headerColor} border-b border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-700 dark:text-gray-200 text-sm">{title}</h2>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}
          >
            {tasks.length}
          </span>
        </div>
      </div>

      {/* ドロップ可能エリア */}
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-3 space-y-2 transition-colors min-h-[300px] ${
              snapshot.isDraggingOver ? "bg-blue-50 dark:bg-blue-900/20" : ""
            }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-24 text-sm text-gray-400 dark:text-gray-500 italic">
                タスクがありません
              </div>
            )}
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
