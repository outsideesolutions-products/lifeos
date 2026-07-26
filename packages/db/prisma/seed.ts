/**
 * Seeds the two system-level Constitution singletons (Round 7, Decision 1).
 * Idempotent — safe to run multiple times; upserts by title rather than
 * inserting duplicates.
 *
 * Product Constitution content is drawn directly from the frozen Product
 * Vision document. AI Constitution content is drawn from Round 6,
 * Decision 3's example rules. Both are "effectively immutable except
 * through explicit architectural revisions" — this seed script is that
 * mechanism, run deliberately, not something application code calls.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingProduct = await prisma.productConstitution.findFirst();
  if (!existingProduct) {
    await prisma.productConstitution.create({
      data: {
        title: 'LifeOS Product Constitution',
        purpose:
          'LifeOS exists to reduce the mental burden of managing every aspect of a life by becoming the central intelligence that organizes information, tracks commitments, anticipates needs, and helps consistently execute on goals. Its purpose is not to help remember a life. Its purpose is to help run a life.',
        philosophy:
          'Your life is a system. Every outcome is the result of interconnected systems rather than isolated actions. If information is disorganized, execution becomes inconsistent. LifeOS exists to create clarity.',
        principles: [
          'Everything has one home.',
          'Nothing important depends on memory.',
          'Capture first. Organize later.',
          'The system should think, not simply display information.',
          'Everything connects — nothing exists in isolation.',
          'Reduce cognitive load — if a feature does not reduce the amount a person needs to think, it should not exist.',
        ],
        longTermVision:
          'LifeOS should evolve into a true digital Chief of Staff that understands priorities, rhythms, strengths, and recurring challenges well enough to proactively help make better decisions — without ever making decisions on the user’s behalf.',
        createdBy: 'system',
        updatedBy: 'system',
        classification: 3,
      },
    });
    console.log('Seeded ProductConstitution');
  } else {
    console.log('ProductConstitution already exists, skipping');
  }

  const existingAi = await prisma.aIConstitution.findFirst();
  if (!existingAi) {
    await prisma.aIConstitution.create({
      data: {
        title: 'LifeOS AI Constitution',
        rules: [
          'Never fabricate facts.',
          'Explain reasoning.',
          'Protect privacy.',
          'Respect authorization.',
          'Optimize for long-term benefit.',
          'Remain aligned with the Product Constitution.',
          'Distinguish observations from assumptions, and predictions from certainties.',
          'Never take an action outside current authorization without explicit approval.',
        ],
        createdBy: 'system',
        updatedBy: 'system',
        classification: 3,
      },
    });
    console.log('Seeded AIConstitution');
  } else {
    console.log('AIConstitution already exists, skipping');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
