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
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "Missing projectId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get director inputs and sliders from Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const projectResponse = await fetch(
      `${supabaseUrl}/rest/v1/projects?id=eq.${projectId}`,
      {
        headers: {
          apikey: supabaseServiceKey || "",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    const projects = await projectResponse.json();
    if (!projects[0]) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const directorInputsResponse = await fetch(
      `${supabaseUrl}/rest/v1/director_inputs?project_id=eq.${projectId}`,
      {
        headers: {
          apikey: supabaseServiceKey || "",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    const directorInputs = await directorInputsResponse.json();
    if (!directorInputs[0]) {
      return new Response(
        JSON.stringify({ error: "Director inputs not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const slidersResponse = await fetch(
      `${supabaseUrl}/rest/v1/control_sliders?project_id=eq.${projectId}`,
      {
        headers: {
          apikey: supabaseServiceKey || "",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    await slidersResponse.json();

    // Validate critical environment variables before doing heavy work
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const supabaseUrlEnv = Deno.env.get('SUPABASE_URL');
    const serviceKeyEnv = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!anthropicKey) {
      console.error('Missing ANTHROPIC_API_KEY for generate-concepts');
      return new Response(JSON.stringify({ error: 'Missing ANTHROPIC_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!supabaseUrlEnv || !serviceKeyEnv) {
      console.error('Missing Supabase environment configuration for generate-concepts');
      return new Response(JSON.stringify({ error: 'Missing Supabase environment configuration' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Generate concepts for each AI role
    // roles intentionally mirrored to project: visionary, classic, emotional, realist, audience, producer
    // Generate concepts in parallel and use shared AI client
    const ideas = await runGenerateConceptsForProject(projectId, directorInputs[0]);

    // Store ideas in database
    for (const idea of ideas) {
      await fetch(`${supabaseUrl}/rest/v1/ideas`, {
        method: "POST",
        headers: {
          apikey: supabaseServiceKey || "",
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
          ai_role: idea.ai_role,
          one_liner: idea.one_liner,
          logline: idea.logline,
          short_synopsis: idea.short_synopsis,
          hook_moment: idea.hook_moment,
          theme_conflict: idea.theme_conflict,
          moral_question: idea.moral_question,
          originality_score: idea.originality_score,
          philosophy_depth: idea.philosophy_depth,
        }),
      });
    }

    return new Response(
      JSON.stringify({ ideas }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  });
}


import { callAnthropicWithRetry, extractJson } from '../_shared/aiClient.ts';

export async function runGenerateConceptsForProject(projectId: string, directorInputs: any) {
  const aiRoles = ["visionary", "classic", "emotional", "realist", "audience", "producer"];
  const ideaPromises = aiRoles.map((role) => generateConceptForRole(role, directorInputs));
  return await Promise.all(ideaPromises);
}

async function generateConceptForRole(role: string, directorInputs: any) {
  const systemPrompt = getSystemPromptForRole(role, directorInputs);
  const userPrompt = createConceptGenerationPrompt(directorInputs);

  const content = await callAnthropicWithRetry(systemPrompt, userPrompt, { model: 'claude-3-5-sonnet-20241022', max_tokens: 1500, temperature: 0.8 });

  try {
    const parsed = extractJson(content);
    return { ai_role: role, ...parsed };
    } catch {
    return { ai_role: role, one_liner: 'Unable to generate', logline: content.substring(0, 100), error: 'Parse failed', raw: content };
  }
}

function getSystemPromptForRole(role: string, directorInputs: any): string {
  const prompts: Record<string, string> = {
    visionary: `You are the Visionary AI - bold, experimental, and symbolic. You push creative boundaries and embrace innovative, unconventional storytelling. You favor visual metaphors, structural experimentation, and thematic depth.`,
    classic: `You are the Classic AI - grounded in proven storytelling structure and rules. You understand three-act structure, character arcs, and narrative beats deeply. You prioritize clarity, pacing, and emotional resonance.`,
    emotional: `You are the Emotional AI - deeply attuned to human psychology and feelings. You focus on emotional authenticity, character psychology, and the inner lives of characters.`,
    realist: `You are the Realist AI - focused on logic, motivation, and believability. You examine cause-effect relationships, character motivations, and narrative consistency.`,
    audience: `You are the Audience AI - thinking like viewers and considering engagement, entertainment value, and audience retention. You predict emotional reactions and identify drop-off moments.`,
    producer: `You are the Producer AI - practical, focused on efficiency and narrative economy. You consider production feasibility and identify redundancies.`,
  };

  return `${prompts[role] || prompts["classic"]}

Director's Core Theme: ${directorInputs.core_theme}
Genres: ${directorInputs.genre.join(", ")}
Platform: ${directorInputs.platform}`;
}

function createConceptGenerationPrompt(directorInputs: any): string {
  return `Generate a compelling film concept for a ${directorInputs.genre.join("/")} project with the theme: "${directorInputs.core_theme}".

Create:
1. One-Liner: Single compelling sentence
2. Logline: 2-3 sentence summary
3. Short Synopsis: 150-200 word overview
4. Hook Moment: First 3-5 minutes
5. Moral Question: Core moral dilemma
6. Theme Conflict: Primary vs opposing
7. Originality Score: 0-1
8. Philosophy Depth: 0-1

Respond with only valid JSON.`;
}