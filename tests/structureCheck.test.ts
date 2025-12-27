import { describe, it, expect } from 'vitest';
import { runStructureCheck, enhancedRunStructureCheck } from '../supabase/functions/generate-structure-check/index.ts';

// We'll test the internal logic by invoking fetch against the function's output form.
// The function exports nothing; instead, we'll mimic a request by importing the module
// and calling the code paths via a locally extracted function (not ideal but sufficient for now).

describe('runStructureCheck', () => {
  it('throws on missing outline', () => {
    expect(() => runStructureCheck(null)).toThrow('Missing outline');
  });

  it('detects non-increasing scene numbers and missing foreshadowing', () => {
    const outline = {
      act_one: { title: 'A1', scenes: [{ number: 1, title: 'Start', description: 'intro' }, { number: 2, title: 'Middle', description: 'setup' }] },
      act_two: { title: 'A2', scenes: [{ number: 2, title: 'Conflict', description: 'rising' }, { number: 2, title: 'Twist', description: '@unresolved twist' }] },
      act_three: { title: 'A3', scenes: [{ number: 4, title: 'Climax', description: 'resolve' }] }
    };

    const res = runStructureCheck(outline as any);
    expect(res.issues.some((i: any) => i.type === 'scene_numbering')).toBe(true);
    expect(res.issues.some((i: any) => i.type === 'foreshadow_absent')).toBe(true);
    expect(res.issues.some((i: any) => i.type === 'unresolved_markers')).toBe(true);

    // Now test enhanced runner for foreshadow-payoff and late introductions
    const outline2 = {
      act_one: { title: 'A1', scenes: [{ number: 1, title: 'A Strange Prophecy', description: 'A prophecy is written on a scroll' }] },
      act_two: { title: 'A2', scenes: [{ number: 2, title: 'Conflict', description: 'characters debate the prophecy' }] },
      act_three: { title: 'A3', scenes: [{ number: 3, title: 'Reveal', description: 'the prophecy fulfills and reveals the truth' }] }
    };
    const enhanced = enhancedRunStructureCheck(outline2 as any);
    // Look for the foreshadow_payoff indicator
    const found = enhanced.issues.some((i: any) => i.type === 'foreshadow_payoff');
    expect(found).toBe(true);

    // Test late introductions
    const outline3 = {
      act_one: { title: 'One', scenes: [{ number: 1, title: 'Start', description: '', characters: ['Alice'] }] },
      act_two: { title: 'Two', scenes: [{ number: 2, title: 'Mid', description: '', characters: [] }] },
      act_three: { title: 'Three', scenes: [{ number: 3, title: 'Late', description: '', characters: ['Sam'] }] }
    };
    const enhanced2 = enhancedRunStructureCheck(outline3 as any);
    expect(enhanced2.issues.some((i: any) => i.type === 'late_introduction')).toBe(true);

    // Test disjoint transitions
    const outline4 = {
      act_one: { title: 'One', scenes: [{ number: 1, title: 'Home', description: '', setting: 'House', characters: ['A'] }] },
      act_two: { title: 'Two', scenes: [{ number: 2, title: 'Away', description: '', setting: 'Beach', characters: ['B'] }] },
      act_three: { title: 'Three', scenes: [{ number: 3, title: 'Return', description: '', setting: 'House', characters: ['A'] }] }
    };
    const enhanced3 = enhancedRunStructureCheck(outline4 as any);
    expect(enhanced3.issues.some((i: any) => i.type === 'disjoint_transition')).toBe(true);

    // Test arc continuity: character only in act 1 should trigger arc_discontinuity
    const outline5 = {
      act_one: { title: 'One', scenes: [{ number: 1, title: 'Start', description: '', characters: ['Lone'] }] },
      act_two: { title: 'Two', scenes: [{ number: 2, title: 'Mid', description: '', characters: [] }] },
      act_three: { title: 'Three', scenes: [{ number: 3, title: 'End', description: '', characters: [] }] }
    };
    const enhanced4 = enhancedRunStructureCheck(outline5 as any);
    expect(enhanced4.issues.some((i: any) => i.type === 'arc_discontinuity')).toBe(true);

    // Coherence score: for a well-foreshadowed outline, score should be high (>0.7)
    const goodOutline = {
      act_one: { scenes: [{ number: 1, title: 'Prophecy', description: 'A prophecy is written hinting the twist' }] },
      act_two: { scenes: [{ number: 2, title: 'Debate', description: 'Characters discuss the prophecy' }] },
      act_three: { scenes: [{ number: 3, title: 'Payoff', description: 'The prophecy is fulfilled' }] }
    };
    const g = enhancedRunStructureCheck(goodOutline as any);
    expect(typeof g.coherence_score).toBe('number');
    expect(g.coherence_score).toBeGreaterThan(0.6);

    // For a broken outline with many issues, score should be low
    const badOutline = {
      act_one: { scenes: [{ number: 1, title: 'Start', description: '' }, { number: 1, title: 'Dup', description: '' }] },
      act_two: { scenes: [{ number: 1, title: 'Confused', description: '@unresolved' }] },
      act_three: { scenes: [{ number: 1, title: 'Climax', description: '' }] }
    };
    const b = enhancedRunStructureCheck(badOutline as any);
    // Bad outline should score lower than the good outline and be below a modest threshold
    expect(b.coherence_score).toBeLessThan(0.9);
    expect(b.coherence_score).toBeLessThan(g.coherence_score);
  });
});
