import { createHash } from 'node:crypto';

type CatalogModel = {
  id?: unknown;
  type?: unknown;
  model_eligibility?: { status?: unknown; evaluated_runtime?: unknown };
};
type CatalogResponse = {
  data?: CatalogModel[];
  request_context_availability?: { http?: unknown };
};

type CacheEntry = { eligible: boolean; expiresAt: number };
const eligibilityCache = new Map<string, CacheEntry>();
const ELIGIBLE_TTL_MS = 5 * 60 * 1000;
const FAILURE_TTL_MS = 30 * 1000;

/**
 * Return true only when the authenticated Gateway catalog currently marks the
 * configured language model eligible for ordinary HTTP requests. Never log or
 * return the supplied credential.
 */
export async function isAiModelEligible(credential?: string, model?: string): Promise<boolean> {
  const normalizedModel = model?.trim() ?? '';
  if (!credential || !normalizedModel || normalizedModel.length > 128) return false;

  const credentialDigest = createHash('sha256').update(credential).digest('hex');
  const cacheKey = `${credentialDigest}:${normalizedModel}`;
  const cached = eligibilityCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.eligible;

  let eligible = false;
  try {
    const response = await fetch('https://ai-gateway.vercel.sh/v1/models?include_availability', {
      headers: {
        Authorization: `Bearer ${credential}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) throw new Error('Gateway catalog unavailable.');
    const catalog = await response.json() as CatalogResponse;
    eligible = catalog.request_context_availability?.http === 'available'
      && Array.isArray(catalog.data)
      && catalog.data.some((entry) => entry.id === normalizedModel
        && entry.type === 'language'
        && entry.model_eligibility?.status === 'eligible'
        && entry.model_eligibility.evaluated_runtime === 'http');
  } catch {
    eligible = false;
  }

  eligibilityCache.set(cacheKey, {
    eligible,
    expiresAt: Date.now() + (eligible ? ELIGIBLE_TTL_MS : FAILURE_TTL_MS),
  });
  if (eligibilityCache.size > 64) {
    const oldestKey = eligibilityCache.keys().next().value;
    if (oldestKey) eligibilityCache.delete(oldestKey);
  }
  return eligible;
}
