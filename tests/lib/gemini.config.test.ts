import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateWithGemini } from '../../src/lib/ai/gemini';

describe('generateWithGemini default model resolution', () => {
  afterEach(() => {
    delete (process.env as any).GEMINI_API_KEY;
    delete (process.env as any).GEMINI_MODEL;
    (global as any).fetch = undefined;
  });

  it('uses ai.config.json default when GEMINI_MODEL not set', async () => {
    (process.env as any).GEMINI_API_KEY = 'fake';

    (global as any).fetch = vi.fn(async (url: string) => ({ ok: true, json: async () => ({ candidates: [{ content: [{ text: 'ok' }] }] }) }));

    await generateWithGemini('hello');

    expect((global as any).fetch).toHaveBeenCalled();
    const calledUrl = ((global as any).fetch as any).mock.calls[0][0] as string;
    expect(calledUrl).toContain('models/gemini-1.5-flash:generate');
  });
});