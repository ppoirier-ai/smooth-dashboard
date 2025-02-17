'use client';

import { FC } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  className?: string;
  showIcon?: boolean;
}

export const LogoutButton: FC<LogoutButtonProps> = ({ 
  className,
  showIcon = true
}) => {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center gap-2 hover:text-accent-green transition-colors ${className}`}
    >
      {showIcon && <LogOut className="h-5 w-5" />}
      <span>Logout</span>
    </button>
  );
}; 