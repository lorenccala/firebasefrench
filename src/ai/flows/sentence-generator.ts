'use server';

/**
 * @fileOverview AI-powered sentence generator for personalized practice
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSentenceInputSchema = z.object({
  verb: z.string().describe('The French verb to create sentences with'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Difficulty level'),
  count: z.number().min(1).max(5).describe('Number of sentences to generate'),
  tense: z.string().optional().describe('Specific tense to focus on (e.g., présent, passé composé)'),
});

export type GenerateSentenceInput = z.infer<typeof GenerateSentenceInputSchema>;

const GenerateSentenceOutputSchema = z.object({
  sentences: z.array(z.object({
    french: z.string().describe('French sentence'),
    english: z.string().describe('English translation'),
    explanation: z.string().describe('Brief grammar explanation'),
    difficulty: z.string().describe('Difficulty level explanation'),
  })),
});

export type GenerateSentenceOutput = z.infer<typeof GenerateSentenceOutputSchema>;

export async function generateSentences(input: GenerateSentenceInput): Promise<GenerateSentenceOutput> {
  return generateSentencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSentencesPrompt',
  model: 'googleai/gemini-1.5-flash', // Using free tier
  input: {schema: GenerateSentenceInputSchema},
  output: {schema: GenerateSentenceOutputSchema},
  prompt: `You are a French language teacher creating practice sentences.

Generate {{count}} French sentences using the verb "{{verb}}" at {{difficulty}} level.
{{#if tense}}Focus on the {{tense}} tense.{{/if}}

Requirements:
- Each sentence should be practical and useful for language learners
- Include accurate English translations
- Provide brief grammar explanations
- Make sentences progressively challenging within the difficulty level
- Use common, everyday vocabulary
- Ensure proper French grammar and conjugation

Difficulty guidelines:
- Beginner: Simple present tense, basic vocabulary, short sentences
- Intermediate: Multiple tenses, compound sentences, varied vocabulary
- Advanced: Complex grammar, subjunctive/conditional, idiomatic expressions

Respond with a JSON object containing an array of sentences.`,
});

const generateSentencesFlow = ai.defineFlow(
  {
    name: 'generateSentencesFlow',
    inputSchema: GenerateSentenceInputSchema,
    outputSchema: GenerateSentenceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
); 