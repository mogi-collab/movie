import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(async ({ email, password }) => ({ data: { user: { id: 'u1', email } }, error: null })),
      signInWithPassword: vi.fn(async ({ email, password }) => ({ data: { session: { user: { id: 'u1', email } } }, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
    },
  },
}));

import { signUpUser, signInUser, signOutUser } from '../../src/lib/auth';
import { supabase } from '../../src/lib/supabase';

describe('auth lib', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('signs up a user', async () => {
    const res = await signUpUser('test@example.com', 'password');
    expect(res).toHaveProperty('user');
    expect((supabase.auth.signUp as any)).toHaveBeenCalled();
  });

  it('signs in a user', async () => {
    const res = await signInUser('test@example.com', 'password');
    expect(res).toHaveProperty('session');
    expect((supabase.auth.signInWithPassword as any)).toHaveBeenCalled();
  });

  it('signs out a user', async () => {
    const res = await signOutUser();
    expect(res).toBe(true);
    expect((supabase.auth.signOut as any)).toHaveBeenCalled();
  });
});
