/* eslint-disable @typescript-eslint/no-explicit-any */
// Deno/Supabase Edge runtime types (not required during Vitest runs)
// reference: jsr:@supabase/functions-js/edge-runtime.d.ts

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

if (typeof Deno !== 'undefined' && typeof (Deno as any).serve === 'function') {
  (Deno as any).serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();
    if (!projectId) {
      return new Response(JSON.stringify({ error: "Missing projectId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Gather story outlines to debate
    const outlinesRes = await fetch(`${supabaseUrl}/rest/v1/story_outlines?project_id=eq.${projectId}`, { headers: { apikey: supabaseServiceKey || "", Authorization: `Bearer ${supabaseServiceKey}` } });
    const outlines = await outlinesRes.json();

    if (!outlines || outlines.length === 0) {
      return new Response(JSON.stringify({ error: "No story outlines found to debate" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = await runGenerateDebatesForProject(projectId, outlines);
    return new Response(JSON.stringify({ debates: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error('Error generating debates:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  });
}

import { callAnthropicWithRetry, extractJson } from '../_shared/aiClient.ts';
// ensure we don't try to resolve Deno types during Vitest runs

export async function runGenerateDebatesForProject(projectId: string, outlines: any[]) {
  const aiRoles = ["visionary", "classic", "emotional", "realist", "audience", "producer"];
  const debates: any[] = [];

  // We'll debate the question: Which outline should be the foundation for the script?
  const topic = "Preferred Outline Selection";

  // Each AI provides a JSON response stating preferred_outline (ai_role), argument, strength (0-1), and optional counter_arguments
  // Generate arguments in parallel
  const argPromises = aiRoles.map((role) => generateArgumentForRole(role, outlines));
  const argumentsFromRoles = await Promise.all(argPromises);

  // Compute agreement score: proportion that selected the majority preferred outline
  // Compute improved agreement and conflict scores
  const { computeWeightedAgreementScore, computeConflictIntensity, findMinorityOpinions } = await import('../_shared/debateUtils.ts');
  const agreement_score = computeWeightedAgreementScore(argumentsFromRoles);
  const conflict_intensity = computeConflictIntensity(argumentsFromRoles);
  const minority_opinions = findMinorityOpinions(argumentsFromRoles, 0.6);

  // determine winner_perspective (most frequent preferred outline)
  const prefCounts: Record<string, number> = {};
  for (const a of argumentsFromRoles) {
    const p = a.preferred_outline || 'none';
    prefCounts[p] = (prefCounts[p] || 0) + 1;
  }
  const winner_perspective = Object.keys(prefCounts).reduce((best, k) => (prefCounts[k] > (prefCounts[best] || 0) ? k : best), Object.keys(prefCounts)[0]);

  const debateRecord: any = {
    project_id: projectId,
    phase: 3,
    topic,
    discussion: argumentsFromRoles.map((a) => ({ ai_role: a.ai_role, perspective: a.argument, timestamp: new Date().toISOString() })),
    arguments: argumentsFromRoles.map((a) => ({ ai_role: a.ai_role, argument: a.argument, strength: a.strength, counter_arguments: a.counter_arguments || [] })),
    agreement_score,
    conflict_intensity,
    winner_perspective,
    minority_opinions,
  };

  // Store debate
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const storeRes = await fetch(`${supabaseUrl}/rest/v1/debates`, {
    method: "POST",
    headers: {
      apikey: supabaseServiceKey || "",
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(debateRecord),
  });

  if (!storeRes.ok) {
    console.error('Failed to store debate', await storeRes.text());
  }

  debates.push({ id: (await storeRes.json())?.id || null, ...debateRecord });
  return debates;
}

async function generateArgumentForRole(role: string, outlines: any[]) {
  const outlineSummaries = outlines.map((o: any) => ({ ai_role: o.ai_role, act_one_title: o.act_one?.title || '', act_two_title: o.act_two?.title || '', act_three_title: o.act_three?.title || '' }));

  const systemPrompt = `You are the ${role} AI. Your job: evaluate multiple three-act outlines and recommend which outline should be used as the foundation for the script, considering your perspective (visionary, classic, emotional, realist, audience, producer).`;

  const userPrompt = `Here are the outlines: ${JSON.stringify(outlineSummaries)}\n\nRespond with valid JSON only in the format: { "preferred_outline": "ai_role", "argument": "...", "strength": 0-1, "counter_arguments": ["..."] }`;

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const content = await callAnthropicWithRetry(systemPrompt, userPrompt, { model: 'claude-3-5-sonnet-20241022', max_tokens: 1200, temperature: 0.7 });

  try {
    const parsed = extractJson(content);
    return { ai_role: role, preferred_outline: parsed.preferred_outline, argument: parsed.argument, strength: parsed.strength ?? 0.5, counter_arguments: parsed.counter_arguments ?? [] };
  } catch {
    return { ai_role: role, preferred_outline: outlines[0]?.ai_role, argument: content.substring(0, 600), strength: 0.5, counter_arguments: [] };
  }
}
