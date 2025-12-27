/* eslint-disable @typescript-eslint/no-explicit-any */
// Simple Supabase Edge Function to validate story structure
// For now, it performs local validations (scene continuity, foreshadowing hints, Chekhov checks)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SceneLike {
  number?: number;
  title?: string;
  description?: string;
  characters?: string[];
  setting?: string;
  act?: string;
}

function runStructureCheck(outline: Record<string, unknown>) {
  if (!outline) throw new Error('Missing outline');

  const issues: { type: string; message: string }[] = [];

  // Scene numbering and continuity check
  const scenes: SceneLike[] = [];
  for (const actKey of ['act_one','act_two','act_three']) {
    const act = outline?.[actKey] as any;
    if (!act) continue;
    for (const s of act.scenes || []) scenes.push({ ...s, act: actKey });
  }

  // ensure scene numbers increase monotonically
  const numbers = scenes.map((s) => s.number).filter((n): n is number => typeof n === 'number');
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] <= numbers[i - 1]) {
      issues.push({ type: 'scene_numbering', message: `Scene ${numbers[i]} is not greater than previous scene ${numbers[i-1]}` });
    }
  }

  // Chekhov's gun / foreshadowing detection: naive approach
  const foreshadowHints: Record<string, number> = {};
  for (const s of scenes) {
    const text = `${s.title} ${s.description}`.toLowerCase();
    const matches = (text.match(/gun|mystery|secret|hint|foreshadow|prophecy|clue/g) || []).length;
    if (s.number != null && matches) foreshadowHints[s.number] = matches;
  }
  if (Object.keys(foreshadowHints).length === 0) {
    issues.push({ type: 'foreshadow_absent', message: 'No explicit foreshadowing hints detected. Consider adding early clues for major late payoffs.' });
  }

  // Basic plot-hole heuristic: look for unresolved elements mentioned as important
  const unresolved = [] as string[];
  for (const s of scenes) {
    const txt = `${s.title} ${s.description}`.toLowerCase();
    if (/@unresolved/.test(txt)) unresolved.push(`Scene ${s.number}`);
  }
  if (unresolved.length) issues.push({ type: 'unresolved_markers', message: `Found unresolved markers in ${unresolved.join(', ')}` });

  return { issues, foreshadowHints };
}

