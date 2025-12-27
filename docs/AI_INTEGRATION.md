# AI Integration Guide

This document shows recommended environment variables, example usage, and repository integration for AI services used in this project.

## Environment variables
Windows (PowerShell):

setx GEMINI_API_KEY "your_new_gemini_key_here"
setx HF_API_TOKEN "your_new_hf_token_here"

macOS / Linux:

export GEMINI_API_KEY="your_new_gemini_key_here"
export HF_API_TOKEN="your_new_hf_token_here"

> Restart VS Code after setting env vars in your shell so the editor picks them up.
>
> Note: A `.env.example` file has been added to this repo showing the keys `GEMINI_API_KEY` and `HF_API_TOKEN` for local development. Do **not** add real keys to source control — copy `.env.example` to `.env` and fill the values locally.



## Overview & recommended models

The repository uses the following default providers and models (also available in `ai.config.json`). Use the environment variables `GEMINI_MODEL` and `HF_DEFAULT_MODEL` to override these defaults.

| Feature | Tool / Model |
|--------:|:-------------|
| Core generation | Gemini — `gemini-1.5-flash` (fallback `gemini-1.5-pro`) |
| Backup LLM | Hugging Face — `mistralai/Mistral-7B-Instruct-v0.2` (alt: `meta-llama/Meta-Llama-3-8B-Instruct`) |
| Multi-AI debate | CrewAI (`crewai` package) |
| Emotion detection | `bhadresh-savani/distilbert-base-uncased-emotion` |
| Dialogue emotion | DistilBERT (`distilbert-base-uncased-finetuned-sst-2-english`) |
| Story logic | spaCy + KeyBERT |
| Memory | FAISS + `sentence-transformers/all-MiniLM-L6-v2` |
| Visuals | Stable Diffusion (e.g., `runwayml/stable-diffusion-v1-5`) |
| Audience logic | scikit-learn |

Also: see `ai.config.json` for machine-readable defaults used by helper functions.


## Files added in this repo
- docs/AI_INTEGRATION.md (this file)
- scripts/gemini_gen.py — Python example using `google-generativeai`
- scripts/hf_gen.py — Python example using `transformers`
- scripts/hf_example.js — Node example calling Hugging Face Inference API
- scripts/requirements.txt — Python deps
- src/lib/ai/gemini.ts — TypeScript helper (basic client + env checks)
- src/lib/ai/hf.ts — TypeScript helper for Hugging Face inference
- tests/lib/gemini.test.ts, tests/lib/hf.test.ts — unit tests for helpers
- .github/workflows/ai-examples.yml — example workflow showing secret usage


## Quick usage snippets
### Python — Gemini
```python
import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")
response = model.generate_content("Generate a movie logline about identity and revenge")
print(response.text)
```

### Node — Hugging Face example
```js
// scripts/hf_example.js
const fetch = require('node-fetch');

async function main(){
  const token = process.env.HF_API_TOKEN;
  if(!token) throw new Error('Set HF_API_TOKEN');
  const res = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: 'Write a dramatic confrontation scene', parameters: { max_new_tokens: 200 } })
  });
  const data = await res.json();
  console.log(data[0]?.generated_text || JSON.stringify(data));
}

main().catch(console.error);
```


## CI notes and secrets
- Store `GEMINI_API_KEY` and `HF_API_TOKEN` in GitHub Actions secrets and access them using `secrets.GEMINI_API_KEY` and `secrets.HF_API_TOKEN`.
- Use `GEMINI_MODEL` and `HF_DEFAULT_MODEL` as secrets or env overrides when needed.
- See `.github/workflows/ai-examples.yml` for an example CI job running the python and node examples using secrets.

> New: `docs/AI_DIRECTOR.md` provides a high-level design for the multi-phase Director Assistant and links to the phase specs and implementation notes.


## Security & best practices
- Never commit API keys or tokens into the repository.
- Prefer role-limited API keys and rotate them regularly.
- For production operations, consider using a backend-only service (server functions) to keep keys out of client bundles.


## Next steps
- Add real prompts and persistence for specific phases (e.g., Phase 7 outline generation). See `docs/PHASE7_SPEC.md` for scope alignment.

---
Created: 2025-12-27
