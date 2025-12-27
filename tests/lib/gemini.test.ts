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

  it('respects GEMINI_MODEL env var', async () => {
    (process.env as any).GEMINI_API_KEY = 'fake';
    (process.env as any).GEMINI_MODEL = 'gemini-test-1';

    (global as any).fetch = vi.fn(async (url: string) => ({ ok: true, json: async () => ({ candidates: [{ content: [{ text: 'ok' }] }] }) }));

    await generateWithGemini('hello');
    expect((global as any).fetch).toHaveBeenCalled();
    const calledUrl = ((global as any).fetch as any).mock.calls[0][0] as string;
    expect(calledUrl).toContain('models/gemini-test-1:generate');

    delete (process.env as any).GEMINI_MODEL;
  });
});
