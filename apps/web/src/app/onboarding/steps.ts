export interface FieldConfig {
  key: string;
  label: string;
  required: boolean;
  multiline?: boolean;
}

export interface StepConfig {
  /** Matches the `:type` segment in Object Service's
   * `/constitution/personal/:type` endpoint (constitution-sub-entities.ts). */
  type: string;
  title: string;
  description: string;
  fields: FieldConfig[];
}

/**
 * The 7 Personal Constitution categories (Database Schema's original
 * Module 23 / Round 7 Decision 1's Constitution domain group), in the
 * same order the sub-entities appear in the Constitution response. Every
 * step is skippable — Round 5 Decision 5: "gradual context-building;
 * useful within the first session even if incomplete."
 */
export const ONBOARDING_STEPS: StepConfig[] = [
  {
    type: "vision-statements",
    title: "Vision",
    description: "Where do you want your life or work to be headed?",
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "statement", label: "Vision statement", required: true, multiline: true },
    ],
  },
  {
    type: "identity-statements",
    title: "Identity",
    description: "How do you think about who you are or want to become?",
    fields: [
      { key: "statement", label: "Identity statement", required: true, multiline: true },
      { key: "whyItMatters", label: "Why this matters", required: false, multiline: true },
    ],
  },
  {
    type: "values",
    title: "Values",
    description: "What matters most to you when making decisions?",
    fields: [
      { key: "name", label: "Value", required: true },
      { key: "description", label: "Description", required: false, multiline: true },
    ],
  },
  {
    type: "non-negotiables",
    title: "Non-negotiables",
    description: "What will you never compromise on?",
    fields: [
      { key: "statement", label: "Non-negotiable", required: true, multiline: true },
      { key: "reason", label: "Reason", required: false, multiline: true },
    ],
  },
  {
    type: "decision-principles",
    title: "Decision principles",
    description: "What rules of thumb guide how you decide?",
    fields: [
      { key: "principle", label: "Principle", required: true, multiline: true },
      { key: "description", label: "Description", required: false, multiline: true },
    ],
  },
  {
    type: "boundaries",
    title: "Boundaries",
    description: "What limits protect your time, energy, or wellbeing?",
    fields: [
      { key: "statement", label: "Boundary", required: true, multiline: true },
      { key: "description", label: "Description", required: false, multiline: true },
    ],
  },
  {
    type: "success-definitions",
    title: "Success",
    description: "What does success actually look like for you?",
    fields: [
      { key: "category", label: "Area of life", required: true },
      { key: "definition", label: "What success looks like", required: true, multiline: true },
    ],
  },
];
