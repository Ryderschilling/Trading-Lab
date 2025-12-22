import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getJournalEntries } from "@/lib/actions/journal";
import { JournalEntryList } from "@/components/journal/JournalEntryList";
import { CreateJournalEntry } from "@/components/journal/CreateJournalEntry";

export default async function JournalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const entries = await getJournalEntries();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trading Journal</h1>
        <CreateJournalEntry />
      </div>

      <JournalEntryList entries={entries} />
    </div>
  );
}

