import { Bot, User } from 'lucide-react';
import type { ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function UserMessage({
  children,
  user,
}: {
  children: ReactNode;
  user: FirebaseUser | null;
}) {
  return (
    <div className="flex items-start justify-end gap-3">
      <Card className="max-w-[85%] bg-primary text-primary-foreground">
        <CardContent className="p-3 text-base">{children}</CardContent>
      </Card>
      <Avatar className="h-9 w-9 border">
        <AvatarImage
          src={user?.photoURL ?? undefined}
          alt={user?.displayName ?? 'User'}
        />
        <AvatarFallback className="bg-transparent text-primary">
          <User />
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

export function AssistantMessage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-9 w-9 border">
        <AvatarFallback className="bg-transparent text-primary">
          <Bot />
        </AvatarFallback>
      </Avatar>
      <Card className={cn('max-w-[85%] bg-card', className)}>
        <CardContent className="p-3 text-base">{children}</CardContent>
      </Card>
    </div>
  );
}
