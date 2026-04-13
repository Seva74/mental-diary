import { Analysis, Entry } from '../types';
import { buildAdvicePrompt, fallbackRecommendation } from '../domain/recommendations';

export interface AiProviderClient {
  provider: string;
  createAdvice(analysis: Analysis, entries: Entry[]): Promise<string>;
}

export const createOpenAiProvider = (apiKey: string, model: string): AiProviderClient => ({
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

export const createHuggingFaceProvider = (token: string, model: string): AiProviderClient => ({
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

export const createFallbackProvider = (): AiProviderClient => ({
  provider: 'fallback',
  async createAdvice(analysis: Analysis): Promise<string> {
    return fallbackRecommendation(analysis);
  }
});