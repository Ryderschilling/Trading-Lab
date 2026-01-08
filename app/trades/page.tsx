import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTrades } from "@/lib/actions/trades";
import { TradesList } from "@/components/trades/TradesList";

export const dynamic = 'force-dynamic';

export default async function TradesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trades = await getTrades(); // Get all trades, no limit

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Trades</h1>
      </div>
      <TradesList trades={trades} />
    </div>
  );
}

