export interface RoleArgument {
  ai_role: string;
  preferred_outline?: string;
  argument?: string;
  strength?: number; // 0-1
}

export function computeWeightedAgreementScore(args: RoleArgument[]): number {
  if (!args || args.length === 0) return 0;
  const totals: Record<string, number> = {};
  let totalStrength = 0;

  for (const a of args) {
    const pref = a.preferred_outline || 'none';
    const s = typeof a.strength === 'number' ? a.strength : 1;
    totals[pref] = (totals[pref] || 0) + s;
    totalStrength += s;
  }

  if (totalStrength === 0) return 0;

  const maxWeighted = Math.max(...Object.values(totals));
  return Math.min(1, Math.max(0, maxWeighted / totalStrength));
}

export function computeEntropy(args: RoleArgument[]): number {
  if (!args || args.length === 0) return 0;
  const counts: Record<string, number> = {};
  for (const a of args) {
    const pref = a.preferred_outline || 'none';
    counts[pref] = (counts[pref] || 0) + 1;
  }
  const n = args.length;
  let entropy = 0;
  for (const k of Object.keys(counts)) {
    const p = counts[k] / n;
    entropy -= p * Math.log2(p);
  }
  // normalize by max entropy (log2(n))
  const maxEnt = Math.log2(Object.keys(counts).length || 1);
  return maxEnt === 0 ? 0 : entropy / maxEnt;
}

export function computeConflictIntensity(args: RoleArgument[]): number {
  // Higher entropy = higher conflict; also reduce by agreement strength
  const agreement = computeWeightedAgreementScore(args);
  const entropyNorm = computeEntropy(args);
  // combine both measures: if entropy high and agreement low -> high conflict
  const conflict = Math.min(1, Math.max(0, 0.6 * entropyNorm + 0.4 * (1 - agreement)));
  return conflict;
}

export function findMinorityOpinions(args: RoleArgument[], thresholdStrength = 0.6) {
  if (!args || args.length === 0) return [] as RoleArgument[];
  // Determine majority preferred
  const counts: Record<string, number> = {};
  for (const a of args) {
    const pref = a.preferred_outline || 'none';
    counts[pref] = (counts[pref] || 0) + 1;
  }
  let majority: string | null = null;
  let max = 0;
  for (const k of Object.keys(counts)) {
    if (counts[k] > max) {
      max = counts[k];
      majority = k;
    }
  }

  return args.filter((a) => a.preferred_outline !== majority && (a.strength || 0) >= thresholdStrength);
}
