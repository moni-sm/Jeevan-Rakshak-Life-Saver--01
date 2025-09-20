'use server';

import { detectEmergency, EmergencyDetectionOutput } from '@/ai/flows/emergency-detection';
import { multilingualHealthQA } from '@/ai/flows/multilingual-health-qa';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: Date;
};

export type FormState = {
  status: 'idle' | 'success' | 'error' | 'emergency';
  message?: string;
  messages?: Message[];
  data?: {
    userInput: string;
    emergencyType?: string;
    location?: string;
    firstAid?: string;
    hospitals?: EmergencyDetectionOutput['hospitals']
  };
};

export async function submitUserMessage(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const userInput = formData.get('message') as string;
  const language = formData.get('language') as string;
  const location = formData.get('location') as string | undefined;
  const userId = formData.get('userId') as string | null;

  if (!userInput) {
    return { status: 'idle' };
  }

  const userMessage: Message = {
    id: crypto.randomUUID(),
    role: 'user',
    text: userInput,
    createdAt: new Date(),
  };

  // 1. Check for emergency
  try {
    const emergencyResult = await detectEmergency({ symptoms: userInput, language, location });
    if (emergencyResult.isEmergency && emergencyResult.confidenceLevel > 0.6) {
      return {
        status: 'emergency',
        message: emergencyResult.reason,
        messages: [userMessage],
        data: {
          userInput,
          emergencyType: emergencyResult.emergencyType || 'unspecified',
          location: location,
          firstAid: emergencyResult.firstAid,
          hospitals: emergencyResult.hospitals,
        },
      };
    }
  } catch (e) {
    console.error('Emergency detection failed:', e);
  }

  // 2. If not an emergency, perform Q&A
  try {
    const qaResult = await multilingualHealthQA({
      question: userInput,
      language,
    });

    const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: qaResult.answer,
        createdAt: new Date(),
    };
    
    // Save to Firestore if user is logged in
    if (userId) {
        try {
            const chatHistoryRef = collection(db, 'users', userId, 'chats');
            await addDoc(chatHistoryRef, {
                messages: [
                    { role: 'user', text: userInput, createdAt: serverTimestamp() },
                    { role: 'assistant', text: qaResult.answer, createdAt: serverTimestamp() }
                ],
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Failed to save chat history:", error);
            // Don't block the user response for this
        }
    }


    return {
      status: 'success',
      message: qaResult.answer,
      messages: [userMessage, assistantMessage],
      data: {
        userInput,
      },
    };
  } catch (e) {
    console.error('Q&A failed:', e);
    const errorMessage : Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Sorry, I could not process your request. Please try again.',
        createdAt: new Date(),
    }
    return {
      status: 'error',
      message: errorMessage.text,
      messages: [userMessage, errorMessage],
      data: {
        userInput,
      },
    };
  }
}

export async function dispatchAmbulance(hospital: any, location: Geolocation, userId: string | null) {
    if (!hospital || !location) {
        return { success: false, error: 'Missing hospital or location data.' };
    }

    try {
        await addDoc(collection(db, 'emergency_dispatches'), {
            hospitalId: hospital.name, // In a real app, this would be an ID
            hospitalName: hospital.name,
            hospitalAddress: hospital.address,
            userLocation: location,
            userId: userId || 'anonymous',
            status: 'pending',
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to dispatch ambulance:", error);
        return { success: false, error: 'Server error, could not dispatch ambulance.' };
    }
}
