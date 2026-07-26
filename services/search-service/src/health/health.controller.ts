import { Controller, Get } from '@nestjs/common';

/**
 * Search Service owns no database of its own (see session.guard.ts) —
 * this is a plain liveness check, same as the AI orchestrator's.
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
