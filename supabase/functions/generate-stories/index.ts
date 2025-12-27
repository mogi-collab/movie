/* eslint-disable @typescript-eslint/no-explicit-any */
// Deno/Supabase Edge runtime types (not required during Vitest runs)
// reference: jsr:@supabase/functions-js/edge-runtime.d.ts
import { callAnthropicWithRetry, extractJson } from '../_shared/aiClient.ts';

export async function runGenerateOutlinesForProject(projectId: string, directorInputs: any, sliders: any) {
  const aiRoles = ["visionary", "classic", "emotional", "realist", "audience", "producer"];
  const outlinePromises = aiRoles.map((role) => generateOutlineForRole(role, directorInputs, sliders));
  return await Promise.all(outlinePromises);
}

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

    // Fetch director inputs and sliders
    const [projectRes, inputsRes, slidersRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${projectId}`, { headers: { apikey: supabaseServiceKey || "", Authorization: `Bearer ${supabaseServiceKey}` } }),
      fetch(`${supabaseUrl}/rest/v1/director_inputs?project_id=eq.${projectId}`, { headers: { apikey: supabaseServiceKey || "", Authorization: `Bearer ${supabaseServiceKey}` } }),
      fetch(`${supabaseUrl}/rest/v1/control_sliders?project_id=eq.${projectId}`, { headers: { apikey: supabaseServiceKey || "", Authorization: `Bearer ${supabaseServiceKey}` } }),
    ]);

    const projects = await projectRes.json();
    if (!projects[0]) {
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const directorInputs = (await inputsRes.json())[0];
    if (!directorInputs) {
      return new Response(JSON.stringify({ error: "Director inputs not configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const [sliders = getDefaultSliders()] = await slidersRes.json();

    const aiRoles = ["visionary", "classic", "emotional", "realist", "audience", "producer"];
    // Parallelize outline generation
    const outlinePromises = aiRoles.map((role) => generateOutlineForRole(role, directorInputs, sliders));
    const outlines: any[] = await Promise.all(outlinePromises);

    // Store outlines
    for (const o of outlines) {
      await fetch(`${supabaseUrl}/rest/v1/story_outlines`, {
        method: "POST",
        headers: {
          apikey: supabaseServiceKey || "",
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project_id: projectId, ai_role: o.ai_role, act_one: o.act_one, act_two: o.act_two, act_three: o.act_three, emotional_arc: o.emotional_arc, endings: o.endings }),
      });
    }

    return new Response(JSON.stringify({ outlines }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch {
    console.error("Error generating stories");
    return new Response(JSON.stringify({ error: "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  });
}

function getDefaultSliders() {
  return {
    emotion_intensity: 0.5,
    tension_aggression: 0.5,
    dialogue_density: 0.5,
    visual_symbolism: 0.5,
    pace: 0.5,
  };
}

async function generateOutlineForRole(role: string, directorInputs: any, sliders: any) {
  const systemPrompt = `You are the ${role} AI. Produce a three-act story outline aligned with the director's vision.`;
  const userPrompt = createOutlinePrompt(directorInputs, sliders);

  const content = await callAnthropicWithRetry(systemPrompt, userPrompt, { model: 'claude-3-5-sonnet-20241022', max_tokens: 2000, temperature: 0.8 });

  try {
    const parsed = extractJson(content);
    return { ai_role: role, ...parsed };
  } catch {
    return { ai_role: role, act_one: { title: '', scenes: [] }, act_two: { title: '', scenes: [] }, act_three: { title: '', scenes: [] }, emotional_arc: [], endings: [], error: 'Parse failed', raw: content };
  }
}

function createOutlinePrompt(directorInputs: any) {
  return `Create a three-act outline for a film with theme: "${directorInputs.core_theme}". Provide:
{
  "act_one": { "title": "", "scenes": [{ "number": 1, "title": "", "description": "" }] },
  "act_two": { "title": "", "scenes": [] },
  "act_three": { "title": "", "scenes": [] },
  "emotional_arc": [{ "act": 1, "emotion": "", "description": "" }],
  "endings": [{ "type": "", "description": "", "emotional_impact": "", "audience_satisfaction": 0.8 }]
}

Use JSON only and make sure the structure is valid.`;
}
