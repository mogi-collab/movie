/* Pipeline runner: sequentially trigger phase functions and track progress */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export async function runPipelineHandler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { projectId } = await req.json();
    if (!projectId) return new Response(JSON.stringify({ error: 'Missing projectId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase env' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // create pipeline run entry
    const createRes = await fetch(`${supabaseUrl}/rest/v1/pipeline_runs`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    });

    const created = (await createRes.json())[0];
    const runId = created?.id;

    const phaseSequence = [
      { name: 'generate-concepts', phase: 1 },
      { name: 'generate-stories', phase: 2 },
      { name: 'generate-debates', phase: 3 },
      { name: 'generate-scripts', phase: 4 },
      { name: 'generate-characters', phase: 5 },
      { name: 'generate-structure-check', phase: 6 },
      // additional phases can be appended here and subsequent functions implemented
    ];

    const completed: number[] = [];
    const details: Record<string, any> = {};

    for (const step of phaseSequence) {
      try {
        const fnRes = await fetch(`${supabaseUrl}/functions/v1/${step.name}`, {
          method: 'POST',
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        });

        const payload = await fnRes.json().catch(() => ({ error: 'invalid-json' }));
        details[step.name] = { ok: fnRes.ok, payload };

        if (!fnRes.ok) {
          // mark pipeline run failed
          await fetch(`${supabaseUrl}/rest/v1/pipeline_runs?id=eq.${runId}`, {
            method: 'PATCH',
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'failed', finished_at: new Date().toISOString(), details: details }),
          });

          return new Response(JSON.stringify({ status: 'failed', step: step.name, details }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        completed.push(step.phase);
        // update run progress
        await fetch(`${supabaseUrl}/rest/v1/pipeline_runs?id=eq.${runId}`, {
          method: 'PATCH',
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed_phases: completed, details }),
        });
      } catch (err) {
        details[step.name] = { ok: false, error: err instanceof Error ? err.message : String(err) };
        await fetch(`${supabaseUrl}/rest/v1/pipeline_runs?id=eq.${runId}`, {
          method: 'PATCH',
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'failed', finished_at: new Date().toISOString(), details }),
        });

        return new Response(JSON.stringify({ status: 'failed', step: step.name, details }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // all phases succeeded
    await fetch(`${supabaseUrl}/rest/v1/pipeline_runs?id=eq.${runId}`, {
      method: 'PATCH',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'succeeded', finished_at: new Date().toISOString(), details, completed_phases: completed }),
    });

    return new Response(JSON.stringify({ status: 'succeeded', completed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Pipeline runner error', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

if (typeof Deno !== 'undefined' && typeof (Deno as any).serve === 'function') {
  (Deno as any).serve((req: Request) => runPipelineHandler(req));
}
