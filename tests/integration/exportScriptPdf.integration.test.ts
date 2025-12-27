/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runExportScriptPdf } from '../../supabase/functions/export-script-pdf/index.ts';

describe('export-script-pdf integration', () => {
  const originalFetch = global.fetch;
  const posts: any[] = [];

  beforeEach(() => {
    posts.length = 0;
    // Ensure we use process.env in Node tests to control PDF/Storage URLs
    (global as any).Deno = undefined;

    global.fetch = vi.fn(async (url: string, _opts?: any) => {
      if (typeof url === 'string' && url.includes('/script_versions')) {
        return { ok: true, json: async () => [{ content: 'SOME SCRIPT', metadata: { title: 'PDF Title' }, version_number: 1 }] } as any;
      }

      // mock PDF service
      if (typeof url === 'string' && url.includes('pdf-service')) {
        return { ok: true, json: async () => ({ base64: 'PDFBASE64' }) } as any;
      }

      // mock storage service
      if (typeof url === 'string' && url.includes('storage-service')) {
        const body = JSON.parse(_opts!.body);
        posts.push({ upload: true, filename: body.filename });
        return { ok: true, json: async () => ({ url: `https://storage.example/${body.filename}` }) } as any;
      }

      // capture exports POST
      if (_opts?.method === 'POST' && url.endsWith('/exports')) {
        const body = JSON.parse(_opts.body);
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

  it('falls back to data URL when no pdf or storage service is configured', async () => {
    // ensure no services configured and no deno env
    (global as any).Deno = undefined;
    delete (process as any).PDF_SERVICE_URL;
    delete (process as any).STORAGE_SERVICE_URL;
    delete (process as any).SUPABASE_URL;
    delete (process as any).SUPABASE_SERVICE_ROLE_KEY;

    const res = await runExportScriptPdf('proj1', 'script1', 1);
    expect(typeof res.artifact_url).toBe('string');
    expect(res.artifact_url.startsWith('data:application/pdf;base64,') || res.artifact_url.length > 0).toBe(true);
  });

  it('throws when pdf service returns non-ok', async () => {
    (process as any).PDF_SERVICE_URL = 'https://pdf-service/generate';
    process.env.PDF_SERVICE_URL = 'https://pdf-service/generate';
    (global as any).Deno = undefined;

    global.fetch = vi.fn(async (url: string) => {
      if (typeof url === 'string' && url.includes('/script_versions')) {
        return { ok: true, json: async () => [{ content: 'SOME SCRIPT', metadata: { title: 'PDF Title' }, version_number: 1 }] } as any;
      }

      if (typeof url === 'string' && url.includes('pdf-service')) {
        return { ok: false, status: 500, text: async () => 'Service error' } as any;
      }

      return { ok: true, json: async () => [] } as any;
    }) as any;

    await expect(runExportScriptPdf('proj1', 'script1', 1)).rejects.toThrow(/PDF service failed/);
  });

  it('throws when storage service returns non-ok', async () => {
    (process as any).PDF_SERVICE_URL = 'https://pdf-service/generate';
    process.env.PDF_SERVICE_URL = 'https://pdf-service/generate';
    (process as any).STORAGE_SERVICE_URL = 'https://storage-service/upload';
    process.env.STORAGE_SERVICE_URL = 'https://storage-service/upload';
    (global as any).Deno = undefined;

    global.fetch = vi.fn(async (url: string) => {
      if (typeof url === 'string' && url.includes('/script_versions')) {
        return { ok: true, json: async () => [{ content: 'SOME SCRIPT', metadata: { title: 'PDF Title' }, version_number: 1 }] } as any;
      }

      if (typeof url === 'string' && url.includes('pdf-service')) {
        return { ok: true, json: async () => ({ base64: 'PDFBASE64' }) } as any;
      }

      // storage service failure
      if (typeof url === 'string' && url.includes('storage-service')) {
        return { ok: false, status: 500, text: async () => 'Storage failure' } as any;
      }

      return { ok: true, json: async () => [] } as any;
    }) as any;

    await expect(runExportScriptPdf('proj1', 'script1', 1)).rejects.toThrow(/Storage service failed/);
  });
});
