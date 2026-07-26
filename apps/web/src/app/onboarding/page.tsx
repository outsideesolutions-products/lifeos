"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { objectServiceApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ONBOARDING_STEPS } from "./steps";

type Draft = Record<string, string>;
type Entry = Record<string, string>;

/**
 * The First-Run Experience (Round 5 Decision 5). Milestone 1's onboarding
 * scope is the Personal Constitution only — every step here maps directly
 * to one of its 7 sub-entity types. Every step is skippable, and the whole
 * flow can be dismissed at any point: "gradual context-building; useful
 * within the first session even if incomplete."
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const [entries, setEntries] = useState<Entry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = ONBOARDING_STEPS[stepIndex];
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;

  function updateDraft(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function addEntry() {
    const requiredFields = step.fields.filter((f) => f.required);
    if (requiredFields.some((f) => !draft[f.key]?.trim())) {
      setError("Please fill in the required field(s) before adding.");
      return;
    }
    setEntries((prev) => [...prev, draft]);
    setDraft({});
    setError(null);
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  async function persistEntries() {
    for (const entry of entries) {
      await objectServiceApi.createConstitutionItem(step.type, entry);
    }
  }

  async function goNext() {
    setSubmitting(true);
    setError(null);
    try {
      await persistEntries();
      if (isLastStep) {
        await objectServiceApi.completeOnboarding();
        router.replace("/dashboard");
        return;
      }
      setStepIndex((i) => i + 1);
      setEntries([]);
      setDraft({});
    } catch {
      setError("Something went wrong saving that — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function skipStep() {
    setEntries([]);
    setDraft({});
    setError(null);
    if (isLastStep) {
      setSubmitting(true);
      try {
        await objectServiceApi.completeOnboarding();
        router.replace("/dashboard");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStepIndex((i) => i + 1);
  }

  async function dismissOnboarding() {
    setSubmitting(true);
    try {
      await objectServiceApi.dismissOnboarding();
      router.replace("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
            <span>
              Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
            </span>
            <button
              onClick={dismissOnboarding}
              className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
              disabled={submitting}
            >
              Skip onboarding for now
            </button>
          </div>
          <CardTitle>{step.title}</CardTitle>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {entries.length > 0 && (
            <ul className="flex flex-col gap-2">
              {entries.map((entry, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-2 rounded-md bg-zinc-100 p-3 text-sm dark:bg-zinc-900"
                >
                  <span>{Object.values(entry).filter(Boolean).join(" — ")}</span>
                  <button
                    onClick={() => removeEntry(i)}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-3">
            {step.fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && " *"}
                </Label>
                {field.multiline ? (
                  <Textarea
                    id={field.key}
                    value={draft[field.key] ?? ""}
                    onChange={(e) => updateDraft(field.key, e.target.value)}
                  />
                ) : (
                  <Input
                    id={field.key}
                    value={draft[field.key] ?? ""}
                    onChange={(e) => updateDraft(field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addEntry}>
              Add
            </Button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
        <CardFooter className="flex justify-between gap-2">
          <Button variant="ghost" onClick={skipStep} disabled={submitting}>
            Skip this step
          </Button>
          <Button onClick={goNext} disabled={submitting}>
            {isLastStep ? "Finish" : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
