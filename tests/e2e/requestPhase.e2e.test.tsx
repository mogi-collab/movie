import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import PhaseComingSoon from '../../src/components/phases/PhaseComingSoon';

describe('e2e: Request Early Access flow', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('submits a request and shows success', async () => {
    const fetchMock = vi.fn(async (url: string, opts?: any) => {
      expect(url).toBe('/functions/v1/request-phase-access');
      const body = JSON.parse(opts.body);
      expect(body).toMatchObject({ phase: 7, email: 'user@example.com' });
      return { ok: true, json: async () => ([{ id: 'pr-1', ...body }]) } as any;
    });

    global.fetch = fetchMock as any;

    const { container } = render(<PhaseComingSoon phase={7} title="Screenplay" description="desc" />);

    fireEvent.click(within(container).getByRole('button', { name: /Request Early Access/i }));

    const emailInput = within(container).getByPlaceholderText(/you@example.com/i);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    const notesInput = within(container).getByPlaceholderText(/Tell us what you'd like to see/i);
    fireEvent.change(notesInput, { target: { value: 'I want more natural dialogue' } });

    fireEvent.click(within(container).getByRole('button', { name: /Request Access/i }));

    await waitFor(() => expect(screen.getByText(/Request submitted/i)).toBeTruthy());

    expect(fetchMock).toHaveBeenCalled();
  });

  it('shows validation error for invalid email', async () => {
    const { container } = render(<PhaseComingSoon phase={8} title="Dialogue" description="desc" />);
    fireEvent.click(within(container).getByRole('button', { name: /Request Early Access/i }));

    const emailInput = within(container).getByPlaceholderText(/you@example.com/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    fireEvent.click(within(container).getByRole('button', { name: /Request Access/i }));

    await waitFor(() => expect(within(container).getByText(/Please enter a valid email/i)).toBeTruthy());
  });
});