-- AlterTable
ALTER TABLE "personal_constitution" ALTER COLUMN "classification" SET DEFAULT 3;

-- AlterTable
ALTER TABLE "personal_constitution_boundary" ALTER COLUMN "classification" SET DEFAULT 3;

-- AlterTable
ALTER TABLE "personal_constitution_decision_principle" ALTER COLUMN "classification" SET DEFAULT 3;

-- AlterTable
ALTER TABLE "personal_constitution_identity_statement" ALTER COLUMN "classification" SET DEFAULT 3;

-- AlterTable
ALTER TABLE "personal_constitution_non_negotiable" ALTER COLUMN "classification" SET DEFAULT 3;

-- AlterTable
ALTER TABLE "personal_constitution_success_definition" ALTER COLUMN "classification" SET DEFAULT 3;

-- AlterTable
ALTER TABLE "personal_constitution_value" ALTER COLUMN "classification" SET DEFAULT 3;

-- AlterTable
ALTER TABLE "personal_constitution_vision_statement" ALTER COLUMN "classification" SET DEFAULT 3;

-- Backfill: rows created before this migration under the old Tier 1
-- default (architecture-decisions.md Round 10) must also move to Tier 3,
-- not just new rows. No-op on a fresh database.
UPDATE "personal_constitution" SET "classification" = 3 WHERE "classification" = 1;
UPDATE "personal_constitution_vision_statement" SET "classification" = 3 WHERE "classification" = 1;
UPDATE "personal_constitution_identity_statement" SET "classification" = 3 WHERE "classification" = 1;
UPDATE "personal_constitution_value" SET "classification" = 3 WHERE "classification" = 1;
UPDATE "personal_constitution_non_negotiable" SET "classification" = 3 WHERE "classification" = 1;
UPDATE "personal_constitution_decision_principle" SET "classification" = 3 WHERE "classification" = 1;
UPDATE "personal_constitution_boundary" SET "classification" = 3 WHERE "classification" = 1;
UPDATE "personal_constitution_success_definition" SET "classification" = 3 WHERE "classification" = 1;
