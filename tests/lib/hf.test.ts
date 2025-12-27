import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateWithHF } from '../../src/lib/ai/hf';

describe('generateWithHF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (process.env as any).HF_API_TOKEN;
    (global as any).fetch = undefined;
  });

  it('throws if HF_API_TOKEN not set', async () => {
    await expect(generateWithHF('model', 'hi')).rejects.toThrow('HF_API_TOKEN not set');
  });

  it('calls fetch and returns text', async () => {
    (process.env as any).HF_API_TOKEN = 'fake';
    (global as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ([{ generated_text: 'hello' }]) }));

    const res = await generateWithHF('model', 'hi');
    expect(res).toContain('hello');
    expect((global as any).fetch).toHaveBeenCalled();
  });
});
