import { Analysis, Entry } from '../types';
import { buildAdvicePrompt, fallbackRecommendation } from '../domain/recommendations';

export interface AiAdapter {
  provider: string;
  createAdvice(analysis: Analysis, entries: Entry[]): Promise<string>;
}

const buildOpenAiAdapter = (apiKey: string, model: string): AiAdapter => ({
  provider: `openai:${model}`,
  async createAdvice(analysis: Analysis, entries: Entry[]): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a supportive mental well-being assistant. Keep the answer short, practical, and non-diagnostic.'
            },
            {
              role: 'user',
              content: buildAdvicePrompt(analysis, entries)
            }
          ],
          temperature: 0.4,
          max_tokens: 120
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed with status ${response.status}`);
      }

      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };

      return payload.choices?.[0]?.message?.content?.trim() || fallbackRecommendation(analysis);
    } catch {
      return fallbackRecommendation(analysis);
    }
  }
});

const buildHuggingFaceAdapter = (token: string, model: string): AiAdapter => ({
  provider: `huggingface:${model}`,
  async createAdvice(analysis: Analysis, entries: Entry[]): Promise<string> {
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `${buildAdvicePrompt(analysis, entries)}\n\nGive one short supportive recommendation.`
        })
      });

      if (!response.ok) {
        throw new Error(`Hugging Face request failed with status ${response.status}`);
      }

      const payload = await response.json() as Array<{ generated_text?: string }>;
      return payload[0]?.generated_text?.trim() || fallbackRecommendation(analysis);
    } catch {
      return fallbackRecommendation(analysis);
    }
  }
});

export const createAiAdapter = (): AiAdapter => {
  const provider = (process.env.AI_PROVIDER || 'fallback').toLowerCase();

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return buildOpenAiAdapter(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || 'gpt-4o-mini');
  }

  if (provider === 'huggingface' && process.env.HF_TOKEN) {
    return buildHuggingFaceAdapter(process.env.HF_TOKEN, process.env.HF_MODEL || 'microsoft/Phi-3-mini-4k-instruct');
  }

  return {
    provider: 'fallback',
    async createAdvice(analysis: Analysis): Promise<string> {
      return fallbackRecommendation(analysis);
    }
  };
};