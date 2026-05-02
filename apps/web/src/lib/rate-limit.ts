const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count < limit) {
    entry.count++;
    return true;
  }

  return false;
}

export function getRemainingTime(key: string): number {
  const entry = store.get(key);
  if (!entry) return 0;
  const remaining = entry.resetAt - Date.now();
  return Math.max(0, remaining);
}
