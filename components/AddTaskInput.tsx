"use client";

import { useState } from "react";

type Props = {
  onAdd: (text: string) => Promise<void>;
};

export default function AddTaskInput({ onAdd }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    await onAdd(text);
    setText("");
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 max-w-lg mx-auto"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="新しいタスクを入力..."
        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
      />
      <button
        type="submit"
        disabled={!text.trim() || loading}
        className="px-5 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl shadow-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "追加中..." : "追加"}
      </button>
    </form>
  );
}
