import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

// Alternative free AI configurations
export const AI_PROVIDERS = {
  GOOGLE_GEMINI: 'googleai/gemini-2.0-flash',
  GOOGLE_GEMINI_PRO: 'googleai/gemini-1.5-pro',
  GOOGLE_GEMINI_FLASH: 'googleai/gemini-1.5-flash',
} as const;

// AI service configuration
export const AI_CONFIG = {
  // Google AI is free with generous limits
  PRIMARY_MODEL: AI_PROVIDERS.GOOGLE_GEMINI,
  FALLBACK_MODEL: AI_PROVIDERS.GOOGLE_GEMINI_FLASH,
  
  // Rate limiting to stay within free tiers
  MAX_REQUESTS_PER_MINUTE: 15,
  MAX_TOKENS_PER_REQUEST: 2048,
} as const;

// Enhanced AI client with error handling
export const createAIClient = () => {
  try {
    return genkit({
      plugins: [googleAI()],
      model: AI_CONFIG.PRIMARY_MODEL,
    });
  } catch (error) {
    console.error('Failed to initialize AI client:', error);
    throw new Error('AI service unavailable');
  }
};
