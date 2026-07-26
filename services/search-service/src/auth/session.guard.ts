import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

export interface AuthenticatedActor {
  id: string;
  /** The original inbound credentials, forwarded verbatim to the Object
   * Service and AI Memory Service on every downstream call. Search Service
   * owns no database of its own — per the Engineering Roadmap ("internal
   * services never share a database directly — only through service
   * interfaces"), it composes results entirely from those two services'
   * own HTTP APIs, which independently re-validate the session and
   * resolve their own workspace scoping. */
  cookieHeader?: string;
  authHeader?: string;
}

/**
 * Same delegation pattern as every other service's SessionGuard (see
 * object-service's README for the full rationale), simplified like the
 * AI orchestrator's: no Prisma dependency, no workspace resolution — this
 * service has nothing of its own to scope by workspace.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  private readonly identityServiceUrl =
    process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:4003';

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const cookieHeader = request.headers['cookie'];
    const authHeader = request.headers['authorization'];

    if (!cookieHeader && !authHeader) {
      throw new UnauthorizedException('No session credentials provided');
    }

    const response = await fetch(
      `${this.identityServiceUrl}/api/auth/get-session`,
      {
        headers: {
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
          ...(authHeader ? { authorization: authHeader } : {}),
        },
      },
    );

    if (!response.ok) {
      throw new UnauthorizedException('Session validation failed');
    }

    const body = (await response.json()) as { user?: { id: string } } | null;

    if (!body?.user?.id) {
      throw new UnauthorizedException('No active session');
    }

    const actor: AuthenticatedActor = {
      id: body.user.id,
      cookieHeader,
      authHeader,
    };
    request.actor = actor;
    return true;
  }
}
