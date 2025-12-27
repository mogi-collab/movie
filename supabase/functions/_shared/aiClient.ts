// Shared AI client utilities for Supabase Edge Functions
// Includes simple in-memory cache and retry logic for Anthropic API calls

export const cache = new Map<string, string>();

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function callAnthropicWithRetry(
  systemPrompt: string,
  userPrompt: string,
  opts: { model?: string; max_tokens?: number; temperature?: number } = {}
) {
  const model = opts.model || 'claude-3-5-sonnet-20241022';
  const max_tokens = opts.max_tokens || 1500;
  const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.8;

  const cacheKey = `${model}::${temperature}::${systemPrompt}::${userPrompt}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('Anthropic API key not configured');

  const maxAttempts = 3;
  let attempt = 0;
  let lastErr: any = null;

  while (attempt < maxAttempts) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model, max_tokens, temperature, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] }),
      });

      if (!res.ok) {
        const text = await res.text();
        const err = new Error(`Anthropic API error: ${res.status} ${res.statusText} ${text}`);
        throw err;
      }

      const data = await res.json();
      const content = data?.content?.[0]?.text;
      if (typeof content === 'string') {
        cache.set(cacheKey, content);
        return content;
      }

      throw new Error('No content in Anthropic response');
    } catch (err) {
      lastErr = err;
      attempt += 1;
      const backoff = 200 * Math.pow(2, attempt);
      await sleep(backoff);
    }
  }

  throw lastErr;
}

export function extractJson(content: string) {
  const m = content.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON found');
  return JSON.parse(m[0]);
}
