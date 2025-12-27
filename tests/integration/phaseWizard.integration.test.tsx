import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import PhaseWizard from '../../src/components/phases/PhaseWizard';

describe('PhaseWizard integration', () => {
  it('navigates between steps and preserves data', async () => {
    const finishSpy = vi.fn();
    const { getByTestId } = render(<PhaseWizard onFinish={finishSpy} />);

    expect(getByTestId('step-indicator').textContent).toContain('Step 1');

    const input = getByTestId('theme-input') as HTMLInputElement;
    fireEvent.input(input, { target: { value: 'My Theme' } });
    expect(input.value).toBe('My Theme');

    const next = getByTestId('next');
    fireEvent.click(next);

    expect(getByTestId('step-indicator').textContent).toContain('Step 2');
    expect(getByTestId('summary').textContent).toContain('My Theme');

    const back = getByTestId('back');
    fireEvent.click(back);

    expect(getByTestId('step-indicator').textContent).toContain('Step 1');
    expect((getByTestId('theme-input') as HTMLInputElement).value).toBe('My Theme');

    // finish flow
    fireEvent.click(getByTestId('next'));
    fireEvent.click(getByTestId('finish'));

    expect(finishSpy).toHaveBeenCalledWith(expect.objectContaining({ theme: 'My Theme' }));
  });
});
