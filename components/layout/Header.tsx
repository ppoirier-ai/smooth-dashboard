"use client";

import { FC } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { ChevronDown, LogIn, Key } from 'lucide-react';

const Header: FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Show loading state or nothing while checking auth status
  if (status === 'loading') {
    return <header className="h-16 bg-card-background border-b border-border" />;
  }

  return (
    <header className="h-16 bg-card-background border-b border-border px-6 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center">
        <Image
          src="/logo.svg"
          alt="Smooth Logo"
          width={120}
          height={32}
          priority
        />
      </Link>

      {!session ? (
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-2 text-text-secondary hover:text-accent-green px-4 py-2 rounded-lg"
        >
          <LogIn className="h-5 w-5" />
          <span>Connect Wallet</span>
        </button>
      ) : (
        <div className="relative group">
          <button className="flex items-center gap-2 text-text-secondary hover:text-accent-green px-4 py-2 rounded-lg">
            <span>{session.user?.id?.slice(0, 5) + '...'}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          
          <div className="absolute right-0 mt-2 w-48 py-2 bg-card-background rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <Link
              href="/api-keys"
              className="flex items-center gap-2 w-full px-4 py-2 text-left text-text-secondary hover:text-accent-green hover:bg-background-dark"
            >
              <Key className="h-4 w-4" />
              <span>Add New API Keys</span>
            </Link>
            <div className="h-px bg-border my-2" />
            <LogoutButton className="w-full px-4 py-2 text-left hover:bg-background-dark" />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 