/**
 * The 8 PersonalConstitution sub-entities (Round 7 Decision 1) share a
 * generic CRUD shape, so one controller/service handles all of them rather
 * than repeating near-identical code 8 times. Each entry names its Prisma
 * model delegate and the one field that must be present to create a
 * meaningful record (the rest of each model's fields are optional text).
 */
export const SUB_ENTITY_TYPES = {
  'vision-statements': {
    model: 'personalConstitutionVisionStatement',
    requiredField: 'statement',
  },
  'identity-statements': {
    model: 'personalConstitutionIdentityStatement',
    requiredField: 'statement',
  },
  values: {
    model: 'personalConstitutionValue',
    requiredField: 'name',
  },
  'non-negotiables': {
    model: 'personalConstitutionNonNegotiable',
    requiredField: 'statement',
  },
  'decision-principles': {
    model: 'personalConstitutionDecisionPrinciple',
    requiredField: 'principle',
  },
  boundaries: {
    model: 'personalConstitutionBoundary',
    requiredField: 'statement',
  },
  'success-definitions': {
    model: 'personalConstitutionSuccessDefinition',
    requiredField: 'definition',
  },
} as const;

export type SubEntityType = keyof typeof SUB_ENTITY_TYPES;

export function isValidSubEntityType(value: string): value is SubEntityType {
  return value in SUB_ENTITY_TYPES;
}
