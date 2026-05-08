"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import TaskColumn from "./TaskColumn";
import type { Task } from "@/lib/types";

type Props = {
  tasks: Task[];
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export default function KanbanBoard({ tasks, onToggle, onDelete }: Props) {
  const todoTasks = tasks.filter((t) => !t.completed);
  const doneTasks = tasks.filter((t) => t.completed);

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newCompleted = destination.droppableId === "done";
    await onToggle(draggableId, newCompleted);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TaskColumn
          droppableId="todo"
          title="未完了"
          tasks={todoTasks}
          onToggle={onToggle}
          onDelete={onDelete}
          headerColor="bg-blue-50"
          badgeColor="bg-blue-200 text-blue-700"
        />
        <TaskColumn
          droppableId="done"
          title="完了済み"
          tasks={doneTasks}
          onToggle={onToggle}
          onDelete={onDelete}
          headerColor="bg-green-50"
          badgeColor="bg-green-200 text-green-700"
        />
      </div>
    </DragDropContext>
  );
}
