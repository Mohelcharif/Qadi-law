'use client';

import { signOut, useSession } from 'next-auth/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import { LogOut, FileText } from 'lucide-react';
import Link from 'next/link';

export function NavHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/filings" className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Coddy Law</span>
        </Link>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6 ml-6">
            <Link
              href="/filings"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Filings
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {session?.user && (
              <>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(session.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{session.user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {session.user.role}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
