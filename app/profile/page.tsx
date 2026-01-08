import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const clerkUser = await currentUser();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>
      <ProfileForm user={user} clerkUser={clerkUser} />
    </div>
  );
}

