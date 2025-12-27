import { describe, it, expect } from 'vitest';
import { phase14LegalHandler } from '../../supabase/functions/phase14-legal/index.ts';

describe('phase14-legal function', () => {
  it('returns 201 and echoes the payload on POST', async () => {
    const payload = { projectId: 'proj-14', clearance: 'basic' };
    const req = new Request('https://supabase.test/functions/v1/phase14-legal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const res = await phase14LegalHandler(req);

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toEqual(payload);
  });

  it('responds to OPTIONS with 200', async () => {
    const req = new Request('https://supabase.test/functions/v1/phase14-legal', { method: 'OPTIONS' });
    const res = await phase14LegalHandler(req);
    expect(res.status).toBe(200);
  });
});
