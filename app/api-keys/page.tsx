"use client";

import { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ErrorCodes } from '@/lib/utils/errors';

interface ApiKey {
  id: string;
  label: string;
  createdAt: string;
  status?: 'testing' | 'valid' | 'invalid';
  viewToken: string;
}

interface ApiError {
  error: string;
  code: keyof typeof ErrorCodes;
}

const ApiKeysPage: FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyStatuses, setKeyStatuses] = useState<Record<string, ApiKey['status']>>({});
  const [formError, setFormError] = useState<ApiError | null>(null);

  const [formData, setFormData] = useState({
    label: '',
    apiKey: '',
    secretKey: '',
  });

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/binance-keys');
      if (!response.ok) throw new Error('Failed to fetch keys');
      const data = await response.json();
      setKeys(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch keys');
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormError(null);

    try {
      const response = await fetch('/api/binance-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add API key', { cause: data });
      }

      setFormData({ label: '', apiKey: '', secretKey: '' });
      setIsAddingKey(false);
      fetchKeys();
    } catch (err) {
      if (err instanceof Error && err.cause) {
        setFormError(err.cause as ApiError);
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const response = await fetch(`/api/binance-keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete API key');
      fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key');
    }
  };

  const testKey = async (id: string) => {
    setKeyStatuses(prev => ({ ...prev, [id]: 'testing' }));
    try {
      const response = await fetch(`/api/binance-keys/${id}/test`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('Test failed:', data.error, data.details);
        let errorMessage = data.error;
        if (data.details?.reason) {
          errorMessage += ` (${data.details.reason})`;
        }
        setError(errorMessage || 'Failed to test API key');
        setKeyStatuses(prev => ({ ...prev, [id]: 'invalid' }));
        return;
      }
      
      setKeyStatuses(prev => ({ 
        ...prev, 
        [id]: 'valid' 
      }));
    } catch (err) {
      console.error('Test error:', err);
      setError(err instanceof Error ? err.message : 'Failed to test API key');
      setKeyStatuses(prev => ({ ...prev, [id]: 'invalid' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-text-primary">API Keys</h1>
        <button
          onClick={() => setIsAddingKey(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-green text-background-dark rounded-lg hover:bg-accent-green/90"
        >
          <Key className="h-5 w-5" />
          Add New Key
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {formError && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4">
          <p className="font-medium">{formError.code}</p>
          <p className="text-sm">{formError.error}</p>
        </div>
      )}

      {isAddingKey && (
        <form onSubmit={handleSubmit} className="bg-card-background p-6 rounded-lg mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Label (60 characters max)
              </label>
              <input
                type="text"
                maxLength={60}
                required
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full px-3 py-2 bg-background-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                API Key
              </label>
              <input
                type="text"
                required
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full px-3 py-2 bg-background-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Secret Key
              </label>
              <input
                type="password"
                required
                value={formData.secretKey}
                onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                className="w-full px-3 py-2 bg-background-dark border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => setIsAddingKey(false)}
              className="px-4 py-2 text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent-green text-background-dark rounded-lg hover:bg-accent-green/90"
            >
              Add Key
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {keys.map((key) => (
          <div
            key={key.id}
            className="flex items-center justify-between bg-card-background p-4 rounded-lg"
          >
            <div>
              <h3 className="text-text-primary font-medium">{key.label}</h3>
              <p className="text-sm text-text-secondary">
                Added on {new Date(key.createdAt).toLocaleDateString()}
              </p>
              {keyStatuses[key.id] && (
                <span className={`text-sm ${
                  keyStatuses[key.id] === 'valid' 
                    ? 'text-accent-green' 
                    : keyStatuses[key.id] === 'testing'
                    ? 'text-yellow-500'
                    : 'text-red-500'
                }`}>
                  {keyStatuses[key.id] === 'testing' ? 'Testing...' : 
                   keyStatuses[key.id] === 'valid' ? 'Valid' : 'Invalid'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => testKey(key.id)}
                disabled={keyStatuses[key.id] === 'testing'}
                className="text-text-secondary hover:text-accent-green disabled:opacity-50"
              >
                Test
              </button>
              <button
                onClick={() => handleDelete(key.id)}
                className="text-red-500 hover:text-red-400"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/public/${key.viewToken}`}
                  className="bg-background-dark px-3 py-1 rounded text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/public/${key.viewToken}`);
                    // Add some toast notification here
                  }}
                  className="text-accent-green hover:text-accent-green/80"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiKeysPage; 