import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthenticatedActor } from '../auth/session.guard';

export interface SearchResult {
  objectType: string;
  objectId: string;
  title: string;
  snippet: string;
  updatedAt: Date;
}

const SNIPPET_MAX_LENGTH = 200;

function snippet(text: string): string {
  return text.length > SNIPPET_MAX_LENGTH
    ? `${text.slice(0, SNIPPET_MAX_LENGTH)}...`
    : text;
}

const isActive = (entry: { active?: boolean }) => entry.active !== false;

function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  const needle = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(needle));
}

/**
 * Keyword search only (Engineering Roadmap: "keyword search only across
 * whatever objects exist at this point; semantic search deferred until
 * the Vector Database has meaningful content"). Case-insensitive substring
 * matching, no relevance scoring beyond recency — that's the correct scope
 * for a keyword-only search at this stage.
 *
 * Composes results entirely from the Object Service and AI Memory
 * Service's own HTTP APIs, forwarding the caller's session credentials
 * (same pattern as the AI orchestrator's client services) — per the
 * Engineering Roadmap, "internal services never share a database directly
 * — only through service interfaces." Folder/Tag/Label search is pushed
 * down to Object Service's own `?q=` filtering (those collections can grow
 * large); Personal Constitution search is filtered here after a single
 * fetch, since that collection is inherently small (a handful of entries
 * per category); AI Memory search is pushed down to AI Memory Service's
 * dedicated `/memories/search` endpoint.
 *
 * The two system-singleton Constitutions (Product, AI) are deliberately
 * excluded — they are single, always-present reference documents, not
 * content a user searches for among many.
 */
@Injectable()
export class SearchService {
  private readonly objectServiceUrl =
    process.env.OBJECT_SERVICE_URL ?? 'http://localhost:4004';
  private readonly aiMemoryServiceUrl =
    process.env.AI_MEMORY_SERVICE_URL ?? 'http://localhost:4006';

