"use client";

import useSWR from 'swr';
import { BinanceAccount } from '@prisma/client';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useBinanceAccounts() {
  const {
    data: accounts,
    error,
    isLoading,
    mutate,
  } = useSWR<BinanceAccount[]>('/api/binance/accounts', fetcher);

  const addAccount = async (data: Omit<BinanceAccount, 'id' | 'userId'>) => {
    try {
      const response = await fetch('/api/binance/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add account');
      mutate();
    } catch (error) {
      console.error('Error adding account:', error);
      throw error;
    }
  };

  const updateAccount = async (id: string, data: Partial<BinanceAccount>) => {
    try {
      const response = await fetch(`/api/binance/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update account');
      mutate();
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const response = await fetch(`/api/binance/accounts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete account');
      mutate();
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  return {
    accounts,
    isLoading,
    isError: error,
    addAccount,
    updateAccount,
    deleteAccount,
  };
} 