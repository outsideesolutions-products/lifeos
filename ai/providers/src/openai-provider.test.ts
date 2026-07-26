import { OpenAIProvider } from './openai-provider';
import { AIGenerationRequest } from './ai-provider.interface';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

const baseRequest: AIGenerationRequest = {
  messages: [{ role: 'user', content: 'hello' }],
  dataClassificationTier: 3,
  requestId: 'req-1',
};

describe('OpenAIProvider', () => {
  it('throws if no API key is configured', async () => {
    const provider = new OpenAIProvider({ apiKey: '' });
    await expect(provider.generate(baseRequest)).rejects.toThrow(
      /OPENAI_API_KEY/,
    );
  });

  it('sends the tier-resolved model and returns normalized content', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({
        choices: [
          { message: { content: 'hi there' }, finish_reason: 'stop' },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      }),
    );

    const provider = new OpenAIProvider({
      apiKey: 'test-key',
      models: { REASONING: 'gpt-test-reasoning' },
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await provider.generate({
      ...baseRequest,
      tier: 'REASONING',
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
    const [, options] = fetchImpl.mock.calls[0];
    const sentBody = JSON.parse(options.body as string);
    expect(sentBody.model).toBe('gpt-test-reasoning');

    expect(result).toEqual({
      content: 'hi there',
      model: 'gpt-test-reasoning',
      tier: 'REASONING',
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });
  });

  it('defaults to the REASONING tier when none is specified', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
      }),
    );
    const provider = new OpenAIProvider({
      apiKey: 'test-key',
      models: { REASONING: 'gpt-default-reasoning' },
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await provider.generate(baseRequest);
    expect(result.tier).toBe('REASONING');
    expect(result.model).toBe('gpt-default-reasoning');
  });

  it('throws with the response body when OpenAI returns a non-2xx status', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse({ error: 'bad request' }, 400));
    const provider = new OpenAIProvider({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(provider.generate(baseRequest)).rejects.toThrow(/400/);
  });

  it('throws if the response contains no choices', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ choices: [] }));
    const provider = new OpenAIProvider({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(provider.generate(baseRequest)).rejects.toThrow(
      /no choices/,
    );
  });
});
