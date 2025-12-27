import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock generateScriptFromOutline's AI call by mocking fetch for anthropic
describe('generate-scripts integration', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    (global as any).Deno = { env: { get: (k: string) => 'test' } };
    const posts: any[] = [];
    (global as any).__SCRIPT_POSTS = posts;
    global.fetch = vi.fn(async (url: string, opts?: any) => {
      if (typeof url === 'string' && url.includes('anthropic.com')) {
        return { ok: true, json: async () => ({ content: [{ text: JSON.stringify({ title: 'T', full_content: 'SC', scene_count: 3, word_count: 450, emotional_coherence: 0.7, logical_continuity: 0.8, audience_tolerance: 0.6, overall_score: 0.75 }) }] }) } as any;
      }
      if (opts?.method === 'POST' && url.endsWith('/scripts')) {
        const body = JSON.parse(opts.body);
        posts.push(body);
        return { ok: true, json: async () => ({ id: 'script-id' }) } as any;
      }
      if (opts?.method === 'POST' && url.endsWith('/script_versions')) {
        const body = JSON.parse(opts.body);
        // store script_versions posts alongside scripts
        posts.push({ __version: true, ...body });
        return { ok: true, json: async () => ({ id: 'sv-id' }) } as any;
      }
      // Expose posts array for assertions by attaching to global (test-scoped)
      return { ok: true, json: async () => [] } as any;
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('generates scripts for different types and stores them', async () => {
    const outlines = [{ ai_role: 'visionary', act_one: {}, act_two: {}, act_three: {} }];
    const debates: any[] = [{ winner_perspective: 'visionary' }];
    const { runGenerateScriptsForProject } = await import('../../supabase/functions/generate-scripts/index.ts');
    const scripts = await runGenerateScriptsForProject('proj1', debates as any, outlines as any);
    expect(Array.isArray(scripts)).toBe(true);
    expect(scripts.length).toBe(3);
    expect(scripts[0]).toHaveProperty('script_type');
    // Simulate storing scripts as wrapper would
    for (const s of scripts) {
      await global.fetch(`${(global as any).Deno.env.get('SUPABASE_URL')}/rest/v1/scripts`, {
        method: 'POST',
        body: JSON.stringify({ project_id: 'proj1', script_type: s.script_type, title: s.title }),
      });
    }

    const scriptPosts = (global as any).__SCRIPT_POSTS || [];
    // The runner posts 3 scripts, creates 3 version records, and the test simulation posts 3 more scripts -> expect 9
    expect(scriptPosts.length).toBe(9);
  });
});
