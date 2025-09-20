'use server';

import { detectEmergency } from '@/ai/flows/emergency-detection';
import { multilingualHealthQA } from '@/ai/flows/multilingual-health-qa';

export type FormState = {
  status: 'idle' | 'success' | 'error' | 'emergency';
  message?: string;
  data?: {
    userInput: string;
    emergencyType?: string;
    location?: string;
  };
};

export async function submitUserMessage(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const userInput = formData.get('message') as string;
  const language = formData.get('language') as string;
  const location = formData.get('location') as string | undefined;

  if (!userInput) {
    return { status: 'idle' };
  }

  // 1. Check for emergency
  try {
    const emergencyResult = await detectEmergency({ symptoms: userInput, language, location });
    if (emergencyResult.isEmergency && emergencyResult.confidenceLevel > 0.6) {
      // Confidence threshold
      return {
        status: 'emergency',
        message: emergencyResult.reason,
        data: {
          userInput,
          emergencyType: emergencyResult.emergencyType || 'unspecified',
          location: location
        },
      };
    }
  } catch (e) {
    console.error('Emergency detection failed:', e);
    // Log error but proceed to QA as a fallback
  }

  // 2. If not an emergency, perform Q&A
  try {
    const qaResult = await multilingualHealthQA({
      question: userInput,
      language,
    });
    return {
      status: 'success',
      message: qaResult.answer,
      data: {
        userInput,
      },
    };
  } catch (e) {
    console.error('Q&A failed:', e);
    return {
      status: 'error',
      message: 'Sorry, I could not process your request. Please try again.',
      data: {
        userInput,
      },
    };
  }
}
