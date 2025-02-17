"use client";

import { useState, useEffect } from 'react';
import { BinanceWebSocketService } from '@/lib/services/binance-websocket.service';
import { SUPPORTED_TOKENS, SupportedToken } from '@/lib/constants/tokens';

interface PriceData {
  price: string | null;
  lastUpdate: Date | null;
  priceChange: number;
  priceChangePercent: number;
}

export function usePriceUpdates(token: SupportedToken): PriceData {
  const [priceData, setPriceData] = useState<PriceData>({
    price: null,
    lastUpdate: null,
    priceChange: 0,
    priceChangePercent: 0,
  });

  useEffect(() => {
    const symbol = SUPPORTED_TOKENS[token].symbol;
    const wsService = BinanceWebSocketService.getInstance();
    
    const unsubscribe = wsService.subscribe(symbol, (update) => {
      setPriceData({
        price: update.price,
        lastUpdate: new Date(update.timestamp),
        priceChange: update.priceChange,
        priceChangePercent: update.priceChangePercent,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [token]);

  return priceData;
} 