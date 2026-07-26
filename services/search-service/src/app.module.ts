import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [PrismaModule, HealthModule, SearchModule],
})
export class AppModule {}
