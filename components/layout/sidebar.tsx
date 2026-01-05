'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileText, Users, Settings as SettingsIcon, UsersRound } from 'lucide-react';

const navigation = [
  { name: 'Filings', href: '/filings', icon: FileText },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Team', href: '/team', icon: UsersRound },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500 text-gray-900 font-bold text-lg">
          Q
        </div>
        <div>
          <div className="font-semibold">Qadi Law</div>
          <div className="text-xs text-gray-400">DFSA Workspace</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xs font-medium">
            AH
          </div>
          <div className="flex-1 text-sm">
            <div className="font-medium">Ahmed Hassan</div>
            <div className="text-xs text-gray-400">Client</div>
          </div>
        </div>
      </div>
    </div>
  );
}
