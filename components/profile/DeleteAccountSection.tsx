"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteAccountSection() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    const confirmDelete = confirm(
      "This will permanently delete your account and all data. This cannot be undone. Continue?"
    );
    if (!confirmDelete) return;

    setLoading(true);

    const res = await fetch("/api/account/delete", { method: "DELETE" });

    if (res.ok) {
      router.push("/");
      router.refresh();
      return;
    }

    const msg = await res.text().catch(() => "");
    alert(msg || "Failed to delete account.");
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="mt-10 text-sm text-red-500 hover:text-red-600 underline disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? "Deleting account..." : "Delete account"}
    </button>
  );
}