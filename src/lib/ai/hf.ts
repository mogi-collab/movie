import { getDefaultModel } from './config';

export async function generateWithHF(modelId: string | undefined, input: string): Promise<string> {
  const token = process.env.HF_API_TOKEN;
  if (!token) throw new Error('HF_API_TOKEN not set');

  const defaultModel = process.env.HF_DEFAULT_MODEL || getDefaultModel('backupLLM') || 'mistralai/Mistral-7B-Instruct-v0.2';
  const selectedModel = modelId || defaultModel;

  const url = `https://api-inference.huggingface.co/models/${selectedModel}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: input, parameters: { max_new_tokens: 200 } }),
  });

  if (!res.ok) throw new Error(`HF request failed: ${res.status}`);
  const json = await res.json();
  return json[0]?.generated_text || JSON.stringify(json);
}
