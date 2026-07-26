import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { SecretsModule } from './secrets/secrets.module';

@Module({
  imports: [PrismaModule, HealthModule, SecretsModule],
})
export class AppModule {}
