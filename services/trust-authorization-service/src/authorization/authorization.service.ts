import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationInputs } from './authorization-input.interface';
import { AuthorizationDecisionResult } from '@lifeos/db';

export interface AuthorizationResult {
  result: AuthorizationDecisionResult;
  reasonCode: string;
}

/**
 * Milestone 0 skeleton policy.
 *
 * This is NOT the full Automation Authorization Matrix from
 * docs/architecture-decisions.md (Round 3, Decision 11:
 * Integration Trust → Object Classification → Action Risk → Automation
 * Permission → Authorization Service → Execute or Request Approval). That
 * matrix cannot be fully implemented until:
 *   - the Integration Layer supplies real Trust Levels (Milestone 3)
 *   - objects carry real Data Classification (Milestone 1+)
 *   - the Automation Engine supplies real Permission Levels (Milestone 3)
 *
 * (Action Risk Level's value set — the fourth input this matrix needs —
 * is now canonical: Round 7, Decision 3 defines MINIMAL/LOW/MODERATE/
 * HIGH/CRITICAL. That resolves what was Blocking finding B2 in
 * docs/architecture-compliance-report.md, but the matrix still can't be
 * completed until the other three inputs above exist in Milestone 3 — see
 * the note on `actionRiskLevel` in authorization-input.interface.ts.)
 *
 * Until then, this service enforces only the one rule that's fully
 * decidable today, per Security by Default ("every action is unauthorized
 * until explicitly proven safe") and the Human Override principle (System
 * Architecture §2 — "the user always has final authority"):
 *
 *   - A human user acting directly is allowed.
 *   - Every other actor type (ai, automation, integration, system) is
 *     required to go through approval unless ALL relevant inputs are
 *     present — and since Integration Trust Level, Data Classification,
 *     and Automation Permission Level still don't exist as real, supplied
 *     values before Milestone 3, that condition can never currently be
 *     fully satisfied, so those actors always land on REQUIRE_APPROVAL for
 *     now. This is intentional and will loosen as the missing inputs come
 *     online in later milestones — it must not be "fixed" by relaxing
 *     this default before the real matrix is implemented.
 *
 * Every evaluation is recorded, allowed or not, per the audit logging
 * responsibility of the Trust & Authorization Service.
 */
@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(inputs: AuthorizationInputs): Promise<AuthorizationResult> {
    const decision = this.decide(inputs);

    await this.prisma.authorizationDecision.create({
      data: {
        workspaceId: inputs.workspaceId,
        requestId: inputs.requestId,
        actorType: inputs.actorType,
        actorId: inputs.actorId,
        actionType: inputs.actionType,
        objectType: inputs.objectType,
        objectId: inputs.objectId,
        result: decision.result,
        reasonCode: decision.reasonCode,
        inputs: inputs as unknown as object,
      },
    });

    return decision;
  }

  private decide(inputs: AuthorizationInputs): AuthorizationResult {
    if (inputs.actorType === 'user') {
      return { result: 'ALLOW', reasonCode: 'HUMAN_OVERRIDE' };
    }

    if (inputs.integrationTrustLevel === 'EXPERIMENTAL') {
      return {
        result: 'DENY',
        reasonCode: 'EXPERIMENTAL_INTEGRATION_TRUST_LEVEL',
      };
    }

    const hasFullMatrixInputs =
      inputs.integrationTrustLevel !== undefined &&
      inputs.dataClassificationTier !== undefined &&
      inputs.actionRiskLevel !== undefined &&
      inputs.automationPermissionLevel !== undefined;

    if (!hasFullMatrixInputs) {
      return {
        result: 'REQUIRE_APPROVAL',
        reasonCode: 'INCOMPLETE_AUTHORIZATION_MATRIX_INPUTS',
      };
    }

    // The full matrix policy is not implemented yet — see class doc.
    return {
      result: 'REQUIRE_APPROVAL',
      reasonCode: 'AUTHORIZATION_MATRIX_NOT_YET_IMPLEMENTED',
    };
  }
}
