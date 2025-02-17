import Logger from '@/lib/utils/logger';
import { SUPPORTED_TOKENS } from '@/lib/constants/tokens';

interface PriceUpdate {
  symbol: string;
  price: string;
  timestamp: number;
  priceChange: number;
  priceChangePercent: number;
}

type PriceUpdateCallback = (update: PriceUpdate) => void;

export class BinanceWebSocketService {
  private static instance: BinanceWebSocketService;
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<PriceUpdateCallback>> = new Map();
  private lastPrices: Map<string, { price: number; timestamp: number }> = new Map();
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 1000;
  private readonly PRICE_CHANGE_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    // Initialize with supported tokens
    Object.values(SUPPORTED_TOKENS).forEach(token => {
      this.lastPrices.set(token.symbol, { price: 0, timestamp: 0 });
    });
  }

  static getInstance(): BinanceWebSocketService {
    if (!this.instance) {
      this.instance = new BinanceWebSocketService();
    }
    return this.instance;
  }

  private getWebSocketUrl(symbols: string[]): string {
    const streams = symbols.map(s => `${s.toLowerCase()}@trade`).join('/');
    return `wss://stream.binance.com:9443/ws/${streams}`;
  }

  private calculatePriceChange(symbol: string, currentPrice: number): { change: number; percent: number } {
    const lastPrice = this.lastPrices.get(symbol);
    if (!lastPrice || lastPrice.price === 0) {
      return { change: 0, percent: 0 };
    }

    const change = currentPrice - lastPrice.price;
    const percent = (change / lastPrice.price) * 100;

    return { change, percent };
  }

  subscribe(symbol: string, callback: PriceUpdateCallback): () => void {
    // Validate symbol
    if (!Object.values(SUPPORTED_TOKENS).some(token => token.symbol === symbol)) {
      throw new Error(`Unsupported token symbol: ${symbol}`);
    }

    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
      this.updateWebSocket();
    }

    this.subscribers.get(symbol)!.add(callback);
    Logger.info(`Subscribed to ${symbol} price updates`);

    return () => {
      const symbolSubscribers = this.subscribers.get(symbol);
      if (symbolSubscribers) {
        symbolSubscribers.delete(callback);
        if (symbolSubscribers.size === 0) {
          this.subscribers.delete(symbol);
          this.updateWebSocket();
        }
      }
      Logger.info(`Unsubscribed from ${symbol} price updates`);
    };
  }

  private updateWebSocket() {
    const symbols = Array.from(this.subscribers.keys());

    if (symbols.length === 0) {
      this.closeConnection();
      return;
    }

    if (this.ws) {
      this.closeConnection();
    }

    this.connect(symbols);
  }

  private async initializeLastPrices() {
    try {
      // Fetch initial prices from Binance REST API
      const symbols = Array.from(this.subscribers.keys()).join(',');
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols}]`);
      const data = await response.json();

      data.forEach((ticker: any) => {
        this.lastPrices.set(ticker.symbol, {
          price: parseFloat(ticker.lastPrice),
          timestamp: Date.now(),
        });
      });
    } catch (error) {
      Logger.error('Failed to initialize last prices', { error });
    }
  }

  private connect(symbols: string[]) {
    this.initializeLastPrices().then(() => {
      try {
        this.ws = new WebSocket(this.getWebSocketUrl(symbols));

        this.ws.onopen = () => {
          Logger.info('WebSocket connected');
          this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.e === 'trade') {
              const currentPrice = parseFloat(data.p);
              const { change, percent } = this.calculatePriceChange(data.s, currentPrice);

              const update: PriceUpdate = {
                symbol: data.s,
                price: data.p,
                timestamp: data.T,
                priceChange: change,
                priceChangePercent: percent,
              };

              // Update last price
              this.lastPrices.set(data.s, {
                price: currentPrice,
                timestamp: data.T,
              });

              const subscribers = this.subscribers.get(update.symbol);
              subscribers?.forEach(callback => callback(update));
            }
          } catch (error) {
            Logger.error('Error processing WebSocket message', { error });
          }
        };

        this.ws.onclose = () => {
          Logger.warn('WebSocket disconnected');
          this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
          Logger.error('WebSocket error', { error });
          this.handleDisconnect();
        };

      } catch (error) {
        Logger.error('Error creating WebSocket connection', { error });
        this.handleDisconnect();
      }
    });
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      Logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
      setTimeout(() => {
        this.updateWebSocket();
      }, this.RECONNECT_DELAY * this.reconnectAttempts);
    } else {
      Logger.error('Max reconnection attempts reached');
    }
  }

  private closeConnection() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
} 