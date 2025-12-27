import { describe, it, expect } from 'vitest';
import { phase15ReleaseHandler } from '../../supabase/functions/phase15-release/index.ts';

describe('phase15-release function', () => {
  it('returns 201 and echoes the payload on POST', async () => {
    const payload = { projectId: 'proj-15', plan: 'soft-launch' };
    const req = new Request('https://supabase.test/functions/v1/phase15-release', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const res = await phase15ReleaseHandler(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toEqual(payload);
  });

  it('responds to OPTIONS with 200', async () => {
    const req = new Request('https://supabase.test/functions/v1/phase15-release', { method: 'OPTIONS' });
    const res = await phase15ReleaseHandler(req);
    expect(res.status).toBe(200);
  });
});
