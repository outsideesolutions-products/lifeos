"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { objectServiceApi, PersonalConstitution } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PHASE_LABEL: Record<string, string> = {
  INITIALIZATION: "Just getting started",
  LEARNING: "Building understanding",
  MATURE: "Established",
};

/**
 * Real data, not a placeholder: counts each Personal Constitution
 * sub-entity category and shows the current Cold Start phase (Round 4
 * Decision 5). This is the "static context card" the Engineering Roadmap
 * describes for Milestone 1's minimum-viable Dashboard — genuinely backed
 * by data that exists, unlike Calendar/Health/Finance cards from the
 * UI/UX Specification's full card list, which have no real data until
 * later milestones.
 */
export function ConstitutionProgressCard() {
  const [constitution, setConstitution] = useState<PersonalConstitution | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    objectServiceApi
      .getPersonalConstitution()
      .then(setConstitution)
      .catch(() => setError(true));
  }, []);

  const totalEntries = constitution
    ? constitution.visionStatements.length +
      constitution.identityStatements.length +
      constitution.values.length +
      constitution.nonNegotiables.length +
      constitution.decisionPrinciples.length +
      constitution.boundaries.length +
      constitution.successDefinitions.length
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Constitution</CardTitle>
        <CardDescription>
          {error
            ? "Couldn't load your Constitution right now."
            : constitution
              ? PHASE_LABEL[constitution.status] ?? constitution.status
              : "Loading..."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {constitution && (
          <>
            <p className="text-sm text-zinc-500">
              {totalEntries === 0
                ? "You haven't added anything yet."
                : `${totalEntries} ${totalEntries === 1 ? "entry" : "entries"} across 7 categories.`}
            </p>
            <Link
              href="/onboarding"
              className="mt-2 inline-block text-sm font-medium underline"
            >
              {totalEntries === 0 ? "Get started" : "Keep building it out"}
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
