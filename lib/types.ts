export type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type Task = {
  id: string;
  text: string;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  text: string;
  author_name: string;
  author_id: string;
  task_id: string;
  created_at: string;
};
