/**
 * The Universal Base Object contract (architecture-decisions.md, Round 2
 * Decision 3, corrected by Round 8's Object Model Clarification).
 *
 * There is no shared `Object` database table. Every concrete entity (Task,
 * Goal, Workspace, ProductConstitution, etc.) is its own Prisma model that
 * carries these fields directly as real columns. This interface is the
 * contract those models are checked against — see `assertConformsToContract`
 * below and its usage pattern.
 *
 * Two of the five Round 2 field groups are deliberately NOT represented as
 * stored properties here:
 *
 *   - "Relationships" (Related Objects, Parent, Children) — per Round 5
 *     Decision 8's FK-vs-graph rule, generic relationships are never
 *     columns on the object itself. They're either a type-specific direct
 *     foreign key (e.g. Task.projectId — modeled per concrete type, not
 *     here) or an edge in the Knowledge Graph Service's Object
 *     Relationships store. A concrete object satisfies "has relationships"
 *     by existing as a node the Knowledge Graph Service can reference by
 *     (type, id) — there is nothing to declare on the object's own row.
 *
 *   - "Timeline History" — derived from the object's own audit trail plus
 *     Knowledge Graph events referencing it, not a column that would
 *     duplicate that data on every row.
 *
 * Everything else below IS a required column on every concrete model.
 */

export type ActorType = 'user' | 'ai' | 'automation' | 'integration' | 'system';

/**
 * Structurally equivalent to Prisma's generated `JsonValue` type (and to
 * any other ORM's JSON column type) without this package taking a
 * dependency on Prisma — it stays ORM-agnostic per this package's stated
 * purpose. Used for the `metadata` field below, which is always a JSON
 * object at the application layer but is typed by the DB layer as "any
 * valid JSON," not narrowly as `Record<string, unknown>`.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

/** Canonical Priority enum — architecture-decisions.md, Round 7, Decision 2. */
export const PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type Priority = (typeof PRIORITY_VALUES)[number];

/** Canonical Risk enum — architecture-decisions.md, Round 7, Decision 3. */
export const RISK_VALUES = [
  'MINIMAL',
  'LOW',
  'MODERATE',
  'HIGH',
  'CRITICAL',
] as const;
export type RiskLevel = (typeof RISK_VALUES)[number];

/**
 * Data Classification tiers — architecture-decisions.md, Round 1, Decision 4.
 * 1 = Local Only, 2 = Private, 3 = AI Available, 4 = Public.
 */
export const DATA_CLASSIFICATION_TIERS = [1, 2, 3, 4] as const;
export type DataClassificationTier = (typeof DATA_CLASSIFICATION_TIERS)[number];

export interface UniversalBaseObjectFields {
  // --- Identity ---
  id: string;
  /**
   * The concrete object type name, e.g. "Workspace", "Task" — used by the
   * Knowledge Graph and Search services to disambiguate polymorphic
   * references (they key on `(type, id)` pairs since there's no shared
   * table to join through).
   *
   * This is NOT necessarily a stored column. For a single-purpose table
   * (Workspace, Folder, Tag) the type is a compile-time constant equal to
   * the table name — storing it as a column on every row would just be
   * redundant data, so the Object/Knowledge-Graph/Search service layer
   * supplies it from the table/model name instead. It only needs to be a
   * real column on tables that hold more than one logical type via a
   * discriminator (e.g. a future `HealthMetric` table covering Weight/
   * Mood/Cycle as one row shape with a `metricType` field).
   */
  type: string;
  ownerId: string;
  workspaceId: string;

  // --- Lifecycle ---
  createdAt: Date;
  updatedAt: Date;
  /** Soft-delete timestamp, per Round 5 Decision 7. Never physically
   * removed by default. */
  deletedAt: Date | null;
  /** Archive-stage timestamp, per Round 3 Decision 2's data lifecycle
   * (Active -> Warm -> Archive -> Immutable History). Distinct from
   * deletedAt: an archived object is still active data, just demoted. */
  archivedAt: Date | null;
  version: number;

  // --- Experience ---
  priority: Priority | null;
  status: string | null;
  location: string | null;
  isFavorite: boolean;

  // --- System ---
  metadata: JsonValue;
  createdBy: string;
  updatedBy: string;
  /** Where this object originated — manual entry, an integration
   * connector, an automation, etc. */
  source: string | null;
  classification: DataClassificationTier;
}

/**
 * Compile-time conformance check. Usage in a service that defines a
 * concrete Prisma model:
 *
 *   import type { Workspace as PrismaWorkspace } from '@lifeos/db';
 *   import { ConformsToUniversalBaseObject } from '@lifeos/domain-model';
 *   // Fails to compile if PrismaWorkspace is missing a required field.
 *   type _WorkspaceConformance = ConformsToUniversalBaseObject<PrismaWorkspace>;
 *
 * This is deliberately a type-only check (no runtime cost) — Prisma models
 * are generated from schema.prisma, so the real enforcement point is "does
 * the schema define these columns," and TypeScript compilation of this
 * assertion is what catches drift.
 *
 * Deliberately checks field PRESENCE (every required key exists) rather
 * than exact type equality: different JSON-column libraries (Prisma's
 * generated `JsonValue`, this package's own `JsonValue`, etc.) are
 * structurally similar but not always nominally assignable to each other
 * due to how TypeScript represents recursive types, which would produce
 * false-positive failures unrelated to the thing this check actually
 * guards against — a column going missing.
 */
export type ConformsToUniversalBaseObject<
  T extends { [K in keyof UniversalBaseObjectFields]: unknown },
> = T;
