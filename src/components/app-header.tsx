'use client';

import { Languages, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';
import { Logo } from '@/components/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

type AppHeaderProps = {
  language: string;
  onLanguageChange: (lang: string) => void;
  languages: { value: string; label: string }[];
  user: User | null;
  onSignIn: () => void;
};

export function AppHeader({
  language,
  onLanguageChange,
  languages,
  user,
  onSignIn,
}: AppHeaderProps) {
  const handleSignOut = async () => {
    await auth.signOut();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-3">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-primary">
          Gaon Swasthya Sahayak
        </h1>
      </div>
      <div className="flex items-center gap-4">
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

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.photoURL ?? undefined}
                    alt={user.displayName ?? 'User'}
                  />
                  <AvatarFallback>
                    {user.phoneNumber?.slice(0, 2) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.displayName || 'Anonymous User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.phoneNumber}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={onSignIn} variant="outline">Sign In</Button>
        )}
      </div>
    </header>
  );
}
