import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

export interface AuthenticatedActor {
  id: string;
  /** The original inbound credentials, forwarded verbatim to the Object
   * Service and AI Memory Service on every downstream call — those
   * services independently re-validate the session and resolve their own
   * workspace scoping. The orchestrator never resolves or caches a
   * workspaceId itself: unlike every other Milestone 1 service it owns no
   * Prisma-backed data of its own, so there is nothing here that needs
   * workspace-scoped storage. */
  cookieHeader?: string;
  authHeader?: string;
}

/**
 * Same delegation pattern as every other service's SessionGuard (see
 * object-service's README for the full rationale) with one difference:
 * this guard has no Prisma dependency and does not resolve a workspace,
 * because the orchestrator is a pure coordinator — it forwards the
 * caller's own credentials to the Object Service and AI Memory Service,
 * which each do their own actor/workspace resolution independently. The
 * Chief of Staff never acts with independent AI credentials in Milestone 1
 * (no separate AI-to-service authentication scheme exists yet).
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
