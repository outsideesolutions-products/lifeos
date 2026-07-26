import { Injectable, NotFoundException } from '@nestjs/common';
import { MemoryType } from '@lifeos/db';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemoryDto } from './dto/create-memory.dto';
import { AuthenticatedActor } from '../auth/session.guard';

const WORKING_MEMORY_DEFAULT_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

@Injectable()
export class MemoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMemoryDto, actor: AuthenticatedActor) {
    let expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    // Working Memory is "cleared automatically" within minutes to hours
    // (Cognitive Architecture) — if the caller didn't specify an expiry,
    // apply the tier's own default rather than leaving it permanent.
    if (dto.memoryType === MemoryType.WORKING && !expiresAt) {
      expiresAt = new Date(Date.now() + WORKING_MEMORY_DEFAULT_TTL_MS);
    }

    return this.prisma.memoryEntry.create({
      data: {
        workspaceId: actor.workspaceId,
        memoryType: dto.memoryType,
        content: dto.content,
        confidence: dto.confidence,
        source: dto.source,
        relatedObjects: (dto.relatedObjects ?? []) as object,
        importance: dto.importance ?? 0,
        expiresAt,
        createdBy: actor.id,
      },
    });
  }

  /** Excludes expired entries automatically — callers never need to filter
   * Working Memory themselves. */
  async findByType(memoryType: MemoryType, actor: AuthenticatedActor) {
    return this.prisma.memoryEntry.findMany({
      where: {
        workspaceId: actor.workspaceId,
        memoryType,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ importance: 'desc' }, { lastReferencedAt: 'desc' }],
    });
  }

  /** Marks a memory as just-used, per the Context Retrieval ranking
   * factor "frequency of interaction" / "recency" (Round 3 Decision 4) —
   * the Chief of Staff calls this whenever it actually draws on a memory
   * while assembling context, so ranking improves over time without a
   * separate analytics pass. */
  async touch(id: string, actor: AuthenticatedActor) {
    await this.findOneOrThrow(id, actor);
    return this.prisma.memoryEntry.update({
      where: { id },
      data: { lastReferencedAt: new Date() },
    });
  }

  async remove(id: string, actor: AuthenticatedActor) {
    await this.findOneOrThrow(id, actor);
    await this.prisma.memoryEntry.delete({ where: { id } });
  }

  private async findOneOrThrow(id: string, actor: AuthenticatedActor) {
    const entry = await this.prisma.memoryEntry.findFirst({
      where: { id, workspaceId: actor.workspaceId },
    });
    if (!entry) throw new NotFoundException(`No memory entry with id "${id}"`);
    return entry;
  }
}
