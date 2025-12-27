import { describe, it, expect } from 'vitest';
import { phase16MonetizationHandler } from '../../supabase/functions/phase16-monetization/index.ts';

describe('phase16-monetization function', () => {
  it('returns 201 and echoes the payload on POST', async () => {
    const payload = { projectId: 'proj-16', model: 'basic' };
    const req = new Request('https://supabase.test/functions/v1/phase16-monetization', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const res = await phase16MonetizationHandler(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toEqual(payload);
  });

  it('responds to OPTIONS with 200', async () => {
    const req = new Request('https://supabase.test/functions/v1/phase16-monetization', { method: 'OPTIONS' });
    const res = await phase16MonetizationHandler(req);
    expect(res.status).toBe(200);
  });
});
