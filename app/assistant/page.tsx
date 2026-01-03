import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AIAssistant } from "@/components/assistant/AIAssistant";


export default async function AssistantPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">AI Trading Assistant</h1>
      <AIAssistant />
    </div>
  );
}

