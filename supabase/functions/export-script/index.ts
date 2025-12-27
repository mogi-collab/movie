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
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      const { projectId, scriptId, versionNumber = 1, exportType = 'markdown' } = await req.json();

      if (!projectId || !scriptId) {
        return new Response(JSON.stringify({ error: 'Missing projectId or scriptId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const result = await runExportForScript(projectId, scriptId, versionNumber, exportType);
      return new Response(JSON.stringify({ export: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error) {
      console.error('Export error:', error);
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  });
}

export async function runExportForScript(projectId: string, scriptId: string, versionNumber = 1, exportType = 'markdown') {
  const supabaseUrl = (typeof Deno !== 'undefined' && (Deno as any).env) ? (Deno as any).env.get('SUPABASE_URL') : process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = (typeof Deno !== 'undefined' && (Deno as any).env) ? (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') : process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Fetch requested version
  const versionsRes = await fetch(`${supabaseUrl}/rest/v1/script_versions?script_id=eq.${scriptId}&version_number=eq.${versionNumber}`, { headers: { apikey: supabaseServiceKey || '', Authorization: `Bearer ${supabaseServiceKey}` } });
  const versions = await versionsRes.json();
  const ver = versions?.[0];

  if (!ver) throw new Error('Script version not found');

  // Create markdown or JSON
  const title = ver.metadata?.title || `Script ${scriptId}`;
  const content = ver.content || '';

  let artifactData = '';
  let mime = 'text/markdown';
  if (exportType === 'json') {
    artifactData = JSON.stringify({ title, content, metadata: ver.metadata }, null, 2);
    mime = 'application/json';
  } else {
    artifactData = `# ${title}\n\n${content}`;
    mime = 'text/markdown';
  }

  // base64 encode in Node or Deno
  const base64 = (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') ? Buffer.from(artifactData).toString('base64') : (typeof btoa === 'function' ? btoa(artifactData) : '');
  const artifact_url = `data:${mime};base64,${base64}`;

  // store export record
  const storeRes = await fetch(`${supabaseUrl}/rest/v1/exports`, {
    method: 'POST',
    headers: {
      apikey: supabaseServiceKey || '',
      Authorization: `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ project_id: projectId, export_type: exportType, artifact_url, metadata: { version_number: versionNumber, script_id: scriptId, title } }),
  });

  let stored: any = null;
  try {
    stored = await storeRes.json();
  } catch {
    stored = null;
  }

  return { id: stored?.id || null, export_type: exportType, artifact_url, metadata: { version_number: versionNumber, title }, created_at: new Date().toISOString() };
}
