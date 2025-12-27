import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { fireEvent } from '@testing-library/dom';

const mockUpdateDirectorInputs = vi.fn(async (inputs) => ({ data: inputs }));
const mockUpdateSliders = vi.fn(async (s) => ({ data: s }));

vi.mock('../../src/hooks/useProject', () => ({
  useProject: (projectId: string) => ({
    project: { id: projectId, title: 'Demo', current_phase: 1, completed_phases: [] },
    directorInputs: null,
    sliders: null,
    loading: false,
    error: null,
    updateProject: vi.fn(),
    updateDirectorInputs: mockUpdateDirectorInputs,
    updateSliders: mockUpdateSliders,
  }),
}));

import PhaseSetup from '../../src/components/phases/PhaseSetup';

function renderIntoContainer(component: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(component);
  return { container, root };
}

describe('PhaseSetup component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates empty theme and shows message', async () => {
    const { container } = renderIntoContainer(<PhaseSetup projectId="proj1" />);

    await act(async () => {
      // Wait for any initial effects
      await new Promise((r) => setTimeout(r, 10));
    });

    // Find the save button by text
    const buttons = Array.from(container.querySelectorAll('button'));
    const save = buttons.find((b) => (b.textContent || '').includes('Save Configuration')) as HTMLButtonElement | undefined;
    expect(save).toBeDefined();

    // Click save without filling theme
    await act(async () => {
      save!.click();
      await new Promise((r) => setTimeout(r, 10));
    });

    // Expect validation message
    expect(container.textContent).toContain('Please enter a core theme');
  });

  it('saves inputs and sliders when valid', async () => {
    const { container } = renderIntoContainer(<PhaseSetup projectId="proj1" />);

    await act(async () => {
      // Wait for any initial effects
      await new Promise((r) => setTimeout(r, 10));
    });

    // Fill theme
    const themeInput = container.querySelector('input[type="text"]') as HTMLInputElement | null;
    expect(themeInput).toBeTruthy();
    await act(async () => {
      fireEvent.input(themeInput!, { target: { value: 'Test Theme' } });
      await new Promise((r) => setTimeout(r, 10));
    });



    // Select a genre button
    const genreButton = Array.from(container.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === 'Drama') as HTMLButtonElement | undefined;
    expect(genreButton).toBeDefined();
    await act(async () => {
      fireEvent.click(genreButton!);
      // wait for state updates to propagate
      await new Promise((r) => setTimeout(r, 10));
    });
    // ensure genre appears selected
    expect(genreButton!.className).toContain('bg-blue-600');

    // Adjust a slider (emotionIntensity)
    const ranges = Array.from(container.querySelectorAll('input[type="range"]')) as HTMLInputElement[];
    const emotionRange = ranges[0];
    await act(async () => {
      fireEvent.change(emotionRange, { target: { value: '0.8' } });
      await new Promise((r) => setTimeout(r, 10));
    });

    // Click save
    const save = Array.from(container.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Save Configuration')) as HTMLButtonElement | undefined;
    expect(save).toBeDefined();
    await act(async () => {
      save!.click();
      await new Promise((r) => setTimeout(r, 10));
    });

    // Wait for async calls
    await new Promise((r) => setTimeout(r, 100));

    expect(mockUpdateDirectorInputs).toHaveBeenCalled();
    expect(mockUpdateSliders).toHaveBeenCalled();

    // Check that genre was included
    const inputsArg = mockUpdateDirectorInputs.mock.calls[0][0];
    expect(inputsArg).toHaveProperty('core_theme', 'Test Theme');
    expect(inputsArg).toHaveProperty('genre');
    expect(inputsArg.genre).toContain('Drama');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });
});
