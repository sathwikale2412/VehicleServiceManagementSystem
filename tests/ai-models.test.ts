import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAiModelEligible } from '../server/ai-models';

afterEach(() => vi.unstubAllGlobals());

function stubCatalog(payload: unknown, ok = true) {
  const fetchMock = vi.fn(async () => ({
    ok,
    json: async () => payload,
  }) as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const eligibleCatalog = (id = 'openai/test-model') => ({
  request_context_availability: { http: 'available' },
  data: [{
    id,
    type: 'language',
    model_eligibility: { status: 'eligible', evaluated_runtime: 'http' },
  }],
});

describe('Vercel AI Gateway model eligibility', () => {
  it('accepts a language model explicitly eligible for HTTP requests', async () => {
    const fetchMock = stubCatalog(eligibleCatalog());
    await expect(isAiModelEligible('test-credential', 'openai/test-model')).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://ai-gateway.vercel.sh/v1/models?include_availability',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-credential' }) }),
    );
  });

  it('rejects a model missing from the authenticated catalog', async () => {
    stubCatalog(eligibleCatalog('openai/other-model'));
    await expect(isAiModelEligible('catalog-test-missing', 'openai/test-model')).resolves.toBe(false);
  });

  it('rejects ineligible or non-language models', async () => {
    stubCatalog({
      request_context_availability: { http: 'available' },
      data: [
        { id: 'openai/blocked', type: 'language', model_eligibility: { status: 'ineligible', evaluated_runtime: 'http' } },
        { id: 'openai/embed', type: 'embedding', model_eligibility: { status: 'eligible', evaluated_runtime: 'http' } },
      ],
    });
    await expect(isAiModelEligible('catalog-test-blocked', 'openai/blocked')).resolves.toBe(false);
    await expect(isAiModelEligible('catalog-test-embedding', 'openai/embed')).resolves.toBe(false);
  });

  it('fails closed when team HTTP availability or catalog response is unknown', async () => {
    stubCatalog({ ...eligibleCatalog(), request_context_availability: { http: 'unavailable' } });
    await expect(isAiModelEligible('catalog-test-unavailable', 'openai/test-model')).resolves.toBe(false);
    stubCatalog({ data: 'not-an-array' });
    await expect(isAiModelEligible('catalog-test-malformed', 'openai/test-model')).resolves.toBe(false);
  });

  it('fails closed on provider errors and avoids lookup without credentials', async () => {
    stubCatalog({}, false);
    await expect(isAiModelEligible('catalog-test-provider-error', 'openai/test-model')).resolves.toBe(false);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(isAiModelEligible(undefined, 'openai/test-model')).resolves.toBe(false);
    await expect(isAiModelEligible('credential', undefined)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('caches successful eligibility checks for the current credential and model', async () => {
    const fetchMock = stubCatalog(eligibleCatalog('openai/cached-model'));
    await expect(isAiModelEligible('catalog-test-cache', 'openai/cached-model')).resolves.toBe(true);
    await expect(isAiModelEligible('catalog-test-cache', 'openai/cached-model')).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
