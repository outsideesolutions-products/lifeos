import {
  PRIORITY_VALUES,
  RISK_VALUES,
  DATA_CLASSIFICATION_TIERS,
  UniversalBaseObjectFields,
} from './universal-base-object';

describe('canonical enums (architecture-decisions.md Round 7)', () => {
  it('Priority matches the canonical value set exactly', () => {
    expect(PRIORITY_VALUES).toEqual(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
  });

  it('Risk matches the canonical value set exactly', () => {
    expect(RISK_VALUES).toEqual([
      'MINIMAL',
      'LOW',
      'MODERATE',
      'HIGH',
      'CRITICAL',
    ]);
  });

  it('Data Classification has exactly the 4 canonical tiers', () => {
    expect(DATA_CLASSIFICATION_TIERS).toEqual([1, 2, 3, 4]);
  });
});

describe('UniversalBaseObjectFields shape', () => {
  it('a well-formed object satisfies the contract (compile-time proof by construction)', () => {
    const sample: UniversalBaseObjectFields = {
      id: 'id-1',
      type: 'TestType',
      ownerId: 'owner-1',
      workspaceId: 'workspace-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      archivedAt: null,
      version: 1,
      priority: 'MEDIUM',
      status: 'active',
      location: null,
      isFavorite: false,
      metadata: {},
      createdBy: 'user-1',
      updatedBy: 'user-1',
      source: null,
      classification: 3,
    };

    expect(sample.id).toBe('id-1');
  });
});
