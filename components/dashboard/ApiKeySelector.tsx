'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/Button";

interface ApiKey {
  id: string;
  label: string;
  createdAt: string;
  status: string;
  viewToken: string;
}

interface ApiKeySelectorProps {
  currentKeyId?: string;
  onKeyChange: (keyId: string) => void;
}

export default function ApiKeySelector({ currentKeyId, onKeyChange }: ApiKeySelectorProps) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKeys() {
      try {
        setLoading(true);
        console.log('Fetching API keys...');
        const response = await fetch('/api/binance-keys');
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API key fetch failed:', errorData);
          throw new Error(errorData.error || 'Failed to fetch API keys');
        }
        
        const data = await response.json();
        console.log('Fetched API keys:', data);
        setKeys(data);
        
        if (data.length > 0 && !currentKeyId) {
          console.log('Selecting first key:', data[0].id);
          onKeyChange(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching API keys:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch API keys');
      } finally {
        setLoading(false);
      }
    }

    fetchKeys();
  }, [currentKeyId, onKeyChange]);

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (error) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Error loading keys" />
        </SelectTrigger>
      </Select>
    );
  }

  if (keys.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="No API keys found" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={currentKeyId} onValueChange={onKeyChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select an API key" />
      </SelectTrigger>
      <SelectContent>
        {keys.map((key) => (
          <SelectItem key={key.id} value={key.id}>
            {key.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 