/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock AI client before importing the module under test
vi.mock('../../supabase/functions/_shared/aiClient.ts', async () => {
  return {
    callAnthropicWithRetry: async () => JSON.stringify({ one_liner: 'OL', logline: 'LG', short_synopsis: 'SS', hook_moment: 'HM', theme_conflict: {}, moral_question: '', originality_score: 0.8, philosophy_depth: 0.6 }),
    extractJson: (s: string) => JSON.parse(s),
  };
});

import { runGenerateConceptsForProject } from '../../supabase/functions/generate-concepts/index.ts';

describe('generate-concepts integration', () => {
  const originalFetch = global.fetch;
  let posts: any[] = [];

  beforeEach(() => {
    posts = [];
    // Mock Deno.env.get
    (global as any).Deno = { env: { get: () => 'test' } };

    global.fetch = vi.fn(async (url: string, _opts?: any) => {
      // POST to ideas: capture
      if (_opts?.method === 'POST' && url.endsWith('/ideas')) {
        const body = JSON.parse(_opts.body);
        posts.push(body);
        return { ok: true, json: async () => ({ id: 'fake-id' }) } as any;
      }

      // Anthropic API: return shaped content
      if (typeof url === 'string' && url.includes('anthropic.com')) {
        return { ok: true, json: async () => ({ content: [{ text: JSON.stringify({ one_liner: 'OL', logline: 'LG', short_synopsis: 'SS', hook_moment: 'HM', theme_conflict: {}, moral_question: '', originality_score: 0.8, philosophy_depth: 0.6 }) }] }) } as any;
      }

      // Default: return empty array for other REST queries
      return { ok: true, json: async () => [] } as any;
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unmock('../../supabase/functions/_shared/aiClient.ts');
  });

  it('returns one idea per AI role', async () => {
    const ideas = await runGenerateConceptsForProject('proj1', { core_theme: 'Theme', genre: ['drama'], platform: 'theatre' }, {} as any);
    // The runner returns 6 role outputs
    expect(Array.isArray(ideas)).toBe(true);
    expect(ideas.length).toBe(6);
    // Simulate storage as the Deno wrapper would and assert postings
    for (const idea of ideas) {
      await global.fetch(`${(global as any).Deno.env.get('SUPABASE_URL')}/rest/v1/ideas`, {
        method: 'POST',
        body: JSON.stringify({ project_id: 'proj1', ai_role: idea.ai_role, one_liner: idea.one_liner }),
      });
    }

    expect(posts.length).toBe(6);
    expect(posts[0]).toHaveProperty('one_liner', 'OL');
  });
});
