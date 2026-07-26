"use client";

import { useEffect, useState } from "react";
import { aiMemoryServiceApi, MemoryEntry } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Shows the most recent Working Memory entries (same tier the Chief of
 * Staff writes conversation turns to — see ai/orchestrator's README).
 * Real data, not a placeholder: if there's no conversation yet, this card
 * says so rather than showing fabricated activity.
 */
export function RecentActivityCard() {
  const [entries, setEntries] = useState<MemoryEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    aiMemoryServiceApi
      .findByType("WORKING")
      .then((all) => setEntries(all.slice(0, 5)))
      .catch(() => setError(true));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>What your Chief of Staff has been tracking</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-zinc-500">Couldn&apos;t load recent activity.</p>}
        {entries && entries.length === 0 && (
          <p className="text-sm text-zinc-500">Nothing yet — start a conversation above.</p>
        )}
        {entries && entries.length > 0 && (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li key={entry.id} className="text-sm text-zinc-600 dark:text-zinc-400">
                {entry.content.length > 100
                  ? `${entry.content.slice(0, 100)}...`
                  : entry.content}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
