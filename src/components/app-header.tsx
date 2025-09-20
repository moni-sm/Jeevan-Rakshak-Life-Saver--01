'use client';

import { Languages, Siren } from 'lucide-react';
import { Logo } from '@/components/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from './ui/button';

type AppHeaderProps = {
  language: string;
  onLanguageChange: (lang: string) => void;
  languages: { value: string; label: string }[];
  onReportEmergency: () => void;
};

export function AppHeader({
  language,
  onLanguageChange,
  languages,
  onReportEmergency,
}: AppHeaderProps) {

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-3">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-primary">
          Gaon Swasthya Sahayak
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="destructive" onClick={onReportEmergency}>
          <Siren className="mr-2 h-4 w-4" /> Report Emergency
        </Button>
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-muted-foreground" />
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
