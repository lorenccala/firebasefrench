
'use server';

/**
 * @fileOverview An AI-powered grammar explainer for language learners.
 *
 * - explainGrammar - A function that handles the grammar explanation process.
 * - ExplainGrammarInput - The input type for the explainGrammar function.
 * - ExplainGrammarOutput - The return type for the explainGrammar function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainGrammarInputSchema = z.object({
  sentence: z.string().describe('The sentence to be explained.'),
});
export type ExplainGrammarInput = z.infer<typeof ExplainGrammarInputSchema>;

const ExplainGrammarOutputSchema = z.object({
  explanation: z.string().describe('The grammatical explanation of the sentence.'),
});
export type ExplainGrammarOutput = z.infer<typeof ExplainGrammarOutputSchema>;

export async function explainGrammar(input: ExplainGrammarInput): Promise<ExplainGrammarOutput> {
  return explainGrammarFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainGrammarPrompt',
  model: 'googleai/gemma-7b-it', // Specify Gemma model here
  input: {schema: ExplainGrammarInputSchema},
  output: {schema: ExplainGrammarOutputSchema},
  prompt: `You are a helpful AI assistant specialized in explaining grammatical concepts.
  A user will provide you with a sentence, and you will respond with a clear and concise grammatical explanation of the sentence, so that a language learner can understand it better.

  Sentence: {{{sentence}}}`,
});

const explainGrammarFlow = ai.defineFlow(
  {
    name: 'explainGrammarFlow',
    inputSchema: ExplainGrammarInputSchema,
    outputSchema: ExplainGrammarOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
