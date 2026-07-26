-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('WORKING', 'OPERATIONAL', 'LONG_TERM', 'SEMANTIC', 'BEHAVIORAL', 'DECISION', 'CONVERSATION', 'CONSTITUTION');

-- CreateTable
CREATE TABLE "memory_entry" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "memoryType" "MemoryType" NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "source" TEXT,
    "relatedObjects" JSONB NOT NULL DEFAULT '[]',
    "importance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReferencedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "memory_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memory_entry_workspaceId_memoryType_idx" ON "memory_entry"("workspaceId", "memoryType");

-- CreateIndex
CREATE INDEX "memory_entry_expiresAt_idx" ON "memory_entry"("expiresAt");

-- CreateIndex
CREATE INDEX "memory_entry_importance_idx" ON "memory_entry"("importance");
