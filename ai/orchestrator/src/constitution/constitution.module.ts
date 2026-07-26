import { Module } from '@nestjs/common';
import { ConstitutionClientService } from './constitution-client.service';

@Module({
  providers: [ConstitutionClientService],
  exports: [ConstitutionClientService],
})
export class ConstitutionModule {}
