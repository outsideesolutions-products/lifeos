import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

/**
 * Keyword search only (Engineering Roadmap: "keyword search only across
 * whatever objects exist at this point; semantic search deferred until
 * the Vector Database has meaningful content"). Case-insensitive substring
 * matching against each searchable model's text fields, no relevance
 * scoring beyond recency — that's the correct scope for a keyword-only
 * search at this stage, not a placeholder for something more sophisticated
 * that was supposed to be here already.
 *
 * Queries the shared database directly via Prisma, same as every other
 * Milestone 1 service (there is one Postgres database and one Prisma
 * schema behind @lifeos/db — see this service's SessionGuard). Searches
 * every workspace-scoped object type that exists as of Milestone 1: the
 * Core Objects (Folder, Tag, Label), the Personal Constitution's 7
 * sub-entities, and AI Memory. The two system-singleton Constitutions
 * (Product, AI) are deliberately excluded — they are single, always-present
 * reference documents, not content a user searches for among many.
 */
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, actor: AuthenticatedActor): Promise<SearchResult[]> {
    const { workspaceId } = actor;
    const contains = { contains: query, mode: 'insensitive' as const };

    const [
      folders,
      tags,
      labels,
      visionStatements,
      identityStatements,
      values,
      nonNegotiables,
      decisionPrinciples,
      boundaries,
      successDefinitions,
      memories,
    ] = await Promise.all([
      this.prisma.folder.findMany({
        where: { workspaceId, deletedAt: null, name: contains },
      }),
      this.prisma.tag.findMany({
        where: { workspaceId, deletedAt: null, name: contains },
      }),
      this.prisma.label.findMany({
        where: { workspaceId, deletedAt: null, name: contains },
      }),
      this.prisma.personalConstitutionVisionStatement.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          OR: [{ title: contains }, { statement: contains }],
        },
      }),
      this.prisma.personalConstitutionIdentityStatement.findMany({
        where: { workspaceId, deletedAt: null, statement: contains },
      }),
      this.prisma.personalConstitutionValue.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          OR: [{ name: contains }, { description: contains }],
        },
      }),
      this.prisma.personalConstitutionNonNegotiable.findMany({
        where: { workspaceId, deletedAt: null, statement: contains },
      }),
      this.prisma.personalConstitutionDecisionPrinciple.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          OR: [{ principle: contains }, { description: contains }],
        },
      }),
      this.prisma.personalConstitutionBoundary.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          OR: [{ statement: contains }, { description: contains }],
        },
      }),
      this.prisma.personalConstitutionSuccessDefinition.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          OR: [{ category: contains }, { definition: contains }],
        },
      }),
      this.prisma.memoryEntry.findMany({
        where: {
          workspaceId,
          content: contains,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
    ]);

    const results: SearchResult[] = [
      ...folders.map((f) => ({
        objectType: 'Folder',
        objectId: f.id,
        title: f.name,
        snippet: f.name,
        updatedAt: f.updatedAt,
      })),
      ...tags.map((t) => ({
        objectType: 'Tag',
        objectId: t.id,
        title: t.name,
        snippet: t.name,
        updatedAt: t.updatedAt,
      })),
      ...labels.map((l) => ({
        objectType: 'Label',
        objectId: l.id,
        title: l.name,
        snippet: l.name,
        updatedAt: l.updatedAt,
      })),
      ...visionStatements.map((v) => ({
        objectType: 'PersonalConstitutionVisionStatement',
        objectId: v.id,
        title: v.title,
        snippet: snippet(v.statement),
        updatedAt: v.updatedAt,
      })),
      ...identityStatements.map((v) => ({
        objectType: 'PersonalConstitutionIdentityStatement',
        objectId: v.id,
        title: 'Identity Statement',
        snippet: snippet(v.statement),
        updatedAt: v.updatedAt,
      })),
      ...values.map((v) => ({
        objectType: 'PersonalConstitutionValue',
        objectId: v.id,
        title: v.name,
        snippet: snippet(v.description ?? v.name),
        updatedAt: v.updatedAt,
      })),
      ...nonNegotiables.map((v) => ({
        objectType: 'PersonalConstitutionNonNegotiable',
        objectId: v.id,
        title: 'Non-Negotiable',
        snippet: snippet(v.statement),
        updatedAt: v.updatedAt,
      })),
      ...decisionPrinciples.map((v) => ({
        objectType: 'PersonalConstitutionDecisionPrinciple',
        objectId: v.id,
        title: snippet(v.principle),
        snippet: snippet(v.description ?? v.principle),
        updatedAt: v.updatedAt,
      })),
      ...boundaries.map((v) => ({
        objectType: 'PersonalConstitutionBoundary',
        objectId: v.id,
        title: 'Boundary',
        snippet: snippet(v.statement),
        updatedAt: v.updatedAt,
      })),
      ...successDefinitions.map((v) => ({
        objectType: 'PersonalConstitutionSuccessDefinition',
        objectId: v.id,
        title: v.category,
        snippet: snippet(v.definition),
        updatedAt: v.updatedAt,
      })),
      ...memories.map((m) => ({
        objectType: 'MemoryEntry',
        objectId: m.id,
        title: m.memoryType,
        snippet: snippet(m.content),
        updatedAt: m.createdAt,
      })),
    ];

    return results.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }
}
