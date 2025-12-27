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

    // Fetch debate result to determine winning outline
    const debatesRes = await fetch(`${supabaseUrl}/rest/v1/debates?project_id=eq.${projectId}`, { headers: { apikey: supabaseServiceKey || "", Authorization: `Bearer ${supabaseServiceKey}` } });
    const debates = await debatesRes.json();

    // Fetch story outlines
    const outlinesRes = await fetch(`${supabaseUrl}/rest/v1/story_outlines?project_id=eq.${projectId}`, { headers: { apikey: supabaseServiceKey || "", Authorization: `Bearer ${supabaseServiceKey}` } });
    const outlines = await outlinesRes.json();

    if (!outlines || outlines.length === 0) {
      return new Response(JSON.stringify({ error: "No story outlines found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Choose winning outline from the latest debate winner_perspective if available
    const latestDebate = debates?.[debates.length - 1];
    const winningOutlineRole = latestDebate?.winner_perspective || outlines[0].ai_role;
    const winningOutline = outlines.find((o: any) => o.ai_role === winningOutlineRole) || outlines[0];

    const scriptTypes = ["safe", "bold", "experimental"];
    const scripts: any[] = [];

    // Generate scripts in parallel for different script types
    const genPromises = scriptTypes.map(async (type) => {
      const script = await generateScriptFromOutline(type, winningOutline, debates);
    const storeRes = await fetch(`${supabaseUrl}/rest/v1/scripts`, {
        method: "POST",
        headers: {
          apikey: supabaseServiceKey || "",
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project_id: projectId, script_type: type, title: script.title, full_content: script.full_content, scene_count: script.scene_count, word_count: script.word_count, emotional_coherence: script.emotional_coherence, logical_continuity: script.logical_continuity, audience_tolerance: script.audience_tolerance, overall_score: script.overall_score }),
      });

      let stored: any = null;
      try {
        stored = await storeRes.json();
      } catch {
        stored = null;
      }

      // Also create initial version entry for the script
      try {
        await fetch(`${supabaseUrl}/rest/v1/script_versions`, {
          method: 'POST',
          headers: {
            apikey: supabaseServiceKey || '',
            Authorization: `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ script_id: stored?.id || null, project_id: projectId, version_number: 1, content: script.full_content, metadata: { script_type: type, title: script.title } }),
        });
      } catch {
        // ignore versioning failures so script generation still returns
      }

      return { id: stored?.id || null, script_type: type, ...script };
    });

    const generated = await Promise.all(genPromises);
    scripts.push(...generated);
    return new Response(JSON.stringify({ scripts }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error('Error generating scripts:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  });
}

export async function runGenerateScriptsForProject(projectId: string, debates: any[], outlines: any[]) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  // Choose winning outline
  const latestDebate = debates?.[debates.length - 1];
  const winningOutlineRole = latestDebate?.winner_perspective || outlines[0].ai_role;
  const winningOutline = outlines.find((o: any) => o.ai_role === winningOutlineRole) || outlines[0];

  const scriptTypes = ["safe", "bold", "experimental"];
  const scripts: any[] = [];

  const genPromises = scriptTypes.map(async (type) => {
    const script = await generateScriptFromOutline(type, winningOutline, debates);

    const storeRes = await fetch(`${supabaseUrl}/rest/v1/scripts`, {
      method: "POST",
      headers: {
        apikey: supabaseServiceKey || "",
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ project_id: projectId, script_type: type, title: script.title, full_content: script.full_content, scene_count: script.scene_count, word_count: script.word_count, emotional_coherence: script.emotional_coherence, logical_continuity: script.logical_continuity, audience_tolerance: script.audience_tolerance, overall_score: script.overall_score }),
    });

    let stored: any = null;
    try {
      stored = await storeRes.json();
    } catch {
      stored = null;
    }

    // create initial version record for the script
    try {
      await fetch(`${supabaseUrl}/rest/v1/script_versions`, {
        method: 'POST',
        headers: {
          apikey: supabaseServiceKey || '',
          Authorization: `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script_id: stored?.id || null, project_id: projectId, version_number: 1, content: script.full_content, metadata: { script_type: type, title: script.title } }),
      });
    } catch {
      // ignore version creation errors
    }

    return { id: stored?.id || null, script_type: type, ...script };
  });

  const generated = await Promise.all(genPromises);
  scripts.push(...generated);
  return scripts;
}

async function generateScriptFromOutline(type: string, outline: any, debates: any[]) {
  const systemPrompt = `You are a script-generation assistant asked to produce a full screenplay aligned to a provided three-act outline. Script type: ${type}.`;

  const debateSummary = debates?.length ? JSON.stringify(debates[debates.length - 1]) : 'No debate available';

  const userPrompt = `Using the following outline:\n${JSON.stringify(outline)}\n\nDebate summary:\n${debateSummary}\n\nProduce a JSON object with keys: title, full_content, scene_count, word_count, emotional_coherence (0-1), logical_continuity (0-1), audience_tolerance (0-1), overall_score (0-1). The full_content should be screenplay formatted text. Respond with valid JSON only.`;

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('Anthropic API key not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 4000, temperature: type === 'safe' ? 0.5 : type === 'bold' ? 0.9 : 1.0, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] }),
  });

  if (!response.ok) {
    throw new Error(`AI call failed: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch {
    // Fallback minimal script
    const fallback = {
      title: `${outline?.ai_role || 'script'} - ${type}`,
      full_content: `FAILING BACK: ${content.substring(0, 1000)}`,
      scene_count: 0,
      word_count: content.split(/\s+/).length,
      emotional_coherence: 0.5,
      logical_continuity: 0.5,
      audience_tolerance: 0.5,
      overall_score: 0.5,
    };
    return fallback;
  }
}
