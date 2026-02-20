"use client";

import { useState } from "react";
import { useUser, UserButton, SignOutButton } from "@clerk/nextjs";
import Image from "next/image";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [deleting, setDeleting] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading profile…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Not signed in</p>
      </div>
    );
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lastSignIn = user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "—";

  async function handleDeleteAccount() {
    const confirmDelete = confirm(
      "This will permanently delete your account and all data. This cannot be undone. Continue?"
    );
    if (!confirmDelete) return;

    setDeleting(true);

    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });

      if (res.ok) {
        // Account is deleted (including Clerk user). Hard redirect avoids client state weirdness.
        window.location.href = "/";
        return;
      }

      const msg = await res.text().catch(() => "");
      alert(msg || "Failed to delete account.");
      setDeleting(false);
    } catch {
      alert("Failed to delete account.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex justify-center mt-24 px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-xl p-8 text-center">
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <Image
            src={user.imageUrl}
            alt="Profile photo"
            width={96}
            height={96}
            className="rounded-full border border-border"
          />
        </div>

        {/* Name */}
        <h1 className="text-2xl font-semibold">
          {user.firstName} {user.lastName}
        </h1>

        {/* Email */}
        <p className="mt-1 text-sm text-muted-foreground">
          {user.emailAddresses[0]?.emailAddress}
        </p>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-6">
          <UserButton afterSignOutUrl="/" />
          <SignOutButton>
            <button className="text-sm text-muted-foreground hover:text-foreground transition">
              Sign out
            </button>
          </SignOutButton>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-border" />

        {/* Info */}
        <div className="space-y-4 text-sm text-left">
          <InfoRow label="Time Zone" value={timeZone} />
          <InfoRow label="Today" value={today} />
          <InfoRow label="Last Sign-In" value={lastSignIn} />

          {/* Billing placeholder */}
          <InfoRow label="Plan" value="Free" muted />
        </div>

        {/* Upgrade CTA */}
        <div className="mt-8">
          <button
            className="
              w-full rounded-xl px-4 py-2 text-sm font-medium
              bg-primary text-primary-foreground
              hover:opacity-90 transition
            "
          >
            Upgrade Plan
          </button>
        </div>

        {/* ✅ Minimal delete link (ONLY addition) */}
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="mt-8 text-sm text-red-500 hover:text-red-600 underline disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {deleting ? "Deleting account..." : "Delete account"}
        </button>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "opacity-60" : ""}>{value}</span>
    </div>
  );
}