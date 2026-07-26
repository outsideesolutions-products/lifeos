import { Module } from '@nestjs/common';
import { ENCRYPTION_PROVIDER } from './encryption-provider.interface';
import { LocalEncryptionProvider } from './local-encryption.provider';

@Module({
  providers: [
    {
      provide: ENCRYPTION_PROVIDER,
      useClass: LocalEncryptionProvider,
    },
  ],
  exports: [ENCRYPTION_PROVIDER],
})
export class EncryptionModule {}
