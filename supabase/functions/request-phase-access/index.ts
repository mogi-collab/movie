/* Request Phase Access: accept phase, projectId (optional), email, notes and persist into phase_requests */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export async function requestPhaseAccessHandler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, phase, email, notes } = body as { projectId?: string; phase?: number; email?: string; notes?: string };

    if (!phase || typeof phase !== 'number') {
      return new Response(JSON.stringify({ error: 'missing phase' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return new Response(JSON.stringify({ error: 'invalid email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = (typeof Deno !== 'undefined' && (Deno as any).env) ? (Deno as any).env.get('SUPABASE_URL') : undefined;
    const serviceKey = (typeof Deno !== 'undefined' && (Deno as any).env) ? (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') : undefined;

    if (!supabaseUrl || !serviceKey) {
      // Try process env (for unit tests in Node)
      const env = (typeof process !== 'undefined' && (process as any).env) ? (process as any).env : {};
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({ error: 'Missing Supabase env' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const dbUrl = supabaseUrl || (process.env as any).SUPABASE_URL;
    const dbKey = serviceKey || (process.env as any).SUPABASE_SERVICE_ROLE_KEY;

    const insertBody: any = { phase, email, notes };
    if (projectId) insertBody.project_id = projectId;

    const res = await fetch(`${dbUrl}/rest/v1/phase_requests`, {
      method: 'POST',
      headers: { apikey: dbKey, Authorization: `Bearer ${dbKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(insertBody),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'failed to persist');
      return new Response(JSON.stringify({ error: 'db error', detail: text }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const created = (await res.json())[0];
    return new Response(JSON.stringify({ ok: true, data: created }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('request-phase-access error', err);
    return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

if (typeof Deno !== 'undefined' && typeof (Deno as any).serve === 'function') {
  (Deno as any).serve((req: Request) => requestPhaseAccessHandler(req));
}
