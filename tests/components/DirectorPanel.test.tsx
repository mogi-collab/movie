import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DirectorPanel from '../../src/components/Director/DirectorPanel';

describe('DirectorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    (global as any).fetch = undefined;
  });

  it('renders and calls orchestrator', async () => {
    (global as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ({ trace: [{ phase: 1, provider: 'gemini', output: { text: 'ok' } }] }) }));

    render(<DirectorPanel projectId="proj-1" />);

    const runButton = screen.getByRole('button', { name: /Run/i });
    fireEvent.click(runButton);

    // wait for fetch to be called
    await new Promise((r) => setTimeout(r, 20));
    expect((global as any).fetch).toHaveBeenCalled();

    // trace should be shown
    expect(await screen.findByText(/Execution Trace/)).toBeTruthy();
    expect(await screen.findByText(/Phase 1/)).toBeTruthy();
  });
});