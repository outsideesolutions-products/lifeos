import { AIProviderGateway, AIProviderExhaustedError } from './ai-provider-gateway';
import { AIClassificationViolationError } from './classification-gate';
import { AIProvider, AIGenerationRequest } from './ai-provider.interface';

const baseRequest: AIGenerationRequest = {
  messages: [{ role: 'user', content: 'hello' }],
  dataClassificationTier: 3,
  requestId: 'req-1',
};

function fakeProvider(
  name: string,
  behavior: 'succeed' | 'fail',
): AIProvider {
  return {
    name,
    modelForTier: () => `${name}-model`,
    generate: jest.fn().mockImplementation(async () => {
      if (behavior === 'fail') {
        throw new Error(`${name} failed`);
      }
      return {
        content: `response from ${name}`,
        model: `${name}-model`,
        tier: 'REASONING' as const,
        finishReason: 'stop',
      };
    }),
  };
}

describe('AIProviderGateway', () => {
  it('requires at least one provider', () => {
    expect(() => new AIProviderGateway({ providers: [] })).toThrow();
  });

  it('enforces the classification gate before calling any provider', async () => {
    const provider = fakeProvider('openai', 'succeed');
    const gateway = new AIProviderGateway({ providers: [provider] });

    await expect(
      gateway.generate({ ...baseRequest, dataClassificationTier: 1 }),
    ).rejects.toThrow(AIClassificationViolationError);
    expect(provider.generate).not.toHaveBeenCalled();
  });

  it('returns the primary provider result, tagged with its name', async () => {
    const primary = fakeProvider('openai', 'succeed');
    const gateway = new AIProviderGateway({ providers: [primary] });

    const result = await gateway.generate(baseRequest);
    expect(result.provider).toBe('openai');
    expect(result.content).toBe('response from openai');
  });

  it('falls back to the next provider on primary failure', async () => {
    const primary = fakeProvider('openai', 'fail');
    const fallback = fakeProvider('anthropic', 'succeed');
    const gateway = new AIProviderGateway({ providers: [primary, fallback] });

    const result = await gateway.generate(baseRequest);
    expect(result.provider).toBe('anthropic');
    expect(primary.generate).toHaveBeenCalled();
    expect(fallback.generate).toHaveBeenCalled();
  });

  it('throws AIProviderExhaustedError when every provider fails', async () => {
    const a = fakeProvider('a', 'fail');
    const b = fakeProvider('b', 'fail');
    const gateway = new AIProviderGateway({ providers: [a, b] });

    await expect(gateway.generate(baseRequest)).rejects.toThrow(
      AIProviderExhaustedError,
    );
  });
});
