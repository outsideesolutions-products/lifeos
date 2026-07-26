import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedActor } from '../auth/session.guard';

interface OnboardingMetadata {
  completedAt?: string;
  dismissedAt?: string;
}

/**
 * First-Run Experience status (Round 5 Decision 5): "Dedicated onboarding
 * whose objective is building the AI's understanding... gradual
 * context-building; useful within the first session even if incomplete."
 *
 * Milestone 1's onboarding scope is the Personal Constitution only — every
 * other item Decision 5 lists (goals, projects, work style, health/
 * financial priorities, connected accounts, calendars, documents) needs
 * domain objects or the Integration Layer that don't exist until later
 * milestones. Collecting Personal Constitution content itself reuses the
 * existing constitution sub-entity endpoints unchanged; this module only
 * tracks whether the user has been through (or explicitly dismissed) the
 * guided onboarding UI, independent of how much Constitution content they
 * actually entered — a user can dismiss onboarding having entered nothing,
 * per Decision 5's "useful... even if incomplete," and should not be shown
 * it again automatically.
 *
 * Stored in Workspace.metadata rather than as new structured columns, per
 * Round 5 Decision 10 ("Metadata is an extension mechanism... non-indexed
 * optional attributes") — this is UI-flow state, not domain data queried
 * elsewhere in the system.
 */
@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(actor: AuthenticatedActor) {
    const [workspace, personalConstitution] = await Promise.all([
      this.getWorkspace(actor),
      this.prisma.personalConstitution.findUnique({
        where: { workspaceId: actor.workspaceId },
      }),
    ]);

    if (!personalConstitution) {
      throw new NotFoundException(
        'No PersonalConstitution provisioned for this workspace',
      );
    }

    const onboarding = this.readOnboardingMetadata(workspace.metadata);
    return {
      coldStartPhase: personalConstitution.status,
      onboardingCompletedAt: onboarding.completedAt ?? null,
      onboardingDismissedAt: onboarding.dismissedAt ?? null,
    };
  }

  async complete(actor: AuthenticatedActor) {
    await this.setOnboardingMetadata(actor, { completedAt: new Date().toISOString() });
    return this.getStatus(actor);
  }

  async dismiss(actor: AuthenticatedActor) {
    await this.setOnboardingMetadata(actor, { dismissedAt: new Date().toISOString() });
    return this.getStatus(actor);
  }

  private async getWorkspace(actor: AuthenticatedActor) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: actor.workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException(`No workspace with id "${actor.workspaceId}"`);
    }
    return workspace;
  }

  private readOnboardingMetadata(metadata: unknown): OnboardingMetadata {
    if (
      metadata &&
      typeof metadata === 'object' &&
      'onboarding' in (metadata as Record<string, unknown>)
    ) {
      return (metadata as { onboarding: OnboardingMetadata }).onboarding ?? {};
    }
    return {};
  }

  private async setOnboardingMetadata(
    actor: AuthenticatedActor,
    patch: OnboardingMetadata,
  ) {
    const workspace = await this.getWorkspace(actor);
    const existingMetadata =
      workspace.metadata && typeof workspace.metadata === 'object'
        ? (workspace.metadata as Record<string, unknown>)
        : {};
    const existingOnboarding = this.readOnboardingMetadata(workspace.metadata);

    await this.prisma.workspace.update({
      where: { id: actor.workspaceId },
      data: {
        metadata: {
          ...existingMetadata,
          onboarding: { ...existingOnboarding, ...patch },
        },
        updatedBy: actor.id,
      },
    });
  }
}
