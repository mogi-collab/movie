/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runExportForScript } from '../../supabase/functions/export-script/index.ts';

describe('export-script integration', () => {
  const originalFetch = global.fetch;
  let posts: any[] = [];

  beforeEach(() => {
    posts = [];
    (global as any).Deno = { env: { get: () => 'test' } };

    global.fetch = vi.fn(async (url: string, _opts?: any) => {
      // Return the requested script version
      if (typeof url === 'string' && url.includes('/script_versions')) {
        return { ok: true, json: async () => [{ content: 'FAKE SCRIPT CONTENT', metadata: { title: 'Test Script' }, version_number: 1 }] } as any;
      }

      // Capture export storage
      if (_opts?.method === 'POST' && url.endsWith('/exports')) {
        const body = JSON.parse(_opts.body);
        posts.push(body);
        return { ok: true, json: async () => ({ id: 'export-id' }) } as any;
      }

      return { ok: true, json: async () => [] } as any;
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('creates export record and returns artifact url', async () => {
    const result = await runExportForScript('proj1', 'script1', 1, 'markdown');
    expect(result).toHaveProperty('artifact_url');
    expect(result.artifact_url.startsWith('data:text/markdown;base64,')).toBe(true);
    expect(posts.length).toBe(1);
    expect(posts[0]).toHaveProperty('export_type', 'markdown');
  });
});
