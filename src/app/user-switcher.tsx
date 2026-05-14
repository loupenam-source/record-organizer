"use client";

import { useRouter } from "next/navigation";

export function UserSwitcher({
  users,
  currentUsername,
  viewingUsername,
}: {
  users: { username: string; name: string }[];
  currentUsername: string;
  viewingUsername: string;
}) {
  const router = useRouter();
  const onChange = (username: string) => {
    if (username === currentUsername) {
      router.push("/");
    } else {
      router.push(`/?user=${encodeURIComponent(username)}`);
    }
  };
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="text-zinc-500">Viewing</span>
      <select
        value={viewingUsername}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900"
      >
        {users.map((u) => (
          <option key={u.username} value={u.username}>
            {u.username === currentUsername ? `${u.name} (you)` : u.name}
          </option>
        ))}
      </select>
    </label>
  );
}
