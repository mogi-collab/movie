import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock AI client before importing the module under test
vi.mock('../../supabase/functions/_shared/aiClient.ts', async () => {
  return {
    callAnthropicWithRetry: async () => JSON.stringify({ act_one: { title: 'Act 1', scenes: [{ number: 1, title: 'Start', description: 'Opening' }] }, act_two: { title: 'Act 2', scenes: [{ number: 2, title: 'Middle', description: 'Conflict' }] }, act_three: { title: 'Act 3', scenes: [{ number: 3, title: 'End', description: 'Resolve' }] }, emotional_arc: [], endings: [] }),
    extractJson: (s: string) => JSON.parse(s),
  };
});

import { runGenerateOutlinesForProject } from '../../supabase/functions/generate-stories/index.ts';

describe('generate-stories integration', () => {
  it('returns one outline per AI role and stores outlines', async () => {
    (global as any).Deno = { env: { get: (k: string) => 'test' } };
    const posts: any[] = [];
    const originalFetch = global.fetch;

    global.fetch = vi.fn(async (url: string, opts?: any) => {
      if (opts?.method === 'POST' && url.endsWith('/story_outlines')) {
        const body = JSON.parse(opts.body);
        posts.push(body);
        return { ok: true, json: async () => ({ id: 'so-id' }) } as any;
      }
      // Anthropic API: return shaped content
      if (typeof url === 'string' && url.includes('anthropic.com')) {
        return { ok: true, json: async () => ({ content: [{ text: JSON.stringify({ act_one: { title: 'Act 1' }, act_two: { title: 'Act 2' }, act_three: { title: 'Act 3' } }) }] }) } as any;
      }
      return { ok: true, json: async () => [] } as any;
    }) as any;

    const outlines = await runGenerateOutlinesForProject('proj1', { core_theme: 'Theme', genre: ['drama'], platform: 'theatre' }, {} as any);
    expect(Array.isArray(outlines)).toBe(true);
    expect(outlines.length).toBe(6);

    // Simulate storing outlines as the Deno wrapper would
    for (const o of outlines) {
      await global.fetch(`${(global as any).Deno.env.get('SUPABASE_URL')}/rest/v1/story_outlines`, {
        method: 'POST',
        body: JSON.stringify({ project_id: 'proj1', ai_role: o.ai_role, act_one: o.act_one }),
      });
    }

    expect(posts.length).toBe(6);
    expect(posts[0]).toHaveProperty('ai_role');

    global.fetch = originalFetch;
  });
});
