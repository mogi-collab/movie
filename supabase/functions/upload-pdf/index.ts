/* eslint-disable @typescript-eslint/no-explicit-any */
// Deno/Supabase Edge runtime

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
      const { projectId, filename, base64, contentType } = await req.json();
      if (!projectId || !filename || !base64) {
        return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const result = await runUploadPdf(projectId, filename, base64, contentType || 'application/pdf');
      return new Response(JSON.stringify({ url: result.url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
      console.error('upload-pdf error:', err);
      return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  });
}

export async function runUploadPdf(
  projectId: string,
  filename: string,
  base64: string,
  contentType = 'application/pdf',
  opts?: { retries?: number; backoffMs?: number[] }
) {
  const supabaseUrl = (typeof Deno !== 'undefined' && (Deno as any).env)
    ? (Deno as any).env.get('SUPABASE_URL')
    : (process as any).SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = (typeof Deno !== 'undefined' && (Deno as any).env)
    ? (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY')
    : (process as any).SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = (typeof Deno !== 'undefined' && (Deno as any).env)
    ? (Deno as any).env.get('PDF_STORAGE_BUCKET')
    : (process as any).PDF_STORAGE_BUCKET || process.env.PDF_STORAGE_BUCKET || 'exports';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase storage not configured');
  }

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURIComponent(filename)}`;

  const body = (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') ? Buffer.from(base64, 'base64') : atob(base64);

  // Retry/backoff defaults
  const retries = opts?.retries ?? 3;
  const backoffMs = opts?.backoffMs ?? [100, 200, 400];

  const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

  let lastErr: any = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          'Content-Type': contentType,
        },
        body,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Storage upload failed: ${res.status} ${text}`);
      }

      // Return a public object URL (assumes public bucket)
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(filename)}`;
      return { url: publicUrl };
    } catch (err) {
      lastErr = err;
      if (attempt < retries - 1) {
        const delay = backoffMs[Math.min(attempt, backoffMs.length - 1)];
        await wait(delay);
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('Storage upload failed after retries');
}
