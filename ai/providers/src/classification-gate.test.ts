import {
  AIClassificationViolationError,
  enforceClassification,
} from './classification-gate';

describe('enforceClassification', () => {
  it('allows Tier 3 (AI Available) content without explicit authorization', () => {
    expect(() => enforceClassification(3, undefined)).not.toThrow();
  });

  it('allows Tier 4 (Public) content without explicit authorization', () => {
    expect(() => enforceClassification(4, undefined)).not.toThrow();
  });

  it('rejects Tier 1 (Local Only) content without explicit authorization', () => {
    expect(() => enforceClassification(1, undefined)).toThrow(
      AIClassificationViolationError,
    );
  });

  it('rejects Tier 2 (Private) content without explicit authorization', () => {
    expect(() => enforceClassification(2, false)).toThrow(
      AIClassificationViolationError,
    );
  });

  it('allows Tier 1 content when explicitly authorized', () => {
    expect(() => enforceClassification(1, true)).not.toThrow();
  });

  it('allows Tier 2 content when explicitly authorized', () => {
    expect(() => enforceClassification(2, true)).not.toThrow();
  });
});
