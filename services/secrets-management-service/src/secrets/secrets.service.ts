import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ENCRYPTION_PROVIDER,
  EncryptionProvider,
} from '../encryption/encryption-provider.interface';
import { Actor } from '../common/actor.decorator';

@Injectable()
export class SecretsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENCRYPTION_PROVIDER)
    private readonly encryption: EncryptionProvider,
  ) {}

  /** Creates a new secret. The plaintext value is encrypted before it ever
   * touches the database and is not retained in memory beyond this call. */
  async create(
    input: { key: string; scope: string; value: string; workspaceId?: string },
    actor: Actor,
  ) {
    const { ciphertext, keyId } = await this.encryption.encrypt(
      Buffer.from(input.value, 'utf8'),
    );

    const secret = await this.prisma.secret.create({
      data: {
        key: input.key,
        scope: input.scope,
        workspaceId: input.workspaceId,
        encryptedValue: ciphertext,
        encryptionProvider: this.encryption.providerName,
        encryptionKeyId: keyId,
      },
    });

    await this.audit(secret.id, 'CREATED', actor);
    return this.toMetadata(secret);
  }

  /** Lists secret metadata only. Values are never included in a list
   * response, regardless of caller. */
  async list(scope?: string) {
    const secrets = await this.prisma.secret.findMany({
      where: {
        scope,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return secrets.map((s) => this.toMetadata(s));
  }

  /**
   * Returns the decrypted value. This is an internal, service-to-service
   * operation only — per "application code should never access raw
   * secrets directly," this endpoint must eventually be gated behind
   * service-to-service authentication (mTLS or private network only, not
   * exposed to end users). That gating is not yet implemented in this
   * Milestone 0 skeleton since the Identity Service doesn't exist yet.
   */
  async getValue(id: string, actor: Actor): Promise<string> {
    const secret = await this.findActiveOrThrow(id);
    const plaintext = await this.encryption.decrypt(
      secret.encryptedValue,
      secret.encryptionKeyId,
    );
    await this.audit(secret.id, 'ACCESSED', actor);
    return plaintext.toString('utf8');
  }

  async rotate(id: string, newValue: string, actor: Actor) {
    const secret = await this.findActiveOrThrow(id);
    const { ciphertext, keyId } = await this.encryption.encrypt(
      Buffer.from(newValue, 'utf8'),
    );

    const updated = await this.prisma.secret.update({
      where: { id: secret.id },
      data: {
        encryptedValue: ciphertext,
        encryptionProvider: this.encryption.providerName,
        encryptionKeyId: keyId,
        version: { increment: 1 },
        rotatedAt: new Date(),
      },
    });

    await this.audit(secret.id, 'ROTATED', actor);
    return this.toMetadata(updated);
  }

  async revoke(id: string, actor: Actor) {
    const secret = await this.findActiveOrThrow(id);
    const updated = await this.prisma.secret.update({
      where: { id: secret.id },
      data: { revokedAt: new Date() },
    });
    await this.audit(secret.id, 'REVOKED', actor);
    return this.toMetadata(updated);
  }

  private async findActiveOrThrow(id: string) {
    const secret = await this.prisma.secret.findUnique({ where: { id } });
    if (!secret || secret.revokedAt) {
      throw new NotFoundException(`No active secret with id "${id}"`);
    }
    return secret;
  }

  private async audit(
    secretId: string,
    action: 'CREATED' | 'ACCESSED' | 'ROTATED' | 'REVOKED',
    actor: Actor,
  ) {
    await this.prisma.secretAuditLog.create({
      data: {
        secretId,
        action,
        actorType: actor.type,
        actorId: actor.id,
      },
    });
  }

  /** Strips the encrypted value and key material out of anything returned
   * over the API — only metadata ever leaves this service except via the
   * explicit `getValue` internal path. */
  private toMetadata<
    T extends {
      id: string;
      key: string;
      scope: string;
      workspaceId: string | null;
      version: number;
      createdAt: Date;
      updatedAt: Date;
      rotatedAt: Date | null;
      revokedAt: Date | null;
    },
  >(secret: T) {
    const {
      id,
      key,
      scope,
      workspaceId,
      version,
      createdAt,
      updatedAt,
      rotatedAt,
      revokedAt,
    } = secret;
    return { id, key, scope, workspaceId, version, createdAt, updatedAt, rotatedAt, revokedAt };
  }
}
