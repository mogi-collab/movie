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

  it('renders and calls orchestrator with options', async () => {
    (global as any).fetch = vi.fn(async (_url: string, opts: any) => ({ ok: true, json: async () => ({ trace: [{ phase: 1, provider: 'gemini', options: opts && JSON.parse(opts.body).options, output: { text: 'ok' } }] }) }));

    render(<DirectorPanel projectId="proj-1" />);

    // toggle some options off
    const crewCheckbox = screen.getByLabelText(/CrewAI/);
    const emotionCheckbox = screen.getByLabelText(/Emotion pipeline/);
    const memoryCheckbox = screen.getByLabelText(/Memory/);

    // flip Memory off
    fireEvent.click(memoryCheckbox);

    const runButton = screen.getByRole('button', { name: /Run/i });
    fireEvent.click(runButton);

    // wait for fetch to be called
    await new Promise((r) => setTimeout(r, 20));
    expect((global as any).fetch).toHaveBeenCalled();

    // trace should be shown and options respected
    expect(await screen.findByText(/Execution Trace/)).toBeTruthy();
    expect(await screen.findByText(/Phase 1/)).toBeTruthy();
    // assert that the options in the request reflected memory=false
    const calledBody = JSON.parse(((global as any).fetch as any).mock.calls[0][1].body);
    expect(calledBody.options.memory).toBe(false);
  });
});