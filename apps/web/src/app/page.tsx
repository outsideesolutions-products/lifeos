"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { objectServiceApi } from "@/lib/api";

/**
 * Routes the user to the right place based on session + onboarding state:
 * signed out -> /sign-in; signed in but onboarding neither completed nor
 * dismissed -> /onboarding (First-Run Experience, Round 5 Decision 5);
 * otherwise -> /dashboard.
 */
export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const hasStartedRouting = useRef(false);

  useEffect(() => {
    if (isPending || hasStartedRouting.current) return;

    if (!session) {
      router.replace("/sign-in");
      return;
    }

    hasStartedRouting.current = true;
    objectServiceApi
      .getOnboardingStatus()
      .then((status) => {
        if (!status.onboardingCompletedAt && !status.onboardingDismissedAt) {
          router.replace("/onboarding");
        } else {
          router.replace("/dashboard");
        }
      })
      .catch(() => router.replace("/dashboard"));
  }, [session, isPending, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-zinc-500">Loading LifeOS...</p>
    </div>
  );
}
