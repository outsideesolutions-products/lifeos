import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthorizationModule } from './authorization/authorization.module';

@Module({
  imports: [PrismaModule, HealthModule, AuthorizationModule],
})
export class AppModule {}
