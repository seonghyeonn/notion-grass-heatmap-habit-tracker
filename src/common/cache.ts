/**
 * Small per-instance memo. Serverless instances are short-lived, so this only
 * smooths bursts (several embeds on one page); the CDN cache does the heavy lifting.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, { value: Promise<T>; expires: number }>();

  constructor(
    private readonly maxEntries = 50,
    private readonly now: () => number = Date.now,
  ) {}

  getOrCreate(key: string, ttlMs: number, create: () => Promise<T>): Promise<T> {
    const hit = this.entries.get(key);
    if (hit && hit.expires > this.now()) return hit.value;

    const value = create();
    this.entries.set(key, { value, expires: this.now() + ttlMs });
    value.catch(() => this.entries.delete(key)); // never cache failures
    this.evict();
    return value;
  }

  private evict(): void {
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) return;
      this.entries.delete(oldest);
    }
  }
}
