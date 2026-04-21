import { Analysis, Entry } from '../types';
import { createFallbackProvider, createOpenRouterProvider, createOpenAiProvider, AiProviderClient } from './aiProviders';

export interface AiAdapter {
  provider: string;
  createAdvice(analysis: Analysis, entries: Entry[]): Promise<string>;
}

export const createAiAdapter = (): AiAdapter => {
  const provider = (process.env.AI_PROVIDER || 'fallback').toLowerCase();

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return createOpenAiProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || 'gpt-4o-mini');
  }

  if (provider === 'openrouter' && process.env.OPENROUTER_API_KEY) {
    return createOpenRouterProvider(process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_MODEL || 'openrouter/free');
  }

  return createFallbackProvider();
};