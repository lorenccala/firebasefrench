'use server';

/**
 * @fileOverview AI-powered progress analysis and learning recommendations
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProgressAnalysisInputSchema = z.object({
  correctAnswers: z.number().describe('Number of correct answers'),
  totalAttempts: z.number().describe('Total number of attempts'),
  strugglingVerbs: z.array(z.string()).describe('Verbs the user is struggling with'),
  strongVerbs: z.array(z.string()).describe('Verbs the user performs well with'),
  studyTimeMinutes: z.number().describe('Total study time in minutes'),
  preferredDifficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Current difficulty level'),
});

export type ProgressAnalysisInput = z.infer<typeof ProgressAnalysisInputSchema>;

const ProgressAnalysisOutputSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('Overall performance score'),
  strengths: z.array(z.string()).describe('Areas where user performs well'),
  weaknesses: z.array(z.string()).describe('Areas needing improvement'),
  recommendations: z.array(z.object({
    type: z.enum(['study_focus', 'practice_method', 'difficulty_adjustment', 'time_management']),
    title: z.string().describe('Recommendation title'),
    description: z.string().describe('Detailed recommendation'),
    priority: z.enum(['high', 'medium', 'low']).describe('Priority level'),
  })),
  nextSessionFocus: z.string().describe('What to focus on in the next study session'),
  motivationalMessage: z.string().describe('Encouraging message for the learner'),
});

export type ProgressAnalysisOutput = z.infer<typeof ProgressAnalysisOutputSchema>;

export async function analyzeProgress(input: ProgressAnalysisInput): Promise<ProgressAnalysisOutput> {
  return progressAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'progressAnalysisPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: ProgressAnalysisInputSchema},
  output: {schema: ProgressAnalysisOutputSchema},
  prompt: `You are an AI language learning coach analyzing a student's French learning progress.

Student Performance Data:
- Accuracy: {{correctAnswers}}/{{totalAttempts}} ({{#math}}(correctAnswers/totalAttempts*100){{/math}}%)
- Study Time: {{studyTimeMinutes}} minutes
- Difficulty Level: {{preferredDifficulty}}
- Struggling with: {{#each strugglingVerbs}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- Strong with: {{#each strongVerbs}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

Provide a comprehensive analysis including:
1. Overall performance score (0-100)
2. Specific strengths and weaknesses
3. Actionable recommendations prioritized by importance
4. Focus area for next session
5. Motivational message

Be encouraging but honest. Focus on practical, achievable improvements.
Consider learning psychology and spaced repetition principles.`,
});

const progressAnalysisFlow = ai.defineFlow(
  {
    name: 'progressAnalysisFlow',
    inputSchema: ProgressAnalysisInputSchema,
    outputSchema: ProgressAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
); 