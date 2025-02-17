interface CachedPrice {
  price: number;
  timestamp: number;
}

class PriceCache {
  private cache: Map<string, CachedPrice> = new Map();
  private readonly TTL = 10000; // 10 seconds cache

  set(symbol: string, price: number) {
    this.cache.set(symbol, {
      price,
      timestamp: Date.now()
    });
  }

  get(symbol: string): number | null {
    const cached = this.cache.get(symbol);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(symbol);
      return null;
    }

    return cached.price;
  }

  clear() {
    this.cache.clear();
  }
}

export const priceCache = new PriceCache(); 