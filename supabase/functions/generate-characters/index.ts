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
      const { projectId, numberOfCharacters = 3 } = await req.json();

      if (!projectId) {
        return new Response(JSON.stringify({ error: "Missing projectId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      // Load context: director inputs, story outlines
      const [inputsRes, outlinesRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/director_inputs?project_id=eq.${projectId}`, { headers: { apikey: supabaseServiceKey || "", Authorization: `Bearer ${supabaseServiceKey}` } }),
        fetch(`${supabaseUrl}/rest/v1/story_outlines?project_id=eq.${projectId}`, { headers: { apikey: supabaseServiceKey || "", Authorization: `Bearer ${supabaseServiceKey}` } }),
      ]);

      const directorInputs = (await inputsRes.json())[0];
      const outlines = await outlinesRes.json();

      if (!directorInputs) {
        return new Response(JSON.stringify({ error: "Director inputs not configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const referenceOutline = outlines?.[0] || null;

      // Generate characters in parallel
      const charPromises = Array.from({ length: numberOfCharacters }).map((_, idx) => generateCharacterForIndex(idx + 1, directorInputs, referenceOutline));
      const characters = await Promise.all(charPromises);

      // Store characters
      for (const c of characters) {
        await fetch(`${supabaseUrl}/rest/v1/characters`, {
          method: "POST",
          headers: {
            apikey: supabaseServiceKey || "",
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(Object.assign({ project_id: projectId }, (typeof c === 'object' && c !== null) ? c : {})),
        });
      }

      return new Response(JSON.stringify({ characters }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (error) {
      console.error('Error generating characters:', error);
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  });
}

import { callAnthropicWithRetry, extractJson } from '../_shared/aiClient.ts';

export async function generateCharacterForIndex(index: number, directorInputs: any, outline: any) {
  const systemPrompt = `You are a Character Design AI creating a deep profile for a major character in a film. Use director vision and the outline to craft distinct characters.`;

  const userPrompt = `Director Vision: ${JSON.stringify({ theme: directorInputs.core_theme, message: directorInputs.message, genres: directorInputs.genre })}\n\nOutline (summary): ${JSON.stringify(outline?.act_one?.title ? { act_one: outline.act_one.title, act_two: outline.act_two?.title, act_three: outline.act_three?.title } : {})}\n\nProduce a JSON object:
{
  "name": "",
  "role": "(protagonist/antagonist/ally)",
  "backstory": "",
  "desire": "",
  "fear": "",
  "flaws": {"primary": "", "secondary": ""},
  "moral_code": "",
  "contradictions": "",
  "inner_voice": "",
  "arc_type": "(positive|negative|flat|tragic|corruption|redemption)"
}

Respond with valid JSON only.`;

  const content = await callAnthropicWithRetry(systemPrompt, userPrompt, { max_tokens: 800, temperature: 0.8 });
  try {
    const parsed = extractJson(content);
    return parsed;
  } catch {
    return { name: `Character ${index}`, role: 'support', backstory: '', desire: '', fear: '', flaws: { primary: '', secondary: '' }, moral_code: '', contradictions: '', inner_voice: '', arc_type: 'flat', error: 'parse_failed', raw: content };
  }
}

export async function runGenerateCharactersForProject(projectId: string, directorInputs: any, outline: any, numberOfCharacters = 3) {
  const charPromises = Array.from({ length: numberOfCharacters }).map((_, idx) => generateCharacterForIndex(idx + 1, directorInputs, outline));
  return await Promise.all(charPromises);
}
