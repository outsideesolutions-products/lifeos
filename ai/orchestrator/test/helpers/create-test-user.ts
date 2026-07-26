/**
 * Every Milestone 1 service's SessionGuard delegates session validation to
 * the Identity Service's own `/api/auth/get-session` endpoint (see each
 * service's README for the rationale) — there is no way to fabricate a
 * valid session locally. e2e tests for every OTHER service therefore
 * require a real, running Identity Service to sign up against, exactly
 * like the manual curl verification used throughout Milestone 1
 * development. Set IDENTITY_SERVICE_URL if it isn't on the default port.
 */
const IDENTITY_SERVICE_URL =
  process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:4003';

// Better Auth's CSRF protection (auth.config.ts's `trustedOrigins`) rejects
// requests with no Origin header at all — Node's fetch doesn't send one for
// a plain server-to-server call the way a browser would, so it has to be
// set explicitly here. Must be one of TRUSTED_ORIGINS.
const TEST_ORIGIN =
  (process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000').split(',')[0];

export interface TestUser {
  userId: string;
  cookie: string;
}

let counter = 0;

export async function createTestUser(namePrefix: string): Promise<TestUser> {
  counter += 1;
  const email = `${namePrefix}-${Date.now()}-${counter}@example.com`;
  const response = await fetch(`${IDENTITY_SERVICE_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: TEST_ORIGIN },
    body: JSON.stringify({
      name: namePrefix,
      email,
      password: 'TestPassword123!',
    }),
  });

  if (!response.ok) {
    throw new Error(
      `createTestUser: sign-up failed with status ${response.status}. ` +
        `Is the Identity Service running at ${IDENTITY_SERVICE_URL}?`,
    );
  }

  // Node's fetch exposes multiple Set-Cookie headers via getSetCookie()
  // (a single .get('set-cookie') call would incorrectly join them with
  // commas, which breaks on cookie values containing commas/dates).
  const setCookies = response.headers.getSetCookie();
  if (setCookies.length === 0) {
    throw new Error('createTestUser: sign-up response had no Set-Cookie header');
  }
  const cookie = setCookies.map((c) => c.split(';')[0].trim()).join('; ');

  const body = (await response.json()) as { user: { id: string } };
  return { userId: body.user.id, cookie };
}
