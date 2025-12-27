import os
import google.generativeai as genai

"""
Example: python scripts/gemini_gen.py
Requires: pip install google-generativeai
"""

def main():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise SystemExit('Set GEMINI_API_KEY')

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    response = model.generate_content('Generate a short release plan for an indie film about identity and revenge')
    print('--- Gemini response ---')
    print(response.text)

if __name__ == '__main__':
    main()
