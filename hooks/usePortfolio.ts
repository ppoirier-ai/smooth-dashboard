"use client";

import useSWR from 'swr';
import type { PortfolioSnapshot } from '@/types/portfolio';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function usePortfolio() {
  const { data: current, error: currentError, isLoading: isLoadingCurrent } = 
    useSWR<PortfolioSnapshot>('/api/portfolio', fetcher);

  const { data: history, error: historyError, isLoading: isLoadingHistory } = 
    useSWR<PortfolioSnapshot[]>('/api/portfolio/history?days=30', fetcher);

  return {
    current,
    history,
    isLoading: isLoadingCurrent || isLoadingHistory,
    isError: currentError || historyError,
  };
} 