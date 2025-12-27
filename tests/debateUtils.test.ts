import { describe, it, expect } from 'vitest';
import { computeWeightedAgreementScore, computeEntropy, computeConflictIntensity, findMinorityOpinions } from '../supabase/functions/_shared/debateUtils';

describe('debateUtils', () => {
  it('agreement is 1 when all agree', () => {
    const args = [
      { ai_role: 'a', preferred_outline: 'X', strength: 0.9 },
      { ai_role: 'b', preferred_outline: 'X', strength: 0.7 },
      { ai_role: 'c', preferred_outline: 'X', strength: 0.8 },
    ];
    expect(computeWeightedAgreementScore(args)).toBeCloseTo(1);
    expect(computeEntropy(args)).toBeCloseTo(0);
    expect(computeConflictIntensity(args)).toBeCloseTo(0, 2);
    expect(findMinorityOpinions(args)).toHaveLength(0);
  });

  it('handles weighted agreement correctly', () => {
    const args = [
      { ai_role: 'a', preferred_outline: 'A', strength: 0.9 },
      { ai_role: 'b', preferred_outline: 'B', strength: 0.2 },
      { ai_role: 'c', preferred_outline: 'B', strength: 0.2 },
    ];
    const agreement = computeWeightedAgreementScore(args);
    // A has 0.9 vs B 0.4 => expected ~0.69
    expect(agreement).toBeGreaterThan(0.6);
    expect(agreement).toBeLessThan(0.8);
    const conflict = computeConflictIntensity(args);
    expect(conflict).toBeGreaterThan(0);
    expect(findMinorityOpinions(args, 0.6)).toEqual([{ ai_role: 'a', preferred_outline: 'A', strength: 0.9 }]);
  });

  it('entropy is highest when evenly split', () => {
    const args = [
      { ai_role: 'a', preferred_outline: 'A' },
      { ai_role: 'b', preferred_outline: 'B' },
      { ai_role: 'c', preferred_outline: 'C' },
      { ai_role: 'd', preferred_outline: 'D' },
    ];
    const ent = computeEntropy(args);
    expect(ent).toBeGreaterThan(0.9);
  });
});
