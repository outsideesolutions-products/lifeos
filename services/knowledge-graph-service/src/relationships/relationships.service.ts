import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@lifeos/db';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { AuthenticatedActor } from '../auth/session.guard';

export interface ObjectRef {
  objectType: string;
  objectId: string;
}

@Injectable()
export class RelationshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRelationshipDto, actor: AuthenticatedActor) {
    try {
      return await this.prisma.objectRelationship.create({
        data: {
          workspaceId: actor.workspaceId,
          sourceObjectType: dto.sourceObjectType,
          sourceObjectId: dto.sourceObjectId,
          relationshipType: dto.relationshipType,
          targetObjectType: dto.targetObjectType,
          targetObjectId: dto.targetObjectId,
          strength: dto.strength,
          createdBy: actor.id,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'This exact relationship already exists',
        );
      }
      throw err;
    }
  }

  /** Every relationship touching this object, in either direction —
   * per the Domain Model, the AI should be able to move naturally between
   * objects regardless of which side of an edge they're on. */
  async findForObject(ref: ObjectRef, actor: AuthenticatedActor) {
    return this.prisma.objectRelationship.findMany({
      where: {
        workspaceId: actor.workspaceId,
        OR: [
          { sourceObjectType: ref.objectType, sourceObjectId: ref.objectId },
          { targetObjectType: ref.objectType, targetObjectId: ref.objectId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, actor: AuthenticatedActor) {
    const relationship = await this.prisma.objectRelationship.findFirst({
      where: { id, workspaceId: actor.workspaceId },
    });
    if (!relationship) {
      throw new NotFoundException(`No relationship with id "${id}"`);
    }
    await this.prisma.objectRelationship.delete({ where: { id } });
  }

  /**
   * Breadth-first traversal outward from a starting object, up to
   * `maxDepth` hops. This is the mechanism behind the AI Reasoning Graph's
   * traversal chains (e.g. Goal -> Project -> Tasks -> ... -> Insights) —
   * the Chief of Staff calls this rather than following FKs across
   * services, since most of those connections live in this graph, not in
   * direct foreign keys.
   */
  /**
   * Priority-based traversal (Round 3 Decision 3: "indexed relationship
   * traversal, relationship-type indexing, object-type indexing, temporal
   * filtering, and priority-based traversal"). BFS still visits every edge
   * within `maxDepth` — priority here governs traversal order and, more
   * importantly, the order results are returned in: at each depth, edges
   * are explored strongest-first, and a node's recorded strength is the
   * highest-strength edge that reached it. Callers that only need the top
   * few results at a given depth (e.g. context-assembly ranking, Round 3
   * Decision 4's "relationship distance" factor) get the most relevant
   * ones first without needing their own ranking pass.
   */
  async traverse(
    start: ObjectRef,
    maxDepth: number,
    actor: AuthenticatedActor,
  ): Promise<
    { depth: number; objectType: string; objectId: string; strength: number }[]
  > {
    const visited = new Map<string, { depth: number; strength: number }>();
    const key = (ref: ObjectRef) => `${ref.objectType}::${ref.objectId}`;
    visited.set(key(start), { depth: 0, strength: 1 });

    let frontier: ObjectRef[] = [start];
    for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
      const edges = await this.prisma.objectRelationship.findMany({
        where: {
          workspaceId: actor.workspaceId,
          OR: frontier.flatMap((ref) => [
            { sourceObjectType: ref.objectType, sourceObjectId: ref.objectId },
            { targetObjectType: ref.objectType, targetObjectId: ref.objectId },
          ]),
        },
        orderBy: { strength: 'desc' },
      });

      const nextFrontier: ObjectRef[] = [];
      for (const edge of edges) {
        const strength = edge.strength ?? 0;
        const candidates: ObjectRef[] = [
          { objectType: edge.sourceObjectType, objectId: edge.sourceObjectId },
          { objectType: edge.targetObjectType, objectId: edge.targetObjectId },
        ];
        for (const candidate of candidates) {
          const k = key(candidate);
          if (!visited.has(k)) {
            visited.set(k, { depth, strength });
            nextFrontier.push(candidate);
          }
        }
      }
      frontier = nextFrontier;
    }

    return Array.from(visited.entries())
      .filter(([, v]) => v.depth > 0) // exclude the start node itself
      .map(([k, v]) => {
        const [objectType, objectId] = k.split('::');
        return { depth: v.depth, objectType, objectId, strength: v.strength };
      })
      .sort((a, b) => a.depth - b.depth || b.strength - a.strength);
  }
}
