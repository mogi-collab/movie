import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import PhaseWizard from '../../src/components/phases/PhaseWizard';

describe('PhaseWizard validation', () => {
  it('prevents advancing when theme is empty and shows error', () => {
    const finishSpy = vi.fn();
    const { getByTestId, queryByTestId } = render(<PhaseWizard onFinish={finishSpy} />);

    expect(getByTestId('step-indicator').textContent).toContain('Step 1');

    // click next without entering theme
    fireEvent.click(getByTestId('next'));

    expect(getByTestId('step-indicator').textContent).toContain('Step 1');
    const err = getByTestId('error');
    expect(err).toBeTruthy();
    expect(err.textContent).toContain('Please enter a core theme');

    // fill in theme and advance
    const input = getByTestId('theme-input') as HTMLInputElement;
    fireEvent.input(input, { target: { value: 'A theme' } });
    fireEvent.click(getByTestId('next'));

    expect(queryByTestId('error')).toBeNull();
    expect(getByTestId('step-indicator').textContent).toContain('Step 2');

    // finish and assert onFinish
    fireEvent.click(getByTestId('finish'));
    expect(finishSpy).toHaveBeenCalledWith(expect.objectContaining({ theme: 'A theme' }));
  });
});
