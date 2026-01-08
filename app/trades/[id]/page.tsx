import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTradeById } from "@/lib/actions/trades";
import { TradeDetail } from "@/components/trades/TradeDetail";

export const dynamic = 'force-dynamic';

interface TradeDetailPageProps {
  params: {
    id: string;
  };
}

export default async function TradeDetailPage({ params }: TradeDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trade = await getTradeById(params.id);

  if (!trade) {
    redirect("/trades");
  }

  return (
    <div className="space-y-6">
      <TradeDetail trade={trade} />
    </div>
  );
}

