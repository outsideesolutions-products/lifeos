export { PrismaClient, Prisma } from '@prisma/client';

// Prisma-generated enums are real runtime objects (not just types) — they
// must be exported as values, not via `export type`, so callers can do
// things like `Object.values(RelationshipType)` for validation. Everything
// else below is a plain model type with no runtime representation of its
// own.
export { Priority, RelationshipType, MemoryType } from '@prisma/client';

export type {
  // Milestone 0
  Secret,
  SecretAuditLog,
  SecretAuditAction,
  AuthorizationDecision,
  AuthorizationDecisionResult,
  // Better Auth (generated — see services/identity-service/src/auth/auth.config.ts)
  User,
  Session,
  Account,
  Verification,
  TwoFactor,
  Passkey,
  // Core Objects
  Workspace,
  Folder,
  Tag,
  Label,
  // Constitution domain
  ProductConstitution,
  AIConstitution,
  PersonalConstitution,
  PersonalConstitutionVisionStatement,
  PersonalConstitutionIdentityStatement,
  PersonalConstitutionValue,
  PersonalConstitutionNonNegotiable,
  PersonalConstitutionDecisionPrinciple,
  PersonalConstitutionBoundary,
  PersonalConstitutionSuccessDefinition,
  PersonalConstitutionVersion,
  // Knowledge Graph
  ObjectRelationship,
  // AI Memory
  MemoryEntry,
} from '@prisma/client';

// Risk Level is NOT a Prisma enum — see the comment above `enum Priority`
// in schema.prisma. Its canonical TypeScript definition lives in
// @lifeos/domain-model, not here.