  async search(query: string, actor: AuthenticatedActor): Promise<SearchResult[]> {
    const [folders, tags, labels, personal, memories] = await Promise.all([
      this.get<{ id: string; name: string; updatedAt: string }[]>(
        `${this.objectServiceUrl}/api/v1/folders?q=${encodeURIComponent(query)}`,
        actor,
      ),
      this.get<{ id: string; name: string; updatedAt: string }[]>(
        `${this.objectServiceUrl}/api/v1/tags?q=${encodeURIComponent(query)}`,
        actor,
      ),
      this.get<{ id: string; name: string; updatedAt: string }[]>(
        `${this.objectServiceUrl}/api/v1/labels?q=${encodeURIComponent(query)}`,
        actor,
      ),
      this.get<PersonalConstitutionResponse>(
        `${this.objectServiceUrl}/api/v1/constitution/personal`,
        actor,
      ),
      this.get<
        { id: string; memoryType: string; content: string; createdAt: string }[]
      >(
        `${this.aiMemoryServiceUrl}/api/v1/memories/search?q=${encodeURIComponent(query)}`,
        actor,
      ),
    ]);

    const results: SearchResult[] = [
      ...folders.map((f) => ({
        objectType: 'Folder',
        objectId: f.id,
        title: f.name,
        snippet: f.name,
        updatedAt: new Date(f.updatedAt),
      })),
      ...tags.map((t) => ({
        objectType: 'Tag',
        objectId: t.id,
        title: t.name,
        snippet: t.name,
        updatedAt: new Date(t.updatedAt),
      })),
      ...labels.map((l) => ({
        objectType: 'Label',
        objectId: l.id,
        title: l.name,
        snippet: l.name,
        updatedAt: new Date(l.updatedAt),
      })),
      ...this.searchPersonalConstitution(query, personal),
      ...memories.map((m) => ({
        objectType: 'MemoryEntry',
        objectId: m.id,
        title: m.memoryType,
        snippet: snippet(m.content),
        updatedAt: new Date(m.createdAt),
      })),
    ];

    return results.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  private searchPersonalConstitution(
    query: string,
    personal: PersonalConstitutionResponse,
  ): SearchResult[] {
    const results: SearchResult[] = [];

    for (const v of personal.visionStatements.filter(isActive)) {
      if (matches(query, v.title, v.statement)) {
        results.push({
          objectType: 'PersonalConstitutionVisionStatement',
          objectId: v.id,
          title: v.title,
          snippet: snippet(v.statement),
          updatedAt: new Date(v.updatedAt),
        });
      }
    }
    for (const v of personal.identityStatements.filter(isActive)) {
      if (matches(query, v.statement)) {
        results.push({
          objectType: 'PersonalConstitutionIdentityStatement',
          objectId: v.id,
          title: 'Identity Statement',
          snippet: snippet(v.statement),
          updatedAt: new Date(v.updatedAt),
        });
      }
    }
    for (const v of personal.values.filter(isActive)) {
      if (matches(query, v.name, v.description)) {
        results.push({
          objectType: 'PersonalConstitutionValue',
          objectId: v.id,
          title: v.name,
          snippet: snippet(v.description ?? v.name),
          updatedAt: new Date(v.updatedAt),
        });
      }
    }
    for (const v of personal.nonNegotiables.filter(isActive)) {
      if (matches(query, v.statement)) {
        results.push({
          objectType: 'PersonalConstitutionNonNegotiable',
          objectId: v.id,
          title: 'Non-Negotiable',
          snippet: snippet(v.statement),
          updatedAt: new Date(v.updatedAt),
        });
      }
    }
    for (const v of personal.decisionPrinciples) {
      if (matches(query, v.principle, v.description)) {
        results.push({
          objectType: 'PersonalConstitutionDecisionPrinciple',
          objectId: v.id,
          title: snippet(v.principle),
          snippet: snippet(v.description ?? v.principle),
          updatedAt: new Date(v.updatedAt),
        });
      }
    }
    for (const v of personal.boundaries.filter(isActive)) {
      if (matches(query, v.statement, v.description)) {
        results.push({
          objectType: 'PersonalConstitutionBoundary',
          objectId: v.id,
          title: 'Boundary',
          snippet: snippet(v.statement),
          updatedAt: new Date(v.updatedAt),
        });
      }
    }
    for (const v of personal.successDefinitions) {
      if (matches(query, v.category, v.definition)) {
        results.push({
          objectType: 'PersonalConstitutionSuccessDefinition',
          objectId: v.id,
          title: v.category,
          snippet: snippet(v.definition),
          updatedAt: new Date(v.updatedAt),
        });
      }
    }

    return results;
  }

  private async get<T>(url: string, actor: AuthenticatedActor): Promise<T> {
    const response = await fetch(url, {
      headers: {
        ...(actor.cookieHeader ? { cookie: actor.cookieHeader } : {}),
        ...(actor.authHeader ? { authorization: actor.authHeader } : {}),
      },
    });
    if (!response.ok) {
      throw new InternalServerErrorException(
        `Request to ${url} failed with status ${response.status}`,
      );
    }
    return (await response.json()) as T;
  }
}

interface ActiveStatement {
  id: string;
  active?: boolean;
  updatedAt: string;
}

interface PersonalConstitutionResponse {
  visionStatements: (ActiveStatement & { title: string; statement: string })[];
  identityStatements: (ActiveStatement & { statement: string })[];
  values: (ActiveStatement & { name: string; description: string | null })[];
  nonNegotiables: (ActiveStatement & { statement: string })[];
  decisionPrinciples: (ActiveStatement & {
    principle: string;
    description: string | null;
  })[];
  boundaries: (ActiveStatement & {
    statement: string;
    description: string | null;
  })[];
  successDefinitions: (ActiveStatement & {
    category: string;
    definition: string;
  })[];
}
