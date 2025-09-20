// This is a server-side file.
'use server';

/**
 * @fileOverview A multilingual health Q&A AI agent.
 *
 * - multilingualHealthQA - A function that handles health-related questions in different languages.
 * - MultilingualHealthQAInput - The input type for the multilingualHealthQA function.
 * - MultilingualHealthQAOutput - The return type for the multilingualHealthQA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MultilingualHealthQAInputSchema = z.object({
  question: z.string().describe('The health-related question in the user\s local language.'),
  language: z.string().describe('The language of the question.'),
});
export type MultilingualHealthQAInput = z.infer<typeof MultilingualHealthQAInputSchema>;

const MultilingualHealthQAOutputSchema = z.object({
  answer: z.string().describe('The answer to the health-related question in the user\s local language.'),
});
export type MultilingualHealthQAOutput = z.infer<typeof MultilingualHealthQAOutputSchema>;

export async function multilingualHealthQA(input: MultilingualHealthQAInput): Promise<MultilingualHealthQAOutput> {
  return multilingualHealthQAFlow(input);
}

const prompt = ai.definePrompt({
  name: 'multilingualHealthQAPrompt',
  input: {schema: MultilingualHealthQAInputSchema},
  output: {schema: MultilingualHealthQAOutputSchema},
  prompt: `You are a helpful health assistant that answers health-related questions in the user's local language.

  Question: {{{question}}}
  Language: {{{language}}}

  Answer:`, // No need to HTML-escape or URL-escape characters in the code.
});

const multilingualHealthQAFlow = ai.defineFlow(
  {
    name: 'multilingualHealthQAFlow',
    inputSchema: MultilingualHealthQAInputSchema,
    outputSchema: MultilingualHealthQAOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
