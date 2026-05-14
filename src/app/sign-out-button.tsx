"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/signout", { method: "POST" });
        router.push("/signin");
        router.refresh();
      }}
      className="text-xs px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md disabled:opacity-50"
    >
      Sign out
    </button>
  );
}
