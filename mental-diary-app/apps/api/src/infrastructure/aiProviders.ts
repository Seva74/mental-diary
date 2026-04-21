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
              content: 'Вы — внимательный помощник по психологическому самонаблюдению. Обращайтесь к пользователю по-русски. Не возвращайте и не цитируйте входные данные (записи/метрики). Не приводите список параметров или строки записей — дайте только короткий, практический, поддерживающий и недиагностический совет, адресованный пользователю. Сформулируйте одно конкретное действие, которое можно выполнить сейчас или в ближайшие 24 часа. Если в тексте есть фразы о причинении себе вреда, мягко предложите обратиться к специалисту или доверенному человеку и укажите контакты экстренной помощи при немедленной опасности.'
            },
            {
              role: 'user',
              content: buildAdvicePrompt(analysis, entries)
            }
          ],
          temperature: 0.4,
          max_tokens: 150
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

export const createOpenRouterProvider = (apiKey: string, model: string): AiProviderClient => ({
  provider: `openrouter:${model}`,
  async createAdvice(analysis: Analysis, entries: Entry[]): Promise<string> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
              content: 'Вы — внимательный помощник по психологическому самонаблюдению. Обращайтесь к пользователю по-русски. Не возвращайте и не цитируйте входные данные (записи/метрики). Не приводите список параметров или строки записей — дайте только короткий, практический, поддерживающий и недиагностический совет, адресованный пользователю. Сформулируйте одно конкретное действие, которое можно выполнить сейчас или в ближайшие 24 часа. Если в тексте есть фразы о причинении себе вреда, мягко предложите обратиться к специалисту или доверенному человеку и укажите контакты экстренной помощи при немедленной опасности.'
            },
            {
              role: 'user',
              content: buildAdvicePrompt(analysis, entries)
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter request failed with status ${response.status}`);
      }

      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      return payload.choices?.[0]?.message?.content?.trim() || fallbackRecommendation(analysis);
    } catch (err) {
      console.error('[AI Provider Error] OpenRouter failed:', err);
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