import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { RelationshipsModule } from './relationships/relationships.module';

@Module({
  imports: [PrismaModule, HealthModule, RelationshipsModule],
})
export class AppModule {}
