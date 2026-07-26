const OBJECT_SERVICE_URL =
  process.env.NEXT_PUBLIC_OBJECT_SERVICE_URL ?? 'http://localhost:4004';
const AI_MEMORY_SERVICE_URL =
  process.env.NEXT_PUBLIC_AI_MEMORY_SERVICE_URL ?? 'http://localhost:4006';
const SEARCH_SERVICE_URL =
  process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL ?? 'http://localhost:4007';
const CHIEF_OF_STAFF_URL =
  process.env.NEXT_PUBLIC_CHIEF_OF_STAFF_URL ?? 'http://localhost:4008';

/**
 * Every backend call from the browser goes through the caller's own
 * session cookie (`credentials: 'include'`) — there is no separate API
 * token or gateway. Each service validates the session itself via its own
 * SessionGuard, exactly as documented in every service's README.
 */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request to ${url} failed (${response.status}): ${body}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface OnboardingStatus {
  coldStartPhase: string;
  onboardingCompletedAt: string | null;
  onboardingDismissedAt: string | null;
}

export const objectServiceApi = {
  getOnboardingStatus: () =>
    request<OnboardingStatus>(`${OBJECT_SERVICE_URL}/api/v1/onboarding/status`),
  completeOnboarding: () =>
    request<OnboardingStatus>(`${OBJECT_SERVICE_URL}/api/v1/onboarding/complete`, {
      method: 'POST',
    }),
  dismissOnboarding: () =>
    request<OnboardingStatus>(`${OBJECT_SERVICE_URL}/api/v1/onboarding/dismiss`, {
      method: 'POST',
    }),
  getPersonalConstitution: () =>
    request<PersonalConstitution>(
      `${OBJECT_SERVICE_URL}/api/v1/constitution/personal`,
    ),
  createConstitutionItem: (type: string, body: Record<string, unknown>) =>
    request(`${OBJECT_SERVICE_URL}/api/v1/constitution/personal/${type}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  removeConstitutionItem: (type: string, id: string) =>
    request(`${OBJECT_SERVICE_URL}/api/v1/constitution/personal/${type}/${id}`, {
      method: 'DELETE',
    }),
};

export const searchServiceApi = {
  search: (query: string) =>
    request<SearchResult[]>(
      `${SEARCH_SERVICE_URL}/api/v1/search?q=${encodeURIComponent(query)}`,
    ),
};

export const chiefOfStaffApi = {
  sendMessage: (message: string) =>
    request<{ response: string; coldStartPhase: string }>(
      `${CHIEF_OF_STAFF_URL}/api/v1/conversation`,
      { method: 'POST', body: JSON.stringify({ message }) },
    ),
};

export const aiMemoryServiceApi = {
  findByType: (memoryType: string) =>
    request<MemoryEntry[]>(
      `${AI_MEMORY_SERVICE_URL}/api/v1/memories?type=${memoryType}`,
    ),
};

export interface SearchResult {
  objectType: string;
  objectId: string;
  title: string;
  snippet: string;
  updatedAt: string;
}

export interface MemoryEntry {
  id: string;
  memoryType: string;
  content: string;
  importance: number;
  createdAt: string;
  lastReferencedAt: string;
}

interface ActiveStatement {
  id: string;
  active?: boolean;
}

export interface PersonalConstitution {
  status: string;
  visionStatements: (ActiveStatement & { title: string; statement: string })[];
  identityStatements: (ActiveStatement & { statement: string })[];
  values: (ActiveStatement & { name: string; description: string | null })[];
  nonNegotiables: (ActiveStatement & { statement: string })[];
  decisionPrinciples: (ActiveStatement & {
    principle: string;
    description: string | null;
  })[];
  boundaries: (ActiveStatement & {
    statement: string;
    description: string | null;
  })[];
  successDefinitions: (ActiveStatement & {
    category: string;
    definition: string;
  })[];
}
