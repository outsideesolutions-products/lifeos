"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/**
 * Placeholder landing point after onboarding completes/dismisses.
 * The real Adaptive Home Screen dashboard is a separate Milestone 1 task
 * (Minimal Dashboard frontend) — this exists so the onboarding flow has
 * somewhere real to land and be tested end-to-end, not as a stand-in for
 * that task's own scope.
 */
export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) router.replace("/sign-in");
  }, [session, isPending, router]);

  if (isPending || !session) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <p className="text-lg">Welcome to LifeOS, {session.user.name}.</p>
      <p className="text-sm text-zinc-500">
        The full dashboard is being built next.
      </p>
      <Button variant="outline" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  );
}
