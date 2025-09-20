'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Bot,
  LoaderCircle,
  Mic,
  MicOff,
  Send,
} from 'lucide-react';
import { submitUserMessage, type FormState, type Message } from '@/app/actions';
import { AppHeader } from '@/components/app-header';
import { AssistantMessage, UserMessage } from '@/components/chat-bubbles';
import { EmergencyDialog, Geolocation } from '@/components/emergency-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { EmergencyDetectionOutput } from '@/ai/flows/emergency-detection';

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
  { value: 'te', label: 'తెలుగు (Telugu)' },
  { value: 'mr', label: 'मराठी (Marathi)' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'ur', label: 'اردو (Urdu)' },
  { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { value: 'ml', label: 'മലയാളം (Malayalam)' },
  { value: 'as', label: 'অসমীয়া (Assamese)' },
  { value: 'bho', label: 'भोजपुरी (Bhojpuri)' },
  { value: 'gom', label: 'कोंकणी (Konkani)' },
  { value: 'doi', label: 'डोगरी (Dogri)' },
  { value: 'ks', label: 'کٲشُر (Kashmiri)' },
  { value: 'mai', label: 'मैथिली (Maithili)' },
  { value: 'mni', label: 'ꯃꯤꯇꯩꯂꯣꯟ (Meitei)' },
  { value: 'ne', label: 'नेपाली (Nepali)' },
  { value: 'sa', label: 'संस्कृतम् (Sanskrit)' },
  { value: 'sat', label: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)' },
  { value: 'sd', label: 'सिन्धी (Sindhi)' },
];


type EmergencyInfo = {
  type: string;
  reason: string;
  userInput: string;
  firstAid?: string;
  hospitals?: EmergencyDetectionOutput['hospitals'];
}

export default function Home() {
  const { toast } = useToast();
  const [formState, formAction, isPending] = useActionState(submitUserMessage, initialState);
  const [messages, setMessages] = useState<Message[]>([]);
  const [language, setLanguage] = useState('en');
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [emergencyInfo, setEmergencyInfo] = useState<EmergencyInfo | null>(null);

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

  useEffect(() => {
    if (formState.status === 'idle') return;

    if (formState.status === 'success' || formState.status === 'error') {
      if (formState.messages) {
        setMessages(prev => [...prev, ...formState.messages!]);
      }
      if(formRef.current) formRef.current.reset();
    } else if (formState.status === 'emergency' && formState.data?.emergencyType) {
        const isLocationUpdate = formState.data.location && emergencyInfo;
        const currentEmergencyInfo = isLocationUpdate ? emergencyInfo : {
          type: formState.data.emergencyType,
          reason: formState.message!,
          userInput: formState.data.userInput,
        };

        const updatedEmergencyInfo: EmergencyInfo = {
          ...currentEmergencyInfo,
          firstAid: formState.data.firstAid || currentEmergencyInfo.firstAid,
          hospitals: formState.data.hospitals || (isLocationUpdate ? emergencyInfo.hospitals : undefined),
        };
        
        setEmergencyInfo(updatedEmergencyInfo);
      
        if (!isLocationUpdate && formState.messages) {
            setMessages((prev) => [...prev, ...formState.messages!]);
        }
    } else if (formState.status === 'error') {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: formState.message,
      });
    }

    if(formState.status !== 'emergency') {
      if(formRef.current) formRef.current.reset();
    }
  }, [formState, toast, emergencyInfo]);

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
          hospitals={emergencyInfo.hospitals}
          onLocationFound={handleLocationFound}
          onClose={() => {
            setEmergencyInfo(null);
            formRef.current?.reset();
          }}
        />
      )}
    </div>
  );
}
