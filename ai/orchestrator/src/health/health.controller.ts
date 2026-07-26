import { Controller, Get } from '@nestjs/common';

/**
 * Unlike every other Milestone 1 service, the orchestrator has no Prisma
 * connection of its own to check (see session.guard.ts) — it owns no
 * database. This is a plain liveness check; the health of the Object
 * Service, AI Memory Service, and Identity Service it depends on is each
 * of those services' own responsibility to report, not something this
 * check re-derives by pinging them (that would make this service's health
 * fail on a transient dependency blip it has no way to route around).
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
