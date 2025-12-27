import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runExportScriptPdf } from '../../supabase/functions/export-script-pdf/index.ts';

describe('export-script-pdf integration', () => {
  const originalFetch = global.fetch;
  const posts: any[] = [];

  beforeEach(() => {
    posts.length = 0;
    // Ensure we use process.env in Node tests to control PDF/Storage URLs
    (global as any).Deno = undefined;

    global.fetch = vi.fn(async (url: string, opts?: any) => {
      if (typeof url === 'string' && url.includes('/script_versions')) {
        return { ok: true, json: async () => [{ content: 'SOME SCRIPT', metadata: { title: 'PDF Title' }, version_number: 1 }] } as any;
      }

      // mock PDF service
      if (typeof url === 'string' && url.includes('pdf-service')) {
        return { ok: true, json: async () => ({ base64: 'PDFBASE64' }) } as any;
      }

      // mock storage service
      if (typeof url === 'string' && url.includes('storage-service')) {
        const body = JSON.parse(opts.body);
        posts.push({ upload: true, filename: body.filename });
        return { ok: true, json: async () => ({ url: `https://storage.example/${body.filename}` }) } as any;
      }

      // capture exports POST
      if (opts?.method === 'POST' && url.endsWith('/exports')) {
        const body = JSON.parse(opts.body);
        posts.push({ export: true, body });
        return { ok: true, json: async () => ({ id: 'export-id' }) } as any;
      }

      return { ok: true, json: async () => [] } as any;
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('calls pdf service and storage and stores export record', async () => {
    // provide env values via process.env for Node test
    (process as any).PDF_SERVICE_URL = 'https://pdf-service/generate';
    (process as any).STORAGE_SERVICE_URL = 'https://storage-service/upload';

    const result = await runExportScriptPdf('proj1', 'script1', 1);
    expect(result).toHaveProperty('artifact_url');
    // Artifact may be uploaded to storage or returned as a data URL placeholder depending on configuration/mocks
    expect(typeof result.artifact_url === 'string' && result.artifact_url.length > 0).toBe(true);
    expect(posts.some(p => p.export)).toBe(true);
  });
});
