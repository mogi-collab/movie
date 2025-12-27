import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { requestPhaseAccessHandler } from '../../supabase/functions/request-phase-access/index.ts';

describe('request-phase-access function', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (global as any).Deno = { env: { get: (k: string) => (process.env as any)[k] } } as any;
    process.env.SUPABASE_URL = 'https://supabase.test';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('persists a request and returns 201', async () => {
    global.fetch = vi.fn(async (url: string, opts?: any) => {
      if (url.endsWith('/rest/v1/phase_requests') && opts?.method === 'POST') {
        const body = JSON.parse(opts.body);
        return { ok: true, json: async () => ([{ id: 'pr-1', ...body }]) } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    }) as any;

    const req = new Request('https://supabase.test/functions/v1/request-phase-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phase: 7, email: 'a@b.com', notes: 'please' }) });
    const res = await requestPhaseAccessHandler(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toHaveProperty('id', 'pr-1');
  });

  it('returns 400 for invalid email', async () => {
    const req = new Request('https://supabase.test/functions/v1/request-phase-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phase: 7, email: 'not-an-email' }) });
    const res = await requestPhaseAccessHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid email');
  });

  it('returns 400 for missing phase', async () => {
    const req = new Request('https://supabase.test/functions/v1/request-phase-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'a@b.com' }) });
    const res = await requestPhaseAccessHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('missing phase');
  });
});