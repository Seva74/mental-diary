import { Analysis, Entry } from '../types';
import { createFallbackProvider, createHuggingFaceProvider, createOpenAiProvider, AiProviderClient } from './aiProviders';

export interface AiAdapter {
  provider: string;
  createAdvice(analysis: Analysis, entries: Entry[]): Promise<string>;
}

export const createAiAdapter = (): AiAdapter => {
  const provider = (process.env.AI_PROVIDER || 'fallback').toLowerCase();

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return createOpenAiProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || 'gpt-4o-mini');
  }

  if (provider === 'huggingface' && process.env.HF_TOKEN) {
    return createHuggingFaceProvider(process.env.HF_TOKEN, process.env.HF_MODEL || 'microsoft/Phi-3-mini-4k-instruct');
  }

  return createFallbackProvider();
};