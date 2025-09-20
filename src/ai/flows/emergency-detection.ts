'use server';

/**
 * @fileOverview This file contains the Genkit flow for emergency detection based on user-reported symptoms.
 *
 * It includes:
 * - `detectEmergency`: A function to analyze symptoms and detect potential emergencies.
 * - `EmergencyDetectionInput`: The input type for the `detectEmergency` function.
 * - `EmergencyDetectionOutput`: The output type for the `detectEmergency` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmergencyDetectionInputSchema = z.object({
  symptoms: z
    .string()
    .describe(
      'A description of the symptoms the user is experiencing, including location of pain, intensity, and any other relevant information.'
    ),
  language: z
    .string()
    .optional()
    .describe('The language the symptoms are described in.'),
  location: z
    .string()
    .optional()
    .describe(
      'The current location of the user, to provide more accurate diagnosis.'
    ),
});
export type EmergencyDetectionInput = z.infer<typeof EmergencyDetectionInputSchema>;

const EmergencyDetectionOutputSchema = z.object({
  isEmergency: z
    .boolean()
    .describe(
      'Whether or not the described symptoms indicate a medical emergency.'
    ),
  emergencyType: z
    .string()
    .optional()
    .describe(
      'If it is an emergency, the type of emergency detected (e.g., heart attack, stroke, snake bite).'
    ),
  reason: z
    .string()
    .describe(
      'A brief explanation of why the symptoms are considered an emergency, or why not if isEmergency is false.'
    ),
  confidenceLevel: z
    .number()
    .describe(
      'A numerical value between 0 and 1 indicating the confidence level of the emergency detection. Higher values indicate greater confidence.'
    ),
});
export type EmergencyDetectionOutput = z.infer<typeof EmergencyDetectionOutputSchema>;

export async function detectEmergency(input: EmergencyDetectionInput): Promise<EmergencyDetectionOutput> {
  return detectEmergencyFlow(input);
}

const detectEmergencyPrompt = ai.definePrompt({
  name: 'detectEmergencyPrompt',
  input: {schema: EmergencyDetectionInputSchema},
  output: {schema: EmergencyDetectionOutputSchema},
  prompt: `You are an expert medical assistant specializing in emergency detection.  Given the following symptoms, determine if it is an emergency or not.  If it is, provide the type of emergency. Also, provide a confidence level between 0 and 1.

Symptoms: {{{symptoms}}}
Language: {{{language}}}
Location: {{{location}}}

Respond in JSON format.
`,
});

const detectEmergencyFlow = ai.defineFlow(
  {
    name: 'detectEmergencyFlow',
    inputSchema: EmergencyDetectionInputSchema,
    outputSchema: EmergencyDetectionOutputSchema,
  },
  async input => {
    const {output} = await detectEmergencyPrompt(input);
    return output!;
  }
);
