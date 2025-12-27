// Node example for Hugging Face Inference API
// Usage: node scripts/hf_example.js

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main(){
  const token = process.env.HF_API_TOKEN;
  if(!token) throw new Error('Set HF_API_TOKEN');

  const res = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: 'Write a short promotion plan for an indie film', parameters: { max_new_tokens: 200 } })
  });
  const data = await res.json();
  console.log(data[0]?.generated_text || JSON.stringify(data));
}

main().catch(err => { console.error(err); process.exit(1); });
