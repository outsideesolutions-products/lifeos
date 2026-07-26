import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth's client SDK talks directly to the Identity Service's
 * `/api/auth/*` routes (not through Next.js) — the browser sends the
 * session cookie Better Auth sets on the Identity Service's own origin,
 * and CORS + `credentials: 'include'` (configured here) let it reach every
 * other Milestone 1 service too, since the cookie's Domain scoping
 * (`localhost`) covers all of the local ports regardless of port number.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_IDENTITY_SERVICE_URL ?? 'http://localhost:4003',
  basePath: '/api/auth',
  fetchOptions: {
    credentials: 'include',
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
