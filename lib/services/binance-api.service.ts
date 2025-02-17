import { apiRateLimiter } from '@/lib/utils/rateLimiter';
import { ApiKeyValidator } from '@/lib/utils/validators';
import Logger from '@/lib/utils/logger';
import { retry } from '@/lib/utils/retry';
import { Cache } from '@/lib/utils/cache';

export class BinanceApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'BinanceApiError';
  }
}

interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

interface BinanceAccountInfo {
  balances: BinanceBalance[];
  permissions: string[];
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
}

export class BinanceApiService {
  private static readonly CACHE_TTL = 30 * 1000; // 30 seconds

  private static shouldRetryError(error: any): boolean {
    if (error instanceof BinanceApiError) {
      // Don't retry validation or auth errors
      return !['INVALID_API_KEY', 'INVALID_API_SECRET', 'UNAUTHORIZED'].includes(error.code);
    }
    // Retry network errors
    return true;
  }

  static async testConnection(apiKey: string, apiSecret: string, clientIp: string) {
    Logger.info('Testing Binance API connection', { clientIp });

    // Validate API credentials format
    const keyValidation = ApiKeyValidator.validateApiKey(apiKey);
    if (!keyValidation.isValid) {
      Logger.warn('Invalid API key format', { clientIp, error: keyValidation.error });
      throw new BinanceApiError(
        keyValidation.error!,
        'INVALID_API_KEY'
      );
    }

    const secretValidation = ApiKeyValidator.validateApiSecret(apiSecret);
    if (!secretValidation.isValid) {
      Logger.warn('Invalid API secret format', { clientIp, error: secretValidation.error });
      throw new BinanceApiError(
        secretValidation.error!,
        'INVALID_API_SECRET'
      );
    }

    // Check rate limit
    if (!apiRateLimiter.canMakeRequest(clientIp)) {
      const waitTime = apiRateLimiter.getTimeUntilNextAllowed(clientIp);
      Logger.warn('Rate limit exceeded', { clientIp, waitTime });
      throw new BinanceApiError(
        `Rate limit exceeded. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    return retry(
      async () => {
        try {
          const timestamp = Date.now();
          const queryString = `timestamp=${timestamp}`;
          
          const crypto = require('crypto');
          const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(queryString)
            .digest('hex');

          const response = await fetch(
            `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
            {
              headers: {
                'X-MBX-APIKEY': apiKey,
              },
            }
          );

          if (!response.ok) {
            const error = await response.json();
            
            // Handle specific Binance error codes
            switch (error.code) {
              case -2015:
                throw new BinanceApiError(
                  'Invalid API key format',
                  'INVALID_API_KEY',
                  response.status
                );
              case -2014:
                throw new BinanceApiError(
                  'Invalid API key, IP, or permissions',
                  'UNAUTHORIZED',
                  response.status
                );
              case -1022:
                throw new BinanceApiError(
                  'Invalid signature',
                  'INVALID_SIGNATURE',
                  response.status
                );
              default:
                throw new BinanceApiError(
                  error.msg || 'Failed to connect to Binance',
                  'UNKNOWN_ERROR',
                  response.status
                );
            }
          }

          return true;
        } catch (error) {
          Logger.error('Binance API connection test failed', {
            clientIp,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      },
      {
        maxAttempts: 3,
        delay: 1000,
        backoff: 2,
        shouldRetry: this.shouldRetryError,
      }
    );
  }

  private static async makeSignedRequest<T>(
    endpoint: string,
    apiKey: string,
    apiSecret: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const timestamp = Date.now();
    const queryParams = new URLSearchParams({
      ...params,
      timestamp: timestamp.toString(),
    });

    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryParams.toString())
      .digest('hex');

    queryParams.append('signature', signature);

    const response = await fetch(
      `https://api.binance.com${endpoint}?${queryParams.toString()}`,
      {
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      this.handleBinanceError(error, response.status);
    }

    return response.json();
  }

  private static handleBinanceError(error: any, status: number): never {
    switch (error.code) {
      case -2015:
        throw new BinanceApiError('Invalid API key format', 'INVALID_API_KEY', status);
      case -2014:
        throw new BinanceApiError('Invalid API key or permissions', 'UNAUTHORIZED', status);
      case -1022:
        throw new BinanceApiError('Invalid signature', 'INVALID_SIGNATURE', status);
      default:
        throw new BinanceApiError(
          error.msg || 'Unknown Binance error',
          'UNKNOWN_ERROR',
          status
        );
    }
  }

  static async getAccountInfo(
    apiKey: string,
    apiSecret: string,
    useCache = true
  ): Promise<BinanceAccountInfo> {
    const cacheKey = `binance:account:${apiKey}`;
    
    if (useCache) {
      const cached = Cache.get<BinanceAccountInfo>(cacheKey);
      if (cached) return cached;
    }

    const data = await retry(
      () => this.makeSignedRequest<BinanceAccountInfo>('/api/v3/account', apiKey, apiSecret),
      {
        maxAttempts: Number(process.env.API_RETRY_MAX_ATTEMPTS),
        delay: Number(process.env.API_RETRY_INITIAL_DELAY),
        backoff: Number(process.env.API_RETRY_BACKOFF),
        shouldRetry: this.shouldRetryError,
      }
    );

    Cache.set(cacheKey, data, this.CACHE_TTL);
    return data;
  }

  static async getMarginAccountInfo(
    apiKey: string,
    apiSecret: string,
    useCache = true
  ) {
    const cacheKey = `binance:margin:${apiKey}`;
    
    if (useCache) {
      const cached = Cache.get(cacheKey);
      if (cached) return cached;
    }

    const data = await retry(
      () => this.makeSignedRequest('/sapi/v1/margin/account', apiKey, apiSecret),
      {
        maxAttempts: Number(process.env.API_RETRY_MAX_ATTEMPTS),
        delay: Number(process.env.API_RETRY_INITIAL_DELAY),
        backoff: Number(process.env.API_RETRY_BACKOFF),
        shouldRetry: this.shouldRetryError,
      }
    );

    Cache.set(cacheKey, data, this.CACHE_TTL);
    return data;
  }

  static async getFuturesAccountInfo(
    apiKey: string,
    apiSecret: string,
    useCache = true
  ) {
    const cacheKey = `binance:futures:${apiKey}`;
    
    if (useCache) {
      const cached = Cache.get(cacheKey);
      if (cached) return cached;
    }

    const data = await retry(
      () => this.makeSignedRequest('/fapi/v2/account', apiKey, apiSecret),
      {
        maxAttempts: Number(process.env.API_RETRY_MAX_ATTEMPTS),
        delay: Number(process.env.API_RETRY_INITIAL_DELAY),
        backoff: Number(process.env.API_RETRY_BACKOFF),
        shouldRetry: this.shouldRetryError,
      }
    );

    Cache.set(cacheKey, data, this.CACHE_TTL);
    return data;
  }

  // Add more methods for other Binance API endpoints...
} 