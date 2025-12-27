import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateWithGemini } from '../../src/lib/ai/gemini';

describe('generateWithGemini', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (process.env as any).GEMINI_API_KEY;
    (global as any).fetch = undefined;
  });

  it('throws if GEMINI_API_KEY not set', async () => {
    await expect(generateWithGemini('hi')).rejects.toThrow('GEMINI_API_KEY not set');
  });

  it('calls fetch and returns text', async () => {
    (process.env as any).GEMINI_API_KEY = 'fake';
    (global as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ({ candidates: [{ content: [{ text: 'ok' }] }] }) }));

    const res = await generateWithGemini('hi');
    expect(res.text).toContain('ok');
    expect((global as any).fetch).toHaveBeenCalled();
  });
});
