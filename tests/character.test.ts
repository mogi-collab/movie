/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import * as aiClient from '../supabase/functions/_shared/aiClient';
import { generateCharacterForIndex } from '../supabase/functions/generate-characters/index';

describe('generateCharacterForIndex', () => {
  it('parses JSON from AI and returns a character object', async () => {
    const fakeJson = JSON.stringify({ name: 'Ava', role: 'protagonist', backstory: 'Raised on a ship', desire: 'Find home', fear: 'Loss', flaws: { primary: 'impulsive', secondary: 'stubborn' }, moral_code: 'protect family', contradictions: 'loves freedom but fears change', inner_voice: 'I must keep moving', arc_type: 'positive' });

    const spy = vi.spyOn(aiClient, 'callAnthropicWithRetry').mockResolvedValue(`Some preface text\n${fakeJson}\nSome suffix`);

    const directorInputs = { core_theme: 'Home', message: 'Belonging', genre: ['Drama'] };
    const outline = { act_one: { title: 'Start' }, act_two: { title: 'Middle' }, act_three: { title: 'End' } };

    const result = await generateCharacterForIndex(1, directorInputs as any, outline as any);

    expect(spy).toHaveBeenCalled();
    expect(result.name).toBe('Ava');
    expect(result.role).toBe('protagonist');
    expect(result.arc_type).toBe('positive');

    spy.mockRestore();
  });

  it('returns fallback object when parsing fails', async () => {
    const spy = vi.spyOn(aiClient, 'callAnthropicWithRetry').mockResolvedValue('no json here');

    const directorInputs = { core_theme: 'X' };
    const outline = null;

    const result = await generateCharacterForIndex(2, directorInputs as any, outline as any);
    expect(result.name).toBe('Character 2');
    expect(result.error).toBe('parse_failed');

    spy.mockRestore();
  });
});
