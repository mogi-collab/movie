/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runUploadPdf } from '../supabase/functions/upload-pdf/index.ts';

describe('runUploadPdf retries', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (global as any).Deno = undefined;
    (process as any).SUPABASE_URL = 'https://supabase.test';
    (process as any).SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    (process as any).PDF_STORAGE_BUCKET = 'exports';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete (process as any).SUPABASE_URL;
    delete (process as any).SUPABASE_SERVICE_ROLE_KEY;
    delete (process as any).PDF_STORAGE_BUCKET;
  });

  it('retries on transient failures and succeeds', async () => {
    const calls: Array<{ url: string; _opts?: any }> = [];
    let callCount = 0;
    global.fetch = vi.fn(async (url: string, _opts?: any) => {
      calls.push({ url: String(url), _opts });
      callCount += 1;
      if (callCount < 3) {
        return { ok: false, status: 500, text: async () => 'server error' } as any;
      }
      return { ok: true, text: async () => 'OK' } as any;
    }) as any;

    const res = await runUploadPdf('proj1', 'file.pdf', 'RkFLRV9QREZfQkFTRTY0', 'application/pdf', { retries: 3, backoffMs: [1, 1, 1] });
    expect(res).toHaveProperty('url');
    expect(callCount).toBe(3);
  });

  it('fails after exhausting retries', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 500, text: async () => 'server error' })) as any;

    await expect(runUploadPdf('proj1', 'file.pdf', 'RkFLRV9QREZfQkFTRTY0', 'application/pdf', { retries: 2, backoffMs: [1, 1] })).rejects.toThrow(/Storage upload failed/);
  });
});