if (typeof Deno !== 'undefined' && typeof (Deno as any).serve === 'function') {
  (Deno as any).serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

    try {
      const { outline } = await req.json();
      if (!outline) return new Response(JSON.stringify({ error: 'Missing outline' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const result = runStructureCheck(outline);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
      console.error('Structure check error', err);
      return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  });
}

export { runStructureCheck };

// Heuristic enhancements:
// - detect foreshadow -> payoff links by keyword overlap between early and later scenes
// - detect characters introduced late (first appear late without prior mention)
// - detect disjoint transitions (scene location changes and no shared characters)

function extractKeywords(text: string) {
  if (!text) return [] as string[];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['scene','act','the','and','with','from','into','then','that','this','have'].includes(w));
}

interface Payoff { foreshadow_scene: number; payoff_scene: number; keywords: string[] }
function detectForeshadowPayoffs(scenes: SceneLike[]): Payoff[] {
  // Record keywords per scene
  const kwByScene: Record<number, Set<string>> = {};
  for (const s of scenes) {
    kwByScene[s.number as number] = new Set(extractKeywords(`${s.title} ${s.description}`));
  }

  const payoffs: Payoff[] = [];
  for (let i = 0; i < scenes.length; i++) {
    for (let j = i + 1; j < scenes.length; j++) {
      const a = Array.from(kwByScene[scenes[i].number as number] || []);
      const b = Array.from(kwByScene[scenes[j].number as number] || []);
      const common = a.filter((x) => b.includes(x));
      if (common.length >= 1) {
        payoffs.push({ foreshadow_scene: scenes[i].number as number, payoff_scene: scenes[j].number as number, keywords: common });
      }
    }
  }
  return payoffs;
}

interface LateIntro { character: string; first_scene_index: number }
function detectLateIntroductions(scenes: SceneLike[]): LateIntro[] {
  const seen: Set<string> = new Set();
  const late: LateIntro[] = [];
  for (const s of scenes) {
    const chars = s.characters || [];
    for (const c of chars) {
      if (!seen.has(c) && scenes.findIndex((x) => (x.characters || []).includes(c)) > scenes.indexOf(s)) {
        // if first occurrence is later than current scene, mark late---but by iterating in order this won't happen; simpler: if char first appears beyond scene 1
      }
      if (!seen.has(c)) seen.add(c);
    }
  }
  // Simpler: characters that first appear after scene index 2 (i.e., late)
  const firstAppear: Record<string, number> = {};
  scenes.forEach((s, idx) => {
    for (const c of s.characters || []) {
      if (!firstAppear[c]) firstAppear[c] = idx + 1;
    }
  });
  for (const [c, idx] of Object.entries(firstAppear)) {
    if (idx > Math.max(1, Math.floor(scenes.length / 3))) {
      late.push({ character: c, first_scene_index: idx });
    }
  }
  return late;
}

function detectDisjointTransitions(scenes: SceneLike[]) {
  const issues: { type: string; message: string }[] = [];
  for (let i = 1; i < scenes.length; i++) {
    const prev = scenes[i - 1];
    const cur = scenes[i];
    if (prev.setting && cur.setting && prev.setting !== cur.setting) {
      const shared = (prev.characters || []).filter((c: string) => (cur.characters || []).includes(c));
      if (shared.length === 0) {
        issues.push({ type: 'disjoint_transition', message: `Scene ${cur.number} changes setting from ${prev.setting} to ${cur.setting} without overlapping characters` });
      }
    }
  }
  return issues;
}

function detectCharacterArcContinuity(scenes: SceneLike[]) {
  // Determine appearance per act index (1,2,3)
  const appear: Record<string, Set<number>> = {};
  const actIndexByScene: Record<number, number> = {};
  // Derive act index by scanning sequence and marking act changes
  let currentAct = 1;
  let lastActKey = scenes[0]?.act || 'act_one';
  scenes.forEach((s) => {
    if (s.act && s.act !== lastActKey) {
      currentAct += 1;
      lastActKey = s.act;
    }
    actIndexByScene[s.number as number] = currentAct;
  });

  for (const s of scenes) {
    const idx = actIndexByScene[s.number as number] || 1;
    for (const c of s.characters || []) {
      appear[c] = appear[c] || new Set();
      appear[c].add(idx);
    }
  }

  const issues: { type: string; character: string; message: string }[] = [];
  for (const [c, set] of Object.entries(appear)) {
    // If a character appears only in one act, flag continuity issue
    if (set.size === 1) {
      issues.push({ type: 'arc_discontinuity', character: c, message: `Character ${c} appears only in one act (may lack an arc)` });
    } else {
      // prefer that main characters appear across multiple acts including act 3
      if (!set.has(3) && set.has(1)) {
        issues.push({ type: 'arc_discontinuity', character: c, message: `Character ${c} appears early but not in act 3 (arc may not resolve)` });
      }
    }
  }
  return issues;
}

// Extend runStructureCheck to include the new heuristics
const originalRun = runStructureCheck;
function enhancedRunStructureCheck(outline: any) {
  const base = originalRun(outline);
  // Rebuild scenes list
  const scenes: any[] = [];
  for (const actKey of ['act_one','act_two','act_three']) {
    const act = outline?.[actKey];
    if (!act) continue;
    for (const s of act.scenes || []) scenes.push({ ...s, act: actKey });
  }

  const foreshadowPayoffs = detectForeshadowPayoffs(scenes);
  const lateIntroductions = detectLateIntroductions(scenes);
  const disjointTrans = detectDisjointTransitions(scenes);
  const arcContinuity = detectCharacterArcContinuity(scenes);

  const issues = [...base.issues];
  if (foreshadowPayoffs.length === 0) {
    // keep the foreshadow_absent warning already present
  } else {
    // add payoff detections
    for (const p of foreshadowPayoffs) issues.push({ type: 'foreshadow_payoff', message: `Keywords ${p.keywords.join(', ')} foreshadow in scene ${p.foreshadow_scene} and payoff in ${p.payoff_scene}` });
  }

  for (const li of lateIntroductions) issues.push({ type: 'late_introduction', message: `Character ${li.character} introduced late at scene index ${li.first_scene_index}` });
  for (const a of arcContinuity) issues.push(a);
  issues.push(...disjointTrans);

  const coherence_score = computeCoherenceScore({ issues, foreshadowPayoffs, lateIntroductions, disjointTrans, arcContinuity });

  return { ...base, foreshadowPayoffs, lateIntroductions, issues, coherence_score };
}

function computeCoherenceScore({ issues, foreshadowPayoffs, lateIntroductions, disjointTrans, arcContinuity }: { issues: any[]; foreshadowPayoffs?: any[]; lateIntroductions?: any[]; disjointTrans?: any[]; arcContinuity?: any[] }) {
  // Base score starts at 1.0
  let score = 1.0;

  // Penalty for issues: each issue reduces score slightly, capped
  const issuePenalty = Math.min(0.7, (issues?.length || 0) * 0.04);
  score -= issuePenalty;

  // Bonus for foreshadow -> payoff links
  const payoffBonus = Math.min(0.25, (foreshadowPayoffs?.length || 0) * 0.05);
  score += payoffBonus;

  // Penalty for late introductions and disjoint transitions and arc continuity problems
  const continuityPenalty = Math.min(0.25, ((lateIntroductions?.length || 0) + (disjointTrans?.length || 0) + (arcContinuity?.length || 0)) * 0.03);
  score -= continuityPenalty;

  // clamp between 0 and 1
  if (score < 0) score = 0;
  if (score > 1) score = 1;
  return Number(score.toFixed(3));
}

export { enhancedRunStructureCheck };

export {}; // keep module scope
