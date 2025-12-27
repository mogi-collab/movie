export async function generateWithHF(modelId: string, input: string): Promise<string> {
  const token = process.env.HF_API_TOKEN;
  if (!token) throw new Error('HF_API_TOKEN not set');

  const url = `https://api-inference.huggingface.co/models/${modelId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: input, parameters: { max_new_tokens: 200 } }),
  });

  if (!res.ok) throw new Error(`HF request failed: ${res.status}`);
  const json = await res.json();
  return json[0]?.generated_text || JSON.stringify(json);
}
