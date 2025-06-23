'use server';

/**
 * @fileOverview AI-powered conversation partner for French practice
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConversationInputSchema = z.object({
  userMessage: z.string().describe('User message in French or English'),
  conversationHistory: z.array(z.object({
    speaker: z.enum(['user', 'ai']),
    message: z.string(),
    language: z.enum(['french', 'english']),
  })).describe('Previous conversation messages'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('User difficulty level'),
  topic: z.string().optional().describe('Conversation topic (e.g., restaurant, travel, hobbies)'),
});

export type ConversationInput = z.infer<typeof ConversationInputSchema>;

const ConversationOutputSchema = z.object({
  response: z.string().describe('AI response in French'),
  englishTranslation: z.string().describe('English translation of the response'),
  corrections: z.array(z.object({
    original: z.string().describe('Incorrect text from user'),
    corrected: z.string().describe('Corrected version'),
    explanation: z.string().describe('Grammar explanation'),
  })).describe('Corrections for user errors'),
  vocabulary: z.array(z.object({
    french: z.string().describe('French word/phrase'),
    english: z.string().describe('English translation'),
    usage: z.string().describe('Usage example'),
  })).describe('New vocabulary introduced'),
  encouragement: z.string().describe('Encouraging feedback for the user'),
});

export type ConversationOutput = z.infer<typeof ConversationOutputSchema>;

export async function chatWithAI(input: ConversationInput): Promise<ConversationOutput> {
  return conversationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conversationPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: ConversationInputSchema},
  output: {schema: ConversationOutputSchema},
  prompt: `You are Marie, a friendly French conversation partner helping someone learn French.

Conversation Context:
- User Level: {{difficulty}}
- Topic: {{#if topic}}{{topic}}{{else}}general conversation{{/if}}
- User said: "{{userMessage}}"

Previous conversation:
{{#each conversationHistory}}
{{speaker}}: {{message}} ({{language}})
{{/each}}

Your role:
1. Respond naturally in French appropriate for {{difficulty}} level
2. Gently correct any French errors the user made
3. Introduce 1-2 new vocabulary words naturally
4. Ask a follow-up question to continue the conversation
5. Be encouraging and supportive

Response guidelines:
- {{difficulty}} level: {{#if (eq difficulty "beginner")}}Use simple present tense, basic vocabulary, short sentences{{/if}}{{#if (eq difficulty "intermediate")}}Use varied tenses, moderate vocabulary, longer sentences{{/if}}{{#if (eq difficulty "advanced")}}Use complex grammar, advanced vocabulary, natural expressions{{/if}}
- Keep responses conversational and engaging
- Provide helpful corrections without being overwhelming
- Include cultural context when relevant

Respond as a helpful French conversation partner would.`,
});

const conversationFlow = ai.defineFlow(
  {
    name: 'conversationFlow',
    inputSchema: ConversationInputSchema,
    outputSchema: ConversationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
); 