"use client";

import { FC, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Laptop, Smartphone, X } from 'lucide-react';

interface SessionInfo {
  id: string;
  lastActive: string;
  device: string;
  browser: string;
  isCurrent: boolean;
}

export const SessionManagement: FC = () => {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/auth/sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      fetchSessions();
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 flex justify-center">
          <LoadingSpinner size={32} />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Active Sessions</h2>
        <div className="space-y-4">
          {sessions.map((sessionInfo) => (
            <div
              key={sessionInfo.id}
              className="flex items-center justify-between p-4 bg-background-dark rounded-lg"
            >
              <div className="flex items-center gap-4">
                {sessionInfo.device.includes('Mobile') ? (
                  <Smartphone className="text-text-secondary" />
                ) : (
                  <Laptop className="text-text-secondary" />
                )}
                <div>
                  <p className="text-text-primary">
                    {sessionInfo.browser} on {sessionInfo.device}
                    {sessionInfo.isCurrent && (
                      <span className="ml-2 text-xs text-accent-green">(Current)</span>
                    )}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Last active: {new Date(sessionInfo.lastActive).toLocaleString()}
                  </p>
                </div>
              </div>
              {!sessionInfo.isCurrent && (
                <button
                  onClick={() => handleRevokeSession(sessionInfo.id)}
                  className="p-2 text-text-secondary hover:text-red-500 rounded-lg hover:bg-red-500/10"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}; 