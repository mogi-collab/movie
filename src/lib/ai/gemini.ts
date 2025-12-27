export interface GeminiResponse {
  text: string;
}

export async function generateWithGemini(prompt: string, model?: string): Promise<GeminiResponse> {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

  // Model selection: function arg -> env var -> fallback default
  const selectedModel = model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  // Minimal HTTP call outline; recommend using the official Python client for complex usage.
  const url = `https://generativelanguage.googleapis.com/v1beta2/models/${selectedModel}:generate`;
  const body = JSON.stringify({ prompt });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
    },
    body,
  });

  if (!res.ok) throw new Error(`Gemini request failed: ${res.status}`);
  const json = await res.json();
  // This is simplified — adjust parsing based on the real API response shape.
  return { text: json?.candidates?.[0]?.content?.[0]?.text || json?.output?.[0]?.content || JSON.stringify(json) };
}
