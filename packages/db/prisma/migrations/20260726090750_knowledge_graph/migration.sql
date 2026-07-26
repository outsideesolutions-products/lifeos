-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('BELONGS_TO', 'CONTAINS', 'SUPPORTS', 'CREATED_FROM', 'REFERENCES', 'DEPENDS_ON', 'BLOCKS', 'GENERATED', 'ASSIGNED_TO', 'REVIEWED_IN', 'ARCHIVED_WITH');

-- CreateTable
CREATE TABLE "object_relationship" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceObjectType" TEXT NOT NULL,
    "sourceObjectId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "targetObjectType" TEXT NOT NULL,
    "targetObjectId" TEXT NOT NULL,
    "strength" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "object_relationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "object_relationship_workspaceId_idx" ON "object_relationship"("workspaceId");

-- CreateIndex
CREATE INDEX "object_relationship_sourceObjectType_sourceObjectId_idx" ON "object_relationship"("sourceObjectType", "sourceObjectId");

-- CreateIndex
CREATE INDEX "object_relationship_targetObjectType_targetObjectId_idx" ON "object_relationship"("targetObjectType", "targetObjectId");

-- CreateIndex
CREATE INDEX "object_relationship_relationshipType_idx" ON "object_relationship"("relationshipType");

-- CreateIndex
CREATE INDEX "object_relationship_createdAt_idx" ON "object_relationship"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "object_relationship_sourceObjectType_sourceObjectId_relatio_key" ON "object_relationship"("sourceObjectType", "sourceObjectId", "relationshipType", "targetObjectType", "targetObjectId");
