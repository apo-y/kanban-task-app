"use client";

import { useState } from "react";
import type { User } from "@/lib/types";
import EditProfileModal from "./EditProfileModal";

type Props = {
  user: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
};

export default function Header({ user, onLogout, onUserUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <header className="flex items-center justify-between sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
      <div>
        <h1 className="text-lg font-bold text-slate-800">
          看板ボード風タスク管理
        </h1>
        <p className="text-sm text-slate-500">ようこそ、{user.name}さん</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          プロフィール編集
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          ログアウト
        </button>
      </div>

      {isEditing && (
        <EditProfileModal
          user={user}
          onClose={() => setIsEditing(false)}
          onSaved={(updated) => {
            onUserUpdate(updated);
            setIsEditing(false);
          }}
        />
      )}
    </header>
  );
}
