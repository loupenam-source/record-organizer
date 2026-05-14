import { redirect } from "next/navigation";
import { getCurrentUser, listUsers } from "@/lib/auth";
import { SignInForm } from "./form";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const current = await getCurrentUser();
  if (current) redirect("/");
  const users = await listUsers();
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm border border-zinc-200 dark:border-zinc-800 rounded-md p-6 bg-white dark:bg-zinc-950 space-y-4">
        <div>
          <h1 className="text-xl font-bold">Record Organizer</h1>
          <p className="text-xs text-zinc-500">Sign in to continue</p>
        </div>
        <SignInForm users={users.map((u) => ({ username: u.username, name: u.name }))} />
      </div>
    </div>
  );
}
