import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MemoryType } from '@lifeos/db';
import { AuthenticatedActor } from '../auth/session.guard';

export interface MemoryEntryDto {
  id: string;
  memoryType: MemoryType;
  content: string;
  confidence: number | null;
  source: string | null;
  importance: number;
  createdAt: string;
  lastReferencedAt: string;
  expiresAt: string | null;
}

/**
 * Thin HTTP client for the AI Memory Service (services/ai-memory-service).
 * Same forwarding pattern as ConstitutionClientService — the orchestrator
 * never holds its own copy of memory data or independent AI credentials.
 */
@Injectable()
export class MemoryClientService {
  private readonly aiMemoryServiceUrl =
    process.env.AI_MEMORY_SERVICE_URL ?? 'http://localhost:4006';

  async findByType(
    memoryType: MemoryType,
    actor: AuthenticatedActor,
  ): Promise<MemoryEntryDto[]> {
    const response = await fetch(
      `${this.aiMemoryServiceUrl}/api/v1/memories?type=${memoryType}`,
      { headers: this.headers(actor) },
    );
    if (!response.ok) {
      throw new InternalServerErrorException(
        `AI Memory Service findByType(${memoryType}) failed with status ${response.status}`,
      );
    }
    return (await response.json()) as MemoryEntryDto[];
  }

  async create(
    entry: {
      memoryType: MemoryType;
      content: string;
      confidence?: number;
      source?: string;
      importance?: number;
    },
    actor: AuthenticatedActor,
  ): Promise<MemoryEntryDto> {
    const response = await fetch(`${this.aiMemoryServiceUrl}/api/v1/memories`, {
      method: 'POST',
      headers: { ...this.headers(actor), 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      throw new InternalServerErrorException(
        `AI Memory Service create() failed with status ${response.status}`,
      );
    }
    return (await response.json()) as MemoryEntryDto;
  }

  async touch(id: string, actor: AuthenticatedActor): Promise<void> {
    const response = await fetch(
      `${this.aiMemoryServiceUrl}/api/v1/memories/${id}/touch`,
      { method: 'POST', headers: this.headers(actor) },
    );
    if (!response.ok) {
      throw new InternalServerErrorException(
        `AI Memory Service touch(${id}) failed with status ${response.status}`,
      );
    }
  }

  private headers(actor: AuthenticatedActor): Record<string, string> {
    return {
      ...(actor.cookieHeader ? { cookie: actor.cookieHeader } : {}),
      ...(actor.authHeader ? { authorization: actor.authHeader } : {}),
    };
  }
}
