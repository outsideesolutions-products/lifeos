"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ChiefOfStaffPanel } from "./components/chief-of-staff-panel";
import { ConstitutionProgressCard } from "./components/constitution-progress-card";
import { RecentActivityCard } from "./components/recent-activity-card";
import { QuickSearchCard } from "./components/quick-search-card";

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * The Milestone 1 minimum-viable Dashboard (Engineering Roadmap: "AI
 * conversational greeting + a small set of static context cards — full
 * Adaptive Home Screen dynamic assembly is deferred to when there's enough
 * object data to rank"). Per UI/UX Specification §5, "the first element on
 * the page is always the AI Chief of Staff... the experience begins with
 * conversation" — the chat panel comes before the cards, not after.
 *
 * The 3 cards below are real, not placeholders standing in for the full
 * card catalog (Today's Priorities, Calendar, Health Snapshot, etc.) that
 * §5 describes — those need domain objects that don't exist until later
 * milestones. What's shown here is exactly what Milestone 1 actually has
 * data for: Personal Constitution progress, recent AI Memory activity,
 * and keyword search.
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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {timeOfDayGreeting()}, {session.user.name}.
        </h1>
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>

      <ChiefOfStaffPanel />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ConstitutionProgressCard />
        <RecentActivityCard />
        <QuickSearchCard />
      </div>
    </div>
  );
}
