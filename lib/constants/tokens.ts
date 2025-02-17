export const SUPPORTED_TOKENS = {
  BTC: {
    symbol: 'BTCUSDT',
    name: 'Bitcoin',
    decimals: 2,
  },
  SOL: {
    symbol: 'SOLUSDT',
    name: 'Solana',
    decimals: 3,
  },
  AAVE: {
    symbol: 'AAVEUSDT',
    name: 'Aave',
    decimals: 2,
  },
} as const;

export type SupportedToken = keyof typeof SUPPORTED_TOKENS; 