import { Module } from '@nestjs/common';
import { MemoryClientService } from './memory-client.service';

@Module({
  providers: [MemoryClientService],
  exports: [MemoryClientService],
})
export class MemoryModule {}
