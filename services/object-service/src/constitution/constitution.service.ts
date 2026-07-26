import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedActor } from '../auth/session.guard';
import {
  SUB_ENTITY_TYPES,
  SubEntityType,
} from './constitution-sub-entities';

@Injectable()
export class ConstitutionService {
  constructor(private readonly prisma: PrismaService) {}

  /** System-level singleton, read-only via the API — see schema.prisma's
   * ProductConstitution comment. Written only by packages/db/prisma/seed.ts. */
  async getProductConstitution() {
    const constitution = await this.prisma.productConstitution.findFirst();
    if (!constitution) {
      throw new NotFoundException(
        'ProductConstitution has not been seeded — run `pnpm --filter @lifeos/db run seed`',
      );
    }
    return constitution;
  }

  /** System-level singleton, read-only via the API — see schema.prisma's
   * AIConstitution comment. */
  async getAIConstitution() {
    const constitution = await this.prisma.aIConstitution.findFirst();
    if (!constitution) {
      throw new NotFoundException(
        'AIConstitution has not been seeded — run `pnpm --filter @lifeos/db run seed`',
      );
    }
    return constitution;
  }

  /** Every user has exactly one, auto-provisioned at signup (see
   * identity-service's databaseHooks) — this should never 404 in practice
   * for an authenticated actor, but we don't assume that invariant holds
   * forever without checking. */
  async getPersonalConstitution(actor: AuthenticatedActor) {
    const constitution = await this.prisma.personalConstitution.findUnique({
      where: { workspaceId: actor.workspaceId },
      include: {
        visionStatements: { where: { deletedAt: null } },
        identityStatements: { where: { deletedAt: null } },
        values: { where: { deletedAt: null } },
        nonNegotiables: { where: { deletedAt: null } },
        decisionPrinciples: { where: { deletedAt: null } },
        boundaries: { where: { deletedAt: null } },
        successDefinitions: { where: { deletedAt: null } },
      },
    });
    if (!constitution) {
      throw new NotFoundException(
        'No PersonalConstitution provisioned for this workspace — this should not happen for an authenticated user; see identity-service databaseHooks',
      );
    }
    return constitution;
  }

  async createSubEntity(
    type: SubEntityType,
    data: Record<string, unknown>,
    actor: AuthenticatedActor,
  ) {
    const { model, requiredField } = SUB_ENTITY_TYPES[type];
    if (!data[requiredField] || typeof data[requiredField] !== 'string') {
      throw new BadRequestException(
        `"${requiredField}" is required and must be a non-empty string for ${type}`,
      );
    }

    const personalConstitution = await this.prisma.personalConstitution.findUnique({
      where: { workspaceId: actor.workspaceId },
    });
    if (!personalConstitution) {
      throw new NotFoundException(
        'No PersonalConstitution provisioned for this workspace',
      );
    }

    const delegate = this.delegateFor(model);
    const created = await delegate.create({
      data: {
        ...data,
        personalConstitutionId: personalConstitution.id,
        workspaceId: actor.workspaceId,
        ownerId: actor.id,
        createdBy: actor.id,
        updatedBy: actor.id,
      },
    });

    await this.recordVersion(
      personalConstitution.id,
      actor,
      `Added ${type.slice(0, -1)}`,
    );

    // Cold Start Behavior (Round 4 Decision 5): Phase 1 (Initialization) is
    // "no Personal Constitution yet"; Phase 2 (Learning) is "Personal
    // Constitution exists but is incomplete." The first sub-entity ever
    // created for a workspace is exactly the transition point from "doesn't
    // exist" to "exists" — advancing past that point here, rather than
    // leaving every reader to infer it from an empty PersonalConstitution
    // with no entries, is a direct implementation of the stated phases, not
    // a new rule. The Learning -> Mature transition is deliberately NOT
    // implemented anywhere: no document specifies a concrete trigger for
    // it (unlike this one), so it remains an open product decision.
    if (personalConstitution.status === 'INITIALIZATION') {
      await this.prisma.personalConstitution.update({
        where: { id: personalConstitution.id },
        data: { status: 'LEARNING' },
      });
    }

    return created;
  }

  async updateSubEntity(
    type: SubEntityType,
    id: string,
    data: Record<string, unknown>,
    actor: AuthenticatedActor,
  ) {
    const { model } = SUB_ENTITY_TYPES[type];
    const delegate = this.delegateFor(model);

    const existing = await delegate.findFirst({
      where: { id, workspaceId: actor.workspaceId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`No ${type} item with id "${id}"`);
    }

    const updated = await delegate.update({
      where: { id },
      data: { ...data, updatedBy: actor.id, version: { increment: 1 } },
    });

    await this.recordVersion(
      existing.personalConstitutionId,
      actor,
      `Updated ${type.slice(0, -1)}`,
    );

    return updated;
  }

  async removeSubEntity(
    type: SubEntityType,
    id: string,
    actor: AuthenticatedActor,
  ) {
    const { model } = SUB_ENTITY_TYPES[type];
    const delegate = this.delegateFor(model);

    const existing = await delegate.findFirst({
      where: { id, workspaceId: actor.workspaceId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`No ${type} item with id "${id}"`);
    }

    await delegate.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actor.id },
    });

    await this.recordVersion(
      existing.personalConstitutionId,
      actor,
      `Removed ${type.slice(0, -1)}`,
    );
  }

  /**
   * Every constitutional edit creates a new version rather than
   * overwriting history (Cognitive Architecture "Version History": "never
   * overwrite history"). Snapshots the full constitution state at the time
   * of the change.
   */
  private async recordVersion(
    personalConstitutionId: string,
    actor: AuthenticatedActor,
    reasonForChange: string,
  ) {
    const snapshot = await this.prisma.personalConstitution.findUnique({
      where: { id: personalConstitutionId },
      include: {
        visionStatements: true,
        identityStatements: true,
        values: true,
        nonNegotiables: true,
        decisionPrinciples: true,
        boundaries: true,
        successDefinitions: true,
      },
    });

    const latest = await this.prisma.personalConstitutionVersion.findFirst({
      where: { personalConstitutionId },
      orderBy: { versionNumber: 'desc' },
    });

    await this.prisma.personalConstitutionVersion.create({
      data: {
        personalConstitutionId,
        workspaceId: actor.workspaceId,
        versionNumber: (latest?.versionNumber ?? 0) + 1,
        snapshot: snapshot as unknown as object,
        reasonForChange,
        createdBy: actor.id,
      },
    });
  }

  /**
   * Prisma's typed client doesn't support indexing a model delegate by a
   * dynamic string key without a cast — this is the one, contained place
   * that cast happens, so the 7 sub-entity types can share one
   * implementation instead of 7 duplicated services. The DTO validation in
   * the controller plus `requiredField` checks above are what keep this
   * safe despite the loosened typing here.
   */
  private delegateFor(model: string): {
    create: (args: { data: Record<string, unknown> }) => Promise<any>;
    findFirst: (args: unknown) => Promise<any>;
    update: (args: unknown) => Promise<any>;
  } {
    return (this.prisma as unknown as Record<string, any>)[model];
  }
}
