import { Module } from '@nestjs/common';
import { ConstitutionService } from './constitution.service';
import { ConstitutionController } from './constitution.controller';

@Module({
  controllers: [ConstitutionController],
  providers: [ConstitutionService],
})
export class ConstitutionModule {}
