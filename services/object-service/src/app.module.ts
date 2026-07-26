import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { FoldersModule } from './folders/folders.module';
import { TagsModule } from './tags/tags.module';
import { LabelsModule } from './labels/labels.module';
import { ConstitutionModule } from './constitution/constitution.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    FoldersModule,
    TagsModule,
    LabelsModule,
    ConstitutionModule,
  ],
})
export class AppModule {}
