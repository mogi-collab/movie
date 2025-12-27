import os
from transformers import pipeline

"""
Example: python scripts/hf_gen.py
Requires: pip install transformers torch huggingface_hub
"""

def main():
    token = os.getenv('HF_API_TOKEN')
    if not token:
        raise SystemExit('Set HF_API_TOKEN')

    generator = pipeline(
        'text-generation',
        model='mistralai/Mistral-7B-Instruct-v0.2',
        device_map='auto',
        use_auth_token=token,
    )

    outputs = generator('Write a short festival release plan for a microbudget film', max_length=200)
    print(outputs[0]['generated_text'])

if __name__ == '__main__':
    main()
