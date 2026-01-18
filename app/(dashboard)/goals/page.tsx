import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGoals } from "@/lib/actions/goals";
import { GoalsList } from "@/components/goals/GoalsList";
import { CreateGoalButton } from "@/components/goals/CreateGoalButton";

export const dynamic = 'force-dynamic';

export default async function GoalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const goals = await getGoals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trading Goals</h1>
        <CreateGoalButton />
      </div>

      <GoalsList goals={goals} />
    </div>
  );
}

