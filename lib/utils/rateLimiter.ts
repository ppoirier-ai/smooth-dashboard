class RateLimiter {
  private timestamps: { [key: string]: number[] } = {};
  private readonly limit: number;
  private readonly interval: number;

  constructor(limit: number, interval: number) {
    this.limit = limit;
    this.interval = interval;
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const keyTimestamps = this.timestamps[key] || [];
    
    // Remove old timestamps
    const validTimestamps = keyTimestamps.filter(
      timestamp => now - timestamp < this.interval
    );
    
    this.timestamps[key] = validTimestamps;

    if (validTimestamps.length >= this.limit) {
      return false;
    }

    this.timestamps[key] = [...validTimestamps, now];
    return true;
  }

  getTimeUntilNextAllowed(key: string): number {
    const keyTimestamps = this.timestamps[key] || [];
    if (keyTimestamps.length === 0) return 0;

    const oldestTimestamp = keyTimestamps[0];
    const timeUntilExpiry = this.interval - (Date.now() - oldestTimestamp);
    return Math.max(0, timeUntilExpiry);
  }
}

// Allow 3 requests per minute per IP
export const apiRateLimiter = new RateLimiter(3, 60 * 1000); 