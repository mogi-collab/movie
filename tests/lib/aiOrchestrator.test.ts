import { describe, it, expect, vi } from 'vitest';
import { runOrchestrator } from '../../src/lib/aiOrchestrator';

describe('AI Orchestrator stub', () => {
  it('returns deterministic results when no AI client provided', async () => {
    const res = await runOrchestrator('projX', ['Realist', 'Idealist'], { core_theme: 'Family' });
    expect(res).toHaveLength(2);
    expect(res[0]).toHaveProperty('role', 'Realist');
    expect(res[0]).toHaveProperty('success', true);
    expect(res[0].result).toContain('Family');
  });

  it('uses injected aiClient.generate when available', async () => {
    const fakeClient = { generate: vi.fn(async ({ role }) => `custom-${role}`) };
    const res = await runOrchestrator('projY', ['Realist'], {}, fakeClient);
    expect(fakeClient.generate).toHaveBeenCalled();
    expect(res[0]).toEqual({ role: 'Realist', success: true, result: 'custom-Realist' });
  });

  it('continues when a role fails and reports the error', async () => {
    const fakeClient = {
      generate: vi.fn(async ({ role }) => {
        if (role === 'Realist') throw new Error('simulated');
        return `ok-${role}`;
      }),
    };

    const res = await runOrchestrator('projZ', ['Realist', 'Idealist'], {}, fakeClient);
    expect(res).toHaveLength(2);
    const realist = res.find((r) => r.role === 'Realist')!;
    const idealist = res.find((r) => r.role === 'Idealist')!;

    expect(realist.success).toBe(false);
    expect(realist.error).toContain('simulated');
    expect(idealist.success).toBe(true);
    expect(idealist.result).toBe('ok-Idealist');
  });
});
