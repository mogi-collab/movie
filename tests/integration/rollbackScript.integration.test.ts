import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runRollbackForScript } from '../../supabase/functions/rollback-script/index.ts';

describe('rollback-script integration', () => {
  const originalFetch = global.fetch;
  const posts: any[] = [];

  beforeEach(() => {
    posts.length = 0;
    (global as any).Deno = { env: { get: (k: string) => 'test' } };

    global.fetch = vi.fn(async (url: string, opts?: any) => {
      // Return the requested version
      if (typeof url === 'string' && url.includes('/script_versions') && opts?.method !== 'POST') {
        return { ok: true, json: async () => [{ id: 'ver1', content: 'VERSION CONTENT', metadata: { title: 'Rollback Title' }, version_number: 2 }] } as any;
      }

      // PATCH to scripts -> no content returned
      if (opts?.method === 'PATCH' && url.includes('/scripts')) {
        posts.push({ patch: true, body: JSON.parse(opts.body) });
        return { ok: true, json: async () => ({}) } as any;
      }

      // POST to script_versions -> record and return id
      if (opts?.method === 'POST' && url.endsWith('/script_versions')) {
        const body = JSON.parse(opts.body);
        posts.push({ post_version: true, body });
        return { ok: true, json: async () => ({ id: 'new-ver-id' }) } as any;
      }

      return { ok: true, json: async () => [] } as any;
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('applies version to script and creates new version', async () => {
    const res = await runRollbackForScript('proj1', 'script1', 'ver1');
    expect(res).toHaveProperty('rolled_to_version_id');
    expect(posts.some((p: any) => p.patch)).toBe(true);
    expect(posts.some((p: any) => p.post_version)).toBe(true);
  });
});
