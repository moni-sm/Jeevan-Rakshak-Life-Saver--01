'use client';

import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { LogIn, LogOut, LoaderCircle } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function AuthButton() {
  const { user, loading } = useAuth();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  if (loading) {
    return <LoaderCircle className="animate-spin" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
            <AvatarFallback>{user.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
        </Avatar>
        <Button onClick={handleSignOut} variant="ghost" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleSignIn} variant="outline">
      <LogIn className="mr-2 h-4 w-4" />
      Sign In
    </Button>
  );
}
