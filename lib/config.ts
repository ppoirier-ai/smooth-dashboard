// Base URLs for different Binance environments
export const BINANCE_API_URL = process.env.BINANCE_API_URL || 'https://api.binance.com';
export const BINANCE_FUTURES_API_URL = process.env.BINANCE_FUTURES_API_URL || 'https://fapi.binance.com';
export const BINANCE_MARGIN_API_URL = process.env.BINANCE_MARGIN_API_URL || 'https://api.binance.com';

// API Timeouts
export const API_TIMEOUT = 10000; // 10 seconds

// WebSocket Configuration
export const WS_RECONNECT_INTERVAL = 5000; // 5 seconds
export const WS_PING_INTERVAL = 30000; // 30 seconds

// Rate Limiting
export const MAX_REQUESTS_PER_MINUTE = 1200;
export const MAX_ORDERS_PER_SECOND = 10;

// Cache Configuration
export const CACHE_TTL = 60; // 1 minute
export const PRICE_CACHE_TTL = 5; // 5 seconds

// Feature Flags
export const FEATURES = {
  TRADING_ENABLED: process.env.TRADING_ENABLED === 'true',
  MARGIN_ENABLED: process.env.MARGIN_ENABLED === 'true',
  FUTURES_ENABLED: process.env.FUTURES_ENABLED === 'true',
  TRADING_BOT_ENABLED: process.env.TRADING_BOT_ENABLED === 'true',
}; 