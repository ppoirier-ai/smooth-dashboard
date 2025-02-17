type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export class Cache {
  private static cache: Map<string, CacheEntry<any>> = new Map();
  private static readonly DEFAULT_TTL = 60 * 1000; // 1 minute

  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    });
  }

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  static delete(key: string): void {
    this.cache.delete(key);
  }

  static clear(): void {
    this.cache.clear();
  }
} 