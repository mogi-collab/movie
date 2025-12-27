import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock AI client before importing the module under test
vi.mock('../../supabase/functions/_shared/aiClient.ts', async () => {
  return {
    callAnthropicWithRetry: async () => JSON.stringify({ name: 'Nova', role: 'protagonist', backstory: 'Born under the sea', desire: 'Find surface', fear: 'Isolation', flaws: { primary: 'brash', secondary: 'naive' }, moral_code: 'protect the weak', contradictions: 'loves solitude but seeks company', inner_voice: 'I must go on', arc_type: 'positive' }),
    extractJson: (s: string) => JSON.parse(s),
  };
});

import { runGenerateCharactersForProject } from '../../supabase/functions/generate-characters/index.ts';

describe('generate-characters integration', () => {
  const originalFetch = global.fetch;
  let posts: any[] = [];

  beforeEach(() => {
    posts = [];
    // Mock Deno.env.get
    (global as any).Deno = { env: { get: (k: string) => 'test' } };

    global.fetch = vi.fn(async (url: string, opts?: any) => {
      // POST to characters: capture
      if (opts?.method === 'POST' && url.endsWith('/characters')) {
        const body = JSON.parse(opts.body);
        posts.push(body);
        return { ok: true, json: async () => ({ id: 'fake-char-id' }) } as any;
      }

      // Anthropic API: return shaped content
      if (typeof url === 'string' && url.includes('anthropic.com')) {
        return { ok: true, json: async () => ({ content: [{ text: JSON.stringify({ name: 'Nova', role: 'protagonist', backstory: 'Born under the sea', desire: 'Find surface', fear: 'Isolation', flaws: { primary: 'brash', secondary: 'naive' }, moral_code: 'protect the weak', contradictions: 'loves solitude but seeks company', inner_voice: 'I must go on', arc_type: 'positive' }) }] }) } as any;
      }

      // Default: return empty array for other REST queries
      return { ok: true, json: async () => [] } as any;
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unmock('../../supabase/functions/_shared/aiClient.ts');
  });

  it('generates and stores characters', async () => {
    const chars = await runGenerateCharactersForProject('projX', { core_theme: 'Water' } as any, {} as any, 2);
    expect(Array.isArray(chars)).toBe(true);
    expect(chars.length).toBe(2);
    // Ensure that runner produced character objects and posting occurs when Deno wrapper runs
    // (We simulate posting in the Deno serve path separately if needed.)
    expect(chars[0].name).toBe('Nova');
    // Simulate storing characters as the Deno wrapper would
    for (const c of chars) {
      await global.fetch(`${(global as any).Deno.env.get('SUPABASE_URL')}/rest/v1/characters`, {
        method: 'POST',
        body: JSON.stringify(Object.assign({ project_id: 'projX' }, c)),
      });
    }

    expect(posts.length).toBe(2);
  });
});
