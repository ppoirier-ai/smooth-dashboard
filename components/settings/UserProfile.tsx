"use client";

import { FC, useState } from 'react';
import { useSession } from 'next-auth/react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';

export const UserProfile: FC = () => {
  const { data: session, status } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Profile Settings</h2>
        
        <div className="flex items-start gap-6">
          <div className="relative group">
            <img
              src={session.user.image || undefined}
              alt={session.user.name || 'Profile'}
              className="w-24 h-24 rounded-full"
            />
          </div>

          <div className="flex-1">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Name
                </label>
                <p className="text-text-primary">{session.user.name}</p>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Email
                </label>
                <p className="text-text-primary">{session.user.email}</p>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Account Type
                </label>
                <p className="text-text-primary">Google Account</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}; 