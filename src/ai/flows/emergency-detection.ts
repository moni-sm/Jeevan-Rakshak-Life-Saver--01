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
import { findNearbyHospitals } from '../tools/find-nearby-hospitals';

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
  firstAid: z
    .string()
    .optional()
    .describe('Immediate first aid or temporary relief advice for the user while waiting for medical help. This advice should be safe and easy to follow for a layperson. This should be in the same language as the input.'),
  hospitals: z.array(z.object({
    name: z.string(),
    address: z.string(),
    phone: z.string(),
    distance: z.string(),
  })).optional().describe('A list of nearby hospitals.'),
});
export type EmergencyDetectionOutput = z.infer<typeof EmergencyDetectionOutputSchema>;

export async function detectEmergency(input: EmergencyDetectionInput): Promise<EmergencyDetectionOutput> {
  return detectEmergencyFlow(input);
}

const detectEmergencyPrompt = ai.definePrompt({
  name: 'detectEmergencyPrompt',
  input: {schema: EmergencyDetectionInputSchema},
  output: {schema: EmergencyDetectionOutputSchema},
  tools: [findNearbyHospitals],
  prompt: `You are an expert medical assistant specializing in emergency detection. Given the following symptoms, determine if it is an emergency or not. If it is, provide the type of emergency. Also, provide a confidence level between 0 and 1.

If it is an emergency, provide simple, safe, and effective first aid advice that a person can perform while waiting for a doctor. The advice should be in the same language as the user's query.

If a location is provided, use the findNearbyHospitals tool to find hospitals near the user.

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
