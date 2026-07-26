-- CreateEnum
CREATE TYPE "SecretAuditAction" AS ENUM ('CREATED', 'ACCESSED', 'ROTATED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AuthorizationDecisionResult" AS ENUM ('ALLOW', 'DENY', 'REQUIRE_APPROVAL');

-- CreateTable
CREATE TABLE "Secret" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "encryptedValue" BYTEA NOT NULL,
    "encryptionProvider" TEXT NOT NULL,
    "encryptionKeyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rotatedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Secret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretAuditLog" (
    "id" TEXT NOT NULL,
    "secretId" TEXT NOT NULL,
    "action" "SecretAuditAction" NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecretAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorizationDecision" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "requestId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "actionType" TEXT NOT NULL,
    "objectType" TEXT,
    "objectId" TEXT,
    "result" "AuthorizationDecisionResult" NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorizationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Secret_scope_idx" ON "Secret"("scope");

-- CreateIndex
CREATE INDEX "Secret_workspaceId_idx" ON "Secret"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Secret_workspaceId_key_version_key" ON "Secret"("workspaceId", "key", "version");

-- CreateIndex
CREATE INDEX "SecretAuditLog_secretId_idx" ON "SecretAuditLog"("secretId");

-- CreateIndex
CREATE INDEX "SecretAuditLog_createdAt_idx" ON "SecretAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuthorizationDecision_workspaceId_idx" ON "AuthorizationDecision"("workspaceId");

-- CreateIndex
CREATE INDEX "AuthorizationDecision_actorType_actorId_idx" ON "AuthorizationDecision"("actorType", "actorId");

-- CreateIndex
CREATE INDEX "AuthorizationDecision_createdAt_idx" ON "AuthorizationDecision"("createdAt");

-- AddForeignKey
ALTER TABLE "SecretAuditLog" ADD CONSTRAINT "SecretAuditLog_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "Secret"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
