import { PromptComposer } from './prompt-composer';
import { ProductConstitution, AIConstitution, PersonalConstitution } from '../constitution/constitution-client.service';

const product: ProductConstitution = {
  title: 'LifeOS',
  purpose: 'Help the user live intentionally',
  philosophy: 'AI-first, not AI-only',
  principles: ['Clarity over completeness'],
  longTermVision: 'A trusted lifelong Chief of Staff',
};

const ai: AIConstitution = {
  title: 'AI Constitution',
  rules: ['Never present a guess as fact'],
};

const emptyPersonal: PersonalConstitution = {
  status: 'INITIALIZATION',
  visionStatements: [],
  identityStatements: [],
  values: [],
  nonNegotiables: [],
  decisionPrinciples: [],
  boundaries: [],
  successDefinitions: [],
};

describe('PromptComposer', () => {
  const composer = new PromptComposer();

  it('includes the Core Identity Prompt verbatim', () => {
    const result = composer.compose({
      product,
      ai,
      personal: emptyPersonal,
      recentWorkingMemory: [],
    });
    expect(result).toContain('You are the user\'s AI Chief of Staff');
  });

  it('includes the Product and AI Constitution content', () => {
    const result = composer.compose({
      product,
      ai,
      personal: emptyPersonal,
      recentWorkingMemory: [],
    });
    expect(result).toContain('Help the user live intentionally');
    expect(result).toContain('Never present a guess as fact');
  });

  describe('Cold Start Behavior phase-aware Personal Constitution section', () => {
    it('Phase 1 (INITIALIZATION): instructs the AI to operate without a Personal Constitution', () => {
      const result = composer.compose({
        product,
        ai,
        personal: emptyPersonal,
        recentWorkingMemory: [],
      });
      expect(result).toContain('Phase: Initialization');
      expect(result).toContain('Encourage the user to build out their Personal Constitution');
    });

    it('Phase 2 (LEARNING): includes existing entries and flags assumptions', () => {
      const learning: PersonalConstitution = {
        ...emptyPersonal,
        status: 'LEARNING',
        values: [{ name: 'Deep Work', description: null }],
      };
      const result = composer.compose({
        product,
        ai,
        personal: learning,
        recentWorkingMemory: [],
      });
      expect(result).toContain('Phase: Learning');
      expect(result).toContain('Deep Work');
      expect(result).toContain('flag it clearly as an assumption');
    });

    it('Phase 3 (MATURE): treats the Constitution as the primary decision framework', () => {
      const mature: PersonalConstitution = {
        ...emptyPersonal,
        status: 'MATURE',
        nonNegotiables: [{ statement: 'Protect Sunday mornings' }],
      };
      const result = composer.compose({
        product,
        ai,
        personal: mature,
        recentWorkingMemory: [],
      });
      expect(result).toContain('Phase: Mature');
      expect(result).toContain('Protect Sunday mornings');
      expect(result).toContain("never silently override what is written here");
    });

    it('excludes inactive entries from the composed prompt', () => {
      const learning: PersonalConstitution = {
        ...emptyPersonal,
        status: 'LEARNING',
        values: [
          { name: 'Active Value', description: null, active: true },
          { name: 'Inactive Value', description: null, active: false },
        ],
      };
      const result = composer.compose({
        product,
        ai,
        personal: learning,
        recentWorkingMemory: [],
      });
      expect(result).toContain('Active Value');
      expect(result).not.toContain('Inactive Value');
    });
  });

  describe('Current Context section', () => {
    it('says no history is available when there is no recent Working Memory', () => {
      const result = composer.compose({
        product,
        ai,
        personal: emptyPersonal,
        recentWorkingMemory: [],
      });
      expect(result).toContain('No recent conversation history is available yet');
    });

    it('renders recent Working Memory entries in chronological order', () => {
      const result = composer.compose({
        product,
        ai,
        personal: emptyPersonal,
        recentWorkingMemory: [
          {
            id: '2',
            memoryType: 'WORKING' as never,
            content: 'User: second message\nAssistant: second reply',
            confidence: null,
            source: null,
            importance: 0,
            createdAt: '2026-01-01T00:01:00.000Z',
            lastReferencedAt: '2026-01-01T00:01:00.000Z',
            expiresAt: null,
          },
          {
            id: '1',
            memoryType: 'WORKING' as never,
            content: 'User: first message\nAssistant: first reply',
            confidence: null,
            source: null,
            importance: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
            lastReferencedAt: '2026-01-01T00:00:00.000Z',
            expiresAt: null,
          },
        ],
      });
      const firstIndex = result.indexOf('first message');
      const secondIndex = result.indexOf('second message');
      expect(firstIndex).toBeGreaterThan(-1);
      expect(secondIndex).toBeGreaterThan(firstIndex);
    });
  });
});
