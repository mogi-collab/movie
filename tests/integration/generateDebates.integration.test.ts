/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../supabase/functions/_shared/aiClient.ts', async () => {
  return {
    callAnthropicWithRetry: async () => JSON.stringify({ preferred_outline: 'visionary', argument: 'We should pick visionary', strength: 0.9, counter_arguments: [] }),
    extractJson: (s: string) => JSON.parse(s),
  };
});

import { runGenerateDebatesForProject } from '../../supabase/functions/generate-debates/index.ts';

describe('generate-debates integration', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    (global as any).Deno = { env: { get: () => 'test' } };
    global.fetch = vi.fn(async (url: string, _opts?: any) => {
      if (typeof url === 'string' && url.includes('anthropic.com')) {
        return { ok: true, json: async () => ({ content: [{ text: JSON.stringify({ preferred_outline: 'visionary', argument: 'We should pick visionary', strength: 0.9, counter_arguments: [] }) }] }) } as any;
      }
      if (_opts?.method === 'POST' && url.endsWith('/debates')) {
        return { ok: true, json: async () => ({ id: 'debate-id' }) } as any;
      }
      return { ok: true, json: async () => [] } as any;
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unmock('../../supabase/functions/_shared/aiClient.ts');
  });

  it('produces debate records and returns a stored debate', async () => {
    const outlines = [{ ai_role: 'visionary', act_one: {}, act_two: {}, act_three: {} }];
    const debates = await runGenerateDebatesForProject('proj1', outlines as any);
    expect(Array.isArray(debates)).toBe(true);
    expect(debates[0]).toHaveProperty('id');
    expect(debates[0]).toHaveProperty('agreement_score');
  });
});
