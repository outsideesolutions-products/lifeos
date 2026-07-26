import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthenticatedActor } from '../auth/session.guard';

export interface ProductConstitution {
  title: string;
  purpose: string;
  philosophy: string;
  principles: string[];
  longTermVision: string;
}

export interface AIConstitution {
  title: string;
  rules: string[];
}

interface ActiveStatement {
  active?: boolean;
}

export interface PersonalConstitution {
  status: 'INITIALIZATION' | 'LEARNING' | 'MATURE' | string;
  visionStatements: (ActiveStatement & { title: string; statement: string })[];
  identityStatements: (ActiveStatement & { statement: string })[];
  values: (ActiveStatement & { name: string; description: string | null })[];
  nonNegotiables: (ActiveStatement & { statement: string })[];
  decisionPrinciples: { principle: string; description: string | null }[];
  boundaries: (ActiveStatement & { statement: string })[];
  successDefinitions: { category: string; definition: string }[];
}

/**
 * Thin HTTP client for the Object Service's Constitution endpoints
 * (services/object-service/src/constitution). The orchestrator holds no
 * Prisma connection of its own — it forwards the caller's own session
 * credentials, exactly like every downstream call this service makes, per
 * this package's session.guard.ts.
 */
@Injectable()
export class ConstitutionClientService {
  private readonly objectServiceUrl =
    process.env.OBJECT_SERVICE_URL ?? 'http://localhost:4004';

  async getProductConstitution(
    actor: AuthenticatedActor,
  ): Promise<ProductConstitution> {
    return this.get('/api/v1/constitution/product', actor);
  }

  async getAIConstitution(actor: AuthenticatedActor): Promise<AIConstitution> {
    return this.get('/api/v1/constitution/ai', actor);
  }

  async getPersonalConstitution(
    actor: AuthenticatedActor,
  ): Promise<PersonalConstitution> {
    return this.get('/api/v1/constitution/personal', actor);
  }

  private async get<T>(path: string, actor: AuthenticatedActor): Promise<T> {
    const response = await fetch(`${this.objectServiceUrl}${path}`, {
      headers: {
        ...(actor.cookieHeader ? { cookie: actor.cookieHeader } : {}),
        ...(actor.authHeader ? { authorization: actor.authHeader } : {}),
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Object Service request to ${path} failed with status ${response.status}`,
      );
    }

    return (await response.json()) as T;
  }
}
