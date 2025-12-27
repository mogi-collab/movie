import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import PhaseWizard from '../../src/components/phases/PhaseWizard';

describe('e2e: Phase wizard full flow', () => {
  it('runs full wizard flow including validation and finish', () => {
    const finishSpy = vi.fn();
    const { getByTestId, queryByTestId } = render(<PhaseWizard onFinish={finishSpy} />);

    // initial step
    expect(getByTestId('step-indicator').textContent).toContain('Step 1');

    // try to advance without theme - should show validation error
    fireEvent.click(getByTestId('next'));
    expect(getByTestId('error').textContent).toContain('Please enter a core theme');

    // fill theme and advance
    const input = getByTestId('theme-input') as HTMLInputElement;
    fireEvent.input(input, { target: { value: 'E2E Theme' } });
    fireEvent.click(getByTestId('next'));

    expect(queryByTestId('error')).toBeNull();
    expect(getByTestId('step-indicator').textContent).toContain('Step 2');
    expect(getByTestId('summary').textContent).toContain('E2E Theme');

    // back to step 1 and ensure data persisted
    fireEvent.click(getByTestId('back'));
    expect((getByTestId('theme-input') as HTMLInputElement).value).toBe('E2E Theme');

    // forward and finish
    fireEvent.click(getByTestId('next'));
    fireEvent.click(getByTestId('finish'));

    expect(finishSpy).toHaveBeenCalledWith(expect.objectContaining({ theme: 'E2E Theme' }));
  });
});