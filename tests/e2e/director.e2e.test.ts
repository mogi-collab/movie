import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectPage from '../../src/pages/ProjectPage';

// Mock useProject hook to provide project data
vi.mock('../../src/hooks/useProject', () => ({
  useProject: (projectId: string) => ({
    project: { id: projectId, title: 'Test Project', current_phase: 1, completed_phases: [] },
    directorInputs: { prompt: 'test' },
    loading: false,
  }),
}));

describe('Director E2E flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    (global as any).fetch = undefined;
  });

  it('opens director via ProjectPage and runs phases', async () => {
    (global as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ({ trace: [{ phase: 1, provider: 'gemini', output: { text: 'ok' } }] }) }));

    render(<ProjectPage projectId="proj-1" onBack={() => {}} />);

    const openBtn = screen.getByRole('button', { name: /Open Director/i });
    fireEvent.click(openBtn);

    // run button rendered
    const runButton = await screen.findByRole('button', { name: /Run/i });
    fireEvent.click(runButton);

    // wait and verify
    await new Promise((r) => setTimeout(r, 20));
    expect((global as any).fetch).toHaveBeenCalled();
    expect(await screen.findByText(/Execution Trace/)).toBeTruthy();
  });
});