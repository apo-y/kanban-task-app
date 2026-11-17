import { supabase } from "./supabase";
import type { Comment, Task, User } from "./types";

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase!
    .from("users")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as User[];
}

export type BoardData = {
  tasks: Task[];
  comments: Record<string, Comment[]>;
};

export async function fetchBoard(userId: string): Promise<BoardData> {
  const { data: taskRows, error: taskError } = await supabase!
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (taskError) throw new Error(taskError.message);
  const tasks = (taskRows ?? []) as Task[];

  if (tasks.length === 0) {
    return { tasks, comments: {} };
  }

  const { data: commentRows, error: commentError } = await supabase!
    .from("comments")
    .select("*")
    .in(
      "task_id",
      tasks.map((t) => t.id),
    )
    .order("created_at", { ascending: true });

  if (commentError) throw new Error(commentError.message);

  const comments: Record<string, Comment[]> = {};
  for (const c of (commentRows ?? []) as Comment[]) {
    comments[c.task_id] = comments[c.task_id]
      ? [...comments[c.task_id], c]
      : [c];
  }

  return { tasks, comments };
}
