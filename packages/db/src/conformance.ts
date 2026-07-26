/**
 * Compile-time proof that every concrete object model satisfies the
 * Universal Base Object contract (@lifeos/domain-model), per Round 8's
 * implementation note. If a model in schema.prisma is missing a required
 * field, the corresponding line below fails to compile — this file is the
 * actual enforcement mechanism, not just documentation of intent.
 *
 * `type` isn't a stored column on these single-purpose tables (see the
 * comment on `type` in universal-base-object.ts), so each check synthesizes
 * ONLY that one field via an intersection. Do not synthesize any other
 * field here — the whole point is to catch a real column going missing,
 * and papering over a gap with a synthetic value defeats that.
 *
 * `ProductConstitution` and `AIConstitution` are checked against a reduced
 * contract that omits `ownerId` and `workspaceId`: they are global system
 * configuration, not tenant-owned domain objects (see the model comments in
 * schema.prisma) — those two fields don't apply to them, which is a
 * deliberate design decision, not a gap.
 *
 * Add one line here for every new object type as it's added to the
 * Canonical Object Registry.
 */
import type {
  ConformsToUniversalBaseObject,
  UniversalBaseObjectFields,
} from '@lifeos/domain-model';
import type {
  Workspace,
  Folder,
  Tag,
  Label,
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
} from '@prisma/client';

type WithType<T, TypeName extends string> = T & { type: TypeName };

/** Workspace is the tenancy root and has no `workspaceId` of its own — see
 * the model comment in schema.prisma. Checked against every other field. */
type ConformsMinusWorkspaceId<
  T extends { [K in Exclude<keyof UniversalBaseObjectFields, 'workspaceId'>]: unknown },
> = T;

export type _WorkspaceConformance = ConformsMinusWorkspaceId<
  WithType<Workspace, 'Workspace'>
>;
export type _FolderConformance = ConformsToUniversalBaseObject<
  WithType<Folder, 'Folder'>
>;
export type _TagConformance = ConformsToUniversalBaseObject<
  WithType<Tag, 'Tag'>
>;
export type _LabelConformance = ConformsToUniversalBaseObject<
  WithType<Label, 'Label'>
>;
export type _PersonalConstitutionConformance = ConformsToUniversalBaseObject<
  WithType<PersonalConstitution, 'PersonalConstitution'>
>;
export type _VisionStatementConformance = ConformsToUniversalBaseObject<
  WithType<
    PersonalConstitutionVisionStatement,
    'PersonalConstitutionVisionStatement'
  >
>;
export type _IdentityStatementConformance = ConformsToUniversalBaseObject<
  WithType<
    PersonalConstitutionIdentityStatement,
    'PersonalConstitutionIdentityStatement'
  >
>;
export type _ValueConformance = ConformsToUniversalBaseObject<
  WithType<PersonalConstitutionValue, 'PersonalConstitutionValue'>
>;
export type _NonNegotiableConformance = ConformsToUniversalBaseObject<
  WithType<
    PersonalConstitutionNonNegotiable,
    'PersonalConstitutionNonNegotiable'
  >
>;
export type _DecisionPrincipleConformance = ConformsToUniversalBaseObject<
  WithType<
    PersonalConstitutionDecisionPrinciple,
    'PersonalConstitutionDecisionPrinciple'
  >
>;
export type _BoundaryConformance = ConformsToUniversalBaseObject<
  WithType<PersonalConstitutionBoundary, 'PersonalConstitutionBoundary'>
>;
export type _SuccessDefinitionConformance = ConformsToUniversalBaseObject<
  WithType<
    PersonalConstitutionSuccessDefinition,
    'PersonalConstitutionSuccessDefinition'
  >
>;

/** Reduced contract for the two system-level singletons — see file header. */
type ConformsToSystemSingleton<
  T extends {
    [K in Exclude<
      keyof UniversalBaseObjectFields,
      'ownerId' | 'workspaceId'
    >]: unknown;
  },
> = T;

export type _ProductConstitutionConformance = ConformsToSystemSingleton<
  WithType<ProductConstitution, 'ProductConstitution'>
>;
export type _AIConstitutionConformance = ConformsToSystemSingleton<
  WithType<AIConstitution, 'AIConstitution'>
>;
