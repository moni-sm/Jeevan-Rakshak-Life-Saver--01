'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import {
  Bot,
  LoaderCircle,
  Mic,
  MicOff,
  Send,
  User,
} from 'lucide-react';
import { submitUserMessage, type FormState } from '@/app/actions';
import { AppHeader } from '@/components/app-header';
import { AssistantMessage, UserMessage } from '@/components/chat-bubbles';
import { EmergencyDialog, Geolocation } from '@/components/emergency-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const initialState: FormState = {
  status: 'idle',
};

const languages = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी (Hindi)' },
  { value: 'bn', label: 'বাংলা (Bengali)' },
];

export default function Home() {
  const { toast } = useToast();
  const [formState, formAction, isPending] = useActionState(submitUserMessage, initialState);
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; text: string; id: number }[]
  >([]);
  const [language, setLanguage] = useState('en');
  
  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Emergency flow state
  const [emergencyInfo, setEmergencyInfo] = useState<{
    type: string;
    reason: string;
    userInput: string;
    firstAid?: string;
  } | null>(null);

  // Setup SpeechRecognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (textareaRef.current) {
        textareaRef.current.value = finalTranscript + interimTranscript;
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [language]);

  // Process form state changes
  useEffect(() => {
    if (formState.status === 'idle' || formState.status === 'emergency' && formState.data?.location) return;

    if (formState.status === 'success' && formState.data?.userInput) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          text: formState.data.userInput,
          id: Date.now(),
        },
        {
          role: 'assistant',
          text: formState.message!,
          id: Date.now() + 1,
        },
      ]);
    } else if (formState.status === 'emergency' && formState.data?.emergencyType) {
      setEmergencyInfo({
        type: formState.data.emergencyType,
        reason: formState.message!,
        userInput: formState.data.userInput,
        firstAid: formState.data.firstAid,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          text: formState.data.userInput,
          id: Date.now(),
        },
      ]);
    } else if (formState.status === 'error') {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: formState.message,
      });
    }

    if(formState.status !== 'emergency') {
      formRef.current?.reset();
    }
  }, [formState, toast]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const handleLocationFound = (location: Geolocation) => {
    if (emergencyInfo) {
      const formData = new FormData();
      formData.append('message', emergencyInfo.userInput);
      formData.append('language', language);
      formData.append('location', `${location.latitude},${location.longitude}`);
      formAction(formData);
    }
  };
  
  const welcomeImage = PlaceHolderImages.find(p => p.id === 'rural-health-welcome');

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <AppHeader
        language={language}
        onLanguageChange={setLanguage}
        languages={languages}
      />

      <main
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
             <div className="flex flex-col items-center justify-center pt-10 text-center">
              {welcomeImage && <Image 
                src={welcomeImage.imageUrl}
                alt={welcomeImage.description}
                width={400}
                height={267}
                className="mb-6 rounded-lg shadow-md"
                data-ai-hint={welcomeImage.imageHint}
                priority
              />}
              <h1 className="text-3xl font-bold tracking-tight text-primary">
                Welcome to Gaon Swasthya Sahayak
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Your trusted health assistant.
              </p>
              <p className="mt-4 max-w-xl">
                Describe your symptoms or ask a health question in your language. I can help with general health queries and detect potential emergencies.
              </p>
            </div>
          ) : (
            messages.map((msg) =>
              msg.role === 'user' ? (
                <UserMessage key={msg.id}>{msg.text}</UserMessage>
              ) : (
                <AssistantMessage key={msg.id}>{msg.text}</AssistantMessage>
              )
            )
          )}
          {isPending && <AssistantMessage><LoaderCircle className="animate-spin" /></AssistantMessage>}
        </div>
      </main>

      <footer className="sticky bottom-0 border-t bg-background/80 p-2 backdrop-blur-sm md:p-4">
        <div className="mx-auto max-w-3xl">
          <form
            ref={formRef}
            action={formAction}
            className="relative"
          >
            <input type="hidden" name="language" value={language} />
            <Textarea
              ref={textareaRef}
              name="message"
              placeholder={`Ask a health question or describe symptoms in ${
                languages.find((l) => l.value === language)?.label || 'your language'
              }...`}
              className="min-h-[60px] resize-none pr-28"
              required
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleMicClick}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? (
                  <MicOff className="text-destructive" />
                ) : (
                  <Mic />
                )}
              </Button>
              <Button type="submit" size="icon" aria-label="Send message" disabled={isPending}>
                {isPending ? <LoaderCircle className="animate-spin" /> : <Send />}
              </Button>
            </div>
          </form>
        </div>
      </footer>

      {emergencyInfo && (
        <EmergencyDialog
          emergencyType={emergencyInfo.type}
          reason={emergencyInfo.reason}
          firstAid={emergencyInfo.firstAid}
          onLocationFound={handleLocationFound}
          onClose={() => setEmergencyInfo(null)}
        />
      )}
    </div>
  );
}
