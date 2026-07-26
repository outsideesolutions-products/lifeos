/**
 * Abstract encryption backend for the Secrets Management Service.
 *
 * Mirrors the AI Provider Interface pattern (Round 1, Decision 5): no
 * business logic in this service should depend on a specific KMS/vault
 * vendor. `LocalEncryptionProvider` is the only implementation that exists
 * today and is DEV-ONLY (see its own file header).
 *
 * OPEN QUESTION — not yet decided, flagging per governance rather than
 * assuming: which production-grade provider backs this in staging/prod?
 * The locked technology stack (architecture-decisions.md, Round 6,
 * Decision 4) names Docker/GitHub Actions/Vercel/Railway/Fly.io as
 * infrastructure but does not name a KMS or secrets vault. Candidates
 * consistent with that stack's "provider-agnostic where practical"
 * instruction: a cloud KMS (AWS KMS, GCP KMS) if a cloud provider is
 * chosen for backend hosting, or HashiCorp Vault / Doppler / Infisical if
 * a self-hosted or vendor-neutral option is preferred. This needs an
 * explicit decision before Milestone 0 is considered done for any
 * environment beyond local development.
 */
export interface EncryptionProvider {
  readonly providerName: string;

  /** Encrypts a plaintext value, returning ciphertext plus the key
   * identifier/version used, so it can be recorded on the Secret row. */
  encrypt(plaintext: Buffer): Promise<{ ciphertext: Buffer; keyId: string }>;

  /** Decrypts a ciphertext previously produced by `encrypt`, using the
   * recorded key identifier to select the correct key/version. */
  decrypt(ciphertext: Buffer, keyId: string): Promise<Buffer>;
}

export const ENCRYPTION_PROVIDER = Symbol('ENCRYPTION_PROVIDER');
