import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import PhaseComingSoon from '../../src/components/phases/PhaseComingSoon';

describe('PhaseComingSoon', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) } as any));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.resetAllMocks();
  });

  it('opens modal and submits request successfully', async () => {
    render(<PhaseComingSoon phase={7} title="Screenplay" description="desc" />);

    const button = screen.getByRole('button', { name: /Request Early Access/i });
    fireEvent.click(button);

    expect(screen.getByRole('dialog')).toBeTruthy();

    const emailInput = screen.getByPlaceholderText('you@example.com');
    fireEvent.change(emailInput, { target: { value: 'tester@example.com' } });

    const sendBtn = screen.getByRole('button', { name: /Request Access/i });
    fireEvent.click(sendBtn);

    await waitFor(() => expect(screen.getByText(/Request submitted/i)).toBeTruthy());
  });
});