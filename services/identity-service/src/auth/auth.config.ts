import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { passkey } from '@better-auth/passkey';
import { PrismaClient } from '@lifeos/db';

/**
 * Identity Service auth configuration (architecture-decisions.md, Round 1
 * Decision 3): email/password, Google OAuth, optional Apple Sign In, MFA
 * (two-factor), passkeys, session/device management, revocation, account
 * recovery. Built multi-user-capable even though V1 exposes a single
 * personal workspace — Better Auth's User/Session/Account model already
 * assumes multiple users; nothing here restricts LifeOS to one.
 *
 * This file is also the source of truth the `@better-auth/cli generate`
 * command reads to produce the Prisma schema fragment for
 * packages/db/prisma/schema.prisma — see the `auth:generate-schema` script
 * in package.json. Do not hand-edit the generated Better Auth models in
 * schema.prisma; regenerate them from this config instead.
 */
export const prisma = new PrismaClient();

export const auth = betterAuth({
  appName: 'LifeOS',
  baseURL:
    process.env.IDENTITY_SERVICE_BASE_URL ??
    `http://localhost:${process.env.IDENTITY_SERVICE_PORT ?? 4003}`,
  basePath: '/api/auth',
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    // Email verification requires a transactional email integration, which
    // is out of Milestone 1's scope (Integration Layer lands Milestone 3).
    // Not a placeholder — this is the correct, explicit Milestone 1
    // boundary: password auth is fully functional, verification email
    // delivery is a real Milestone 3 dependency (Gmail/SMTP integration).
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
    },
    ...(process.env.APPLE_OAUTH_CLIENT_ID
      ? {
          apple: {
            clientId: process.env.APPLE_OAUTH_CLIENT_ID,
            clientSecret: process.env.APPLE_OAUTH_CLIENT_SECRET ?? '',
            appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER,
          },
        }
      : {}),
  },
  plugins: [
    twoFactor({
      issuer: 'LifeOS',
    }),
    passkey({
      rpID: process.env.PASSKEY_RP_ID ?? 'localhost',
      rpName: 'LifeOS',
      origin: process.env.PASSKEY_ORIGIN ?? 'http://localhost:3000',
    }),
  ],
  session: {
    // Trusted devices / session revocation: Better Auth tracks every
    // session as its own row (device + IP + user agent), which is what
    // "device management" and "session revocation" (Round 1 Decision 3)
    // are built on — see SessionsController for the endpoints exposing
    // this to the user.
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once per day of activity
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Provision the user's single personal workspace and an empty
        // Personal Constitution the moment their account exists — Round 1
        // Decision 3's "single personal workspace" and Round 4 Decision 5's
        // Cold Start Phase 1 both assume this exists from the start, not
        // as a separate manual step. The Product/AI Constitution
        // singletons are seeded once at deploy time (see prisma/seed.ts),
        // not per-user.
        after: async (user: { id: string }) => {
          const workspace = await prisma.workspace.create({
            data: {
              ownerId: user.id,
              name: `${user.id}'s Workspace`,
              createdBy: user.id,
              updatedBy: user.id,
              classification: 3,
            },
          });

          await prisma.personalConstitution.create({
            data: {
              workspaceId: workspace.id,
              ownerId: user.id,
              status: 'INITIALIZATION',
              createdBy: user.id,
              updatedBy: user.id,
              classification: 1,
            },
          });
        },
      },
    },
  },
  trustedOrigins: (process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim()),
});

export type Auth = typeof auth;
