/* eslint-disable @typescript-eslint/no-explicit-any */
// Deno/Supabase Edge runtime types (not required during Vitest runs)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

if (typeof Deno !== 'undefined' && typeof (Deno as any).serve === 'function') {
  (Deno as any).serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      const { projectId, scriptId, versionId } = await req.json();
      if (!projectId || !scriptId || !versionId) {
        return new Response(JSON.stringify({ error: 'Missing required params' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const result = await runRollbackForScript(projectId, scriptId, versionId);
      return new Response(JSON.stringify({ result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
      console.error('Rollback error:', err);
      return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  });
}

export async function runRollbackForScript(projectId: string, scriptId: string, versionId: string) {
  const supabaseUrl = (typeof Deno !== 'undefined' && (Deno as any).env) ? (Deno as any).env.get('SUPABASE_URL') : process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = (typeof Deno !== 'undefined' && (Deno as any).env) ? (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') : process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Fetch the version
  const versionRes = await fetch(`${supabaseUrl}/rest/v1/script_versions?id=eq.${versionId}`, { headers: { apikey: supabaseServiceKey || '', Authorization: `Bearer ${supabaseServiceKey}` } });
  const versions = await versionRes.json();
  const ver = versions?.[0];
  if (!ver) throw new Error('Version not found');

  // Update script with version content
  await fetch(`${supabaseUrl}/rest/v1/scripts?id=eq.${scriptId}`, {
    method: 'PATCH',
    headers: { apikey: supabaseServiceKey || '', Authorization: `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_content: ver.content, title: ver.metadata?.title || null }),
  });

  // Create new version entry marking rollback
  const newVersionRes = await fetch(`${supabaseUrl}/rest/v1/script_versions`, {
    method: 'POST',
    headers: { apikey: supabaseServiceKey || '', Authorization: `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ script_id: scriptId, project_id: projectId, version_number: (ver.version_number || 0) + 1, content: ver.content, metadata: { ...ver.metadata, rolled_back_from: versionId } }),
  });

  let stored: any = null;
  try { stored = await newVersionRes.json(); } catch { stored = null; }

  return { rolled_to_version_id: stored?.id || null };
}
