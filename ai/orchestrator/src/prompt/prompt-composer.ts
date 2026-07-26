import { Injectable } from '@nestjs/common';
import { CORE_IDENTITY_PROMPT } from './core-identity';
import {
  AIConstitution,
  PersonalConstitution,
  ProductConstitution,
} from '../constitution/constitution-client.service';
import { MemoryEntryDto } from '../memory/memory-client.service';

const isActive = (entry: { active?: boolean }) => entry.active !== false;

/**
 * Assembles Layer 2 (Constitution) and Layer 3 (Current Context) of the
 * Prompt Library's composition model (§3, §9) for a single request.
 * Consultation order is Product -> AI -> Personal, per the Final
 * Pre-Implementation Decisions' three-constitution hierarchy (Current
 * Context and Historical Memory, the remaining two steps of that order,
 * are folded into the Current Context section below since Milestone 1 has
 * no separate "current context" data source beyond recent Working Memory).
 */
@Injectable()
export class PromptComposer {
  compose(input: {
    product: ProductConstitution;
    ai: AIConstitution;
    personal: PersonalConstitution;
    recentWorkingMemory: MemoryEntryDto[];
  }): string {
    const sections = [
      CORE_IDENTITY_PROMPT,
      this.composeProductConstitution(input.product),
      this.composeAIConstitution(input.ai),
      this.composePersonalConstitution(input.personal),
      this.composeCurrentContext(input.recentWorkingMemory),
    ];
    return sections.filter(Boolean).join('\n\n');
  }

  private composeProductConstitution(c: ProductConstitution): string {
    return [
      '# Product Constitution (highest authority — what LifeOS itself is for)',
      `Purpose: ${c.purpose}`,
      `Philosophy: ${c.philosophy}`,
      `Long-term vision: ${c.longTermVision}`,
      c.principles.length
        ? `Principles:\n${c.principles.map((p) => `- ${p}`).join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private composeAIConstitution(c: AIConstitution): string {
    return [
      '# AI Constitution (second authority — how the AI itself must behave)',
      c.rules.length ? c.rules.map((r) => `- ${r}`).join('\n') : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Cold Start Behavior (Round 4 Decision 5) — the three maturity phases
   * get materially different instructions, not just a status label passed
   * through. `status` is read as-is from PersonalConstitution; this method
   * does not decide *when* a workspace transitions between phases (no
   * transition algorithm is specified anywhere in the frozen architecture
   * — that is a product decision for a later milestone, not an
   * implementation detail to invent here).
   */
  private composePersonalConstitution(c: PersonalConstitution): string {
    const header = '# Personal Constitution (third authority — this specific user)';

    if (c.status === 'INITIALIZATION') {
      return [
        header,
        'Phase: Initialization — this user has not yet written a Personal Constitution.',
        'Operate on the Product Constitution, the AI Constitution, general best practices, and the user\'s explicit instructions in this conversation. Encourage the user to build out their Personal Constitution over time, but never require it or block on its absence.',
      ].join('\n');
    }

    const visionStatements = c.visionStatements.filter(isActive);
    const identityStatements = c.identityStatements.filter(isActive);
    const values = c.values.filter(isActive);
    const nonNegotiables = c.nonNegotiables.filter(isActive);
    const boundaries = c.boundaries.filter(isActive);
    const decisionPrinciples = c.decisionPrinciples;
    const successDefinitions = c.successDefinitions;

    const entries = [
      visionStatements.length
        ? `Vision:\n${visionStatements.map((v) => `- ${v.title}: ${v.statement}`).join('\n')}`
        : '',
      identityStatements.length
        ? `Identity:\n${identityStatements.map((v) => `- ${v.statement}`).join('\n')}`
        : '',
      values.length
        ? `Values:\n${values.map((v) => `- ${v.name}${v.description ? `: ${v.description}` : ''}`).join('\n')}`
        : '',
      nonNegotiables.length
        ? `Non-negotiables:\n${nonNegotiables.map((v) => `- ${v.statement}`).join('\n')}`
        : '',
      decisionPrinciples.length
        ? `Decision principles:\n${decisionPrinciples.map((v) => `- ${v.principle}`).join('\n')}`
        : '',
      boundaries.length
        ? `Boundaries:\n${boundaries.map((v) => `- ${v.statement}`).join('\n')}`
        : '',
      successDefinitions.length
        ? `Success looks like:\n${successDefinitions.map((v) => `- ${v.category}: ${v.definition}`).join('\n')}`
        : '',
    ].filter(Boolean);

    if (c.status === 'LEARNING') {
      return [
        header,
        'Phase: Learning — this Personal Constitution exists but is still incomplete.',
        ...entries,
        'Combine the entries above with observed behavior and any corrections the user gives you. Where you rely on an assumption instead of a stated entry, flag it clearly as an assumption, not as an established fact.',
      ].join('\n\n');
    }

    // MATURE, or any other stored value: treat conservatively as the
    // fullest-trust phase rather than guessing at an unrecognized status.
    return [
      header,
      'Phase: Mature — this Personal Constitution is the primary decision framework for this user.',
      ...entries,
      'Behavioral observations may refine your understanding, but never silently override what is written here — any proposed change to the Constitution itself always requires the user\'s explicit review and approval.',
    ].join('\n\n');
  }

  private composeCurrentContext(recentWorkingMemory: MemoryEntryDto[]): string {
    if (recentWorkingMemory.length === 0) {
      return '# Current Context\nNo recent conversation history is available yet — this is effectively a fresh start with this user today.';
    }
    const chronological = [...recentWorkingMemory].reverse();
    return [
      '# Current Context (recent conversation today)',
      ...chronological.map((entry) => entry.content),
    ].join('\n\n');
  }
}
