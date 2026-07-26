export { PrismaClient, Prisma } from '@prisma/client';
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
  // Canonical enums
  // Priority is a real Prisma enum (used as a column type below). Risk
  // Level is NOT — see the comment above `enum Priority` in schema.prisma.
  // Its canonical TypeScript definition lives in @lifeos/domain-model.
  Priority,
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
} from '@prisma/client';
