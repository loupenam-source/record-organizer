import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NewRecordForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewRecordPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/signin");
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-4">
        <h1 className="text-xl font-bold">Add Record</h1>
      </header>
      <main className="p-6 max-w-3xl">
        <NewRecordForm />
      </main>
    </div>
  );
}
