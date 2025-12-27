/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runUploadPdf } from '../supabase/functions/upload-pdf/index.ts';

describe('runUploadPdf env detection', () => {
  const originalFetch = global.fetch;
  const originalDeno = (global as any).Deno;
  const origProcessSUPABASE = (process as any).SUPABASE_URL;
  const origProcessService = (process as any).SUPABASE_SERVICE_ROLE_KEY;
  const origProcessBucket = (process as any).PDF_STORAGE_BUCKET;
  const origEnv = { ...process.env };

  beforeEach(() => {
    global.fetch = vi.fn(async () => ({ ok: true, text: async () => 'OK' })) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    (global as any).Deno = originalDeno;
    if (origProcessSUPABASE === undefined) delete (process as any).SUPABASE_URL; else (process as any).SUPABASE_URL = origProcessSUPABASE;
    if (origProcessService === undefined) delete (process as any).SUPABASE_SERVICE_ROLE_KEY; else (process as any).SUPABASE_SERVICE_ROLE_KEY = origProcessService;
    if (origProcessBucket === undefined) delete (process as any).PDF_STORAGE_BUCKET; else (process as any).PDF_STORAGE_BUCKET = origProcessBucket;
    process.env = { ...origEnv } as NodeJS.ProcessEnv;
  });

  it('reads values from Deno.env when available', async () => {
    (global as any).Deno = { env: { get: (k: string) => {
      if (k === 'SUPABASE_URL') return 'https://deno.test';
      if (k === 'SUPABASE_SERVICE_ROLE_KEY') return 'deno-key';
      if (k === 'PDF_STORAGE_BUCKET') return 'deno-bucket';
      return undefined;
    } } };

    const res = await runUploadPdf('p', 'f.pdf', 'RkFLRV9QREZfQkFTRTY0', 'application/pdf');
    expect(res.url).toContain('https://deno.test');
    expect(res.url).toContain('/public/deno-bucket/');
  });

  it('reads values from process.* when Deno not present', async () => {
    (global as any).Deno = undefined;
    (process as any).SUPABASE_URL = 'https://proc-dot.test';
    (process as any).SUPABASE_SERVICE_ROLE_KEY = 'proc-key';
    (process as any).PDF_STORAGE_BUCKET = 'proc-bucket';

    const res = await runUploadPdf('p', 'f.pdf', 'RkFLRV9QREZfQkFTRTY0', 'application/pdf');
    expect(res.url).toContain('https://proc-dot.test');
    expect(res.url).toContain('/public/proc-bucket/');
  });

  it('reads values from process.env when process.* not present', async () => {
    (global as any).Deno = undefined;
    delete (process as any).SUPABASE_URL;
    delete (process as any).SUPABASE_SERVICE_ROLE_KEY;
    delete (process as any).PDF_STORAGE_BUCKET;

    // Vite env may be checked before SUPABASE_URL, set both to be deterministic in tests
    process.env.VITE_SUPABASE_URL = 'https://env.test';
    process.env.SUPABASE_URL = 'https://env.test';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'env-key';
    process.env.PDF_STORAGE_BUCKET = 'env-bucket';

    const res = await runUploadPdf('p', 'f.pdf', 'RkFLRV9QREZfQkFTRTY0', 'application/pdf');
    expect(res.url).toContain('https://env.test');
    expect(res.url).toContain('/public/env-bucket/');
  });
});
