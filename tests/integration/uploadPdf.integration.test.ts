/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runUploadPdf } from '../../supabase/functions/upload-pdf/index.ts';

describe('upload-pdf integration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (global as any).Deno = undefined;
    global.fetch = vi.fn(async (url: string) => {
      // expect upload to supabase storage path
      if (typeof url === 'string' && url.includes('/storage/v1/object/')) {
        return { ok: true, text: async () => 'OK' } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('uploads PDF to Supabase storage and returns public URL', async () => {
    (process as any).SUPABASE_URL = 'https://supabase.test';
    (process as any).SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    (process as any).PDF_STORAGE_BUCKET = 'exports';

    const res = await runUploadPdf('proj1', 'script1-v1.pdf', 'RkFLRV9QREZfQkFTRTY0', 'application/pdf');
    expect(res).toHaveProperty('url');
    expect(res.url).toContain('/storage/v1/object/public/exports/');
  });
});
