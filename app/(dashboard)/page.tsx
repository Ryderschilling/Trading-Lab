import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const runtime = 'nodejs';

export default function DashboardRedirect() {
  redirect("/dashboard");
}
