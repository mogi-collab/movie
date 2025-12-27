import { describe, it, expect } from 'vitest';
import { runHealth } from '../../supabase/functions/health/index.ts';

describe('health function', () => {
  it('returns ok status and timestamp', async () => {
    const res = await runHealth();
    expect(res).toHaveProperty('status', 'ok');
    expect(res).toHaveProperty('timestamp');
    expect(res).toHaveProperty('uptime');
    expect(typeof res.uptime).toBe('number');
  });
});
