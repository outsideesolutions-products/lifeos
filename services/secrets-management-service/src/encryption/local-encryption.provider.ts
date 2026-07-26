import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { EncryptionProvider } from './encryption-provider.interface';

/**
 * DEV-ONLY envelope encryption using a single master key from the
 * environment (`SECRETS_LOCAL_MASTER_KEY_BASE64`), AES-256-GCM.
 *
 * This is explicitly NOT the production backend — see the open question
 * documented in `encryption-provider.interface.ts`. This provider exists
 * so Milestone 0 can be built and tested locally without a cloud KMS
 * dependency; it must not be selected outside local development.
 */
@Injectable()
export class LocalEncryptionProvider implements EncryptionProvider {
  readonly providerName = 'local';
  private readonly keyId = 'local-v1';

  private getMasterKey(): Buffer {
    const raw = process.env.SECRETS_LOCAL_MASTER_KEY_BASE64;
    if (!raw) {
      throw new Error(
        'SECRETS_LOCAL_MASTER_KEY_BASE64 is not set. Generate one with ' +
          '`openssl rand -base64 32` for local development only.',
      );
    }
    const key = Buffer.from(raw, 'base64');
    if (key.length !== 32) {
      throw new Error(
        'SECRETS_LOCAL_MASTER_KEY_BASE64 must decode to exactly 32 bytes (AES-256).',
      );
    }
    return key;
  }

  async encrypt(
    plaintext: Buffer,
  ): Promise<{ ciphertext: Buffer; keyId: string }> {
    const key = this.getMasterKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    // Stored format: iv (12) || authTag (16) || ciphertext
    const ciphertext = Buffer.concat([iv, authTag, encrypted]);
    return { ciphertext, keyId: this.keyId };
  }

  async decrypt(ciphertext: Buffer, keyId: string): Promise<Buffer> {
    if (keyId !== this.keyId) {
      throw new Error(
        `Unknown local key id "${keyId}" — cannot decrypt with current master key.`,
      );
    }
    const key = this.getMasterKey();
    const iv = ciphertext.subarray(0, 12);
    const authTag = ciphertext.subarray(12, 28);
    const encrypted = ciphertext.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}
