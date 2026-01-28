import { permanentRedirect } from "next/navigation";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function DashboardRedirect() {
  permanentRedirect("/dashboard");
}
