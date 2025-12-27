import { DirectorInputs, ControlSliders, AIRole } from '../types';

export interface AIRequest {
  projectId: string;
  directorInputs: DirectorInputs;
  sliders: ControlSliders;
  phase: number;
  role: AIRole;
}

export interface AIResponse {
  role: AIRole;
  phase: number;
  output: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

const AI_SYSTEM_PROMPTS: Record<AIRole, string> = {
  visionary: `You are the Visionary AI - bold, experimental, and symbolic. You push creative boundaries and embrace innovative, unconventional storytelling. You favor visual metaphors, structural experimentation, and thematic depth. Your suggestions are daring and artistically ambitious. You challenge conventions and inspire bold creative decisions.`,

  classic: `You are the Classic AI - grounded in proven storytelling structure and rules. You understand three-act structure, character arcs, and narrative beats deeply. You prioritize clarity, pacing, and emotional resonance through established techniques. Your suggestions are reliable and tested by industry standards.`,

  emotional: `You are the Emotional AI - deeply attuned to human psychology and feelings. You focus on emotional authenticity, character psychology, and the inner lives of characters. You understand empathy, vulnerability, and the emotional journey of the audience. Your suggestions prioritize emotional truth and connection.`,

  realist: `You are the Realist AI - focused on logic, motivation, and believability. You examine cause-effect relationships, character motivations, and narrative consistency. You identify plot holes and unrealistic elements. Your suggestions ensure the story makes logical sense within its world.`,

  audience: `You are the Audience AI - thinking like viewers and considering engagement, entertainment value, and audience retention. You predict emotional reactions, identify drop-off moments, and suggest ways to maintain engagement. You understand what keeps audiences invested and coming back.`,

  producer: `You are the Producer AI - practical, focused on efficiency and narrative economy. You consider production feasibility, budget implications, and story efficiency. You identify redundancies and suggest streamlining. Your suggestions balance artistic vision with practical constraints.`,
};

export function getSystemPrompt(role: AIRole, directorInputs: DirectorInputs): string {
  const basePrompt = AI_SYSTEM_PROMPTS[role];

  const contextInfo = `

DIRECTOR'S VISION:
- Core Theme: ${directorInputs.core_theme}
- Message: ${directorInputs.message || 'Not specified'}
- Genres: ${directorInputs.genre.join(', ')}
- Platform: ${directorInputs.platform}
- Risk Appetite: ${directorInputs.risk_appetite < 0.4 ? 'Safe/Commercial' : directorInputs.risk_appetite > 0.6 ? 'Bold/Artistic' : 'Balanced'}
- Target Audience: ${directorInputs.target_audience?.description || 'Not specified'}
`;

  return basePrompt + contextInfo;
}

export function applySliderInfluence(output: Record<string, unknown>, sliders: ControlSliders): Record<string, unknown> {
  return {
    ...output,
    _applied_sliders: {
      emotion_intensity: sliders.emotion_intensity,
      tension_aggression: sliders.tension_aggression,
      dialogue_density: sliders.dialogue_density,
      visual_symbolism: sliders.visual_symbolism,
      pace: sliders.pace,
    },
  };
}

export function combineAIOutputs(outputs: AIResponse[]): Record<string, unknown> {
  return {
    perspectives: Object.fromEntries(outputs.map((o) => [o.role, o.output])),
    generated_at: new Date().toISOString(),
    total_responses: outputs.length,
  };
}

export async function callAIAPI(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.8
): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export function createConceptGenerationPrompt(directorInputs: DirectorInputs): string {
  return `You are helping develop a film concept for a ${directorInputs.genre.join('/')} project.

Core Details:
- Theme: ${directorInputs.core_theme}
- Platform: ${directorInputs.platform}
- Message: ${directorInputs.message || 'To be determined'}

Create a compelling film concept that includes:

1. **One-Liner**: A single compelling sentence that captures the essence
2. **Logline**: A 2-3 sentence summary (protagonist + desire + obstacle)
3. **Short Synopsis**: A 200-word overview of the story
4. **Hook Moment**: Describe the first 3-5 minutes that grab the audience
5. **Moral Question**: What moral dilemma does your story explore?
6. **Theme Conflict**: Identify the primary theme conflict (e.g., Love vs. Duty)

Originality Score: Rate the concept's originality (0-1)
Philosophy Depth: Rate the philosophical depth (0-1)

Format your response as a JSON object with these exact keys:
{
  "one_liner": "...",
  "logline": "...",
  "short_synopsis": "...",
  "hook_moment": "...",
  "moral_question": "...",
  "theme_conflict": {"primary_theme": "...", "opposing_force": "..."},
  "originality_score": 0.8,
  "philosophy_depth": 0.7
}`;
}

export function parseConceptResponse(response: string): Record<string, unknown> {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse concept response:', error);
    return {
      one_liner: 'Unable to generate',
      logline: response.substring(0, 100),
      error: 'Response parsing failed',
    };
  }
}
