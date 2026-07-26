import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { MemoriesModule } from './memories/memories.module';

@Module({
  imports: [PrismaModule, HealthModule, MemoriesModule],
})
export class AppModule {}
