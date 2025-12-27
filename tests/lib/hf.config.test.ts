import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateWithHF } from '../../src/lib/ai/hf';

describe('generateWithHF default model resolution', () => {
  afterEach(() => {
    delete (process.env as any).HF_API_TOKEN;
    delete (process.env as any).HF_DEFAULT_MODEL;
    (global as any).fetch = undefined;
  });

  it('uses ai.config.json backupLLM when HF_DEFAULT_MODEL not set', async () => {
    (process.env as any).HF_API_TOKEN = 'fake';

    (global as any).fetch = vi.fn(async (url: string) => ({ ok: true, json: async () => ([{ generated_text: 'hello' }]) }));

    await generateWithHF(undefined, 'hi');

    expect((global as any).fetch).toHaveBeenCalled();
    const calledUrl = ((global as any).fetch as any).mock.calls[0][0] as string;
    expect(calledUrl).toContain('models/mistralai/Mistral-7B-Instruct-v0.2');
  });
});