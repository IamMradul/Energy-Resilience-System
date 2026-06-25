interface CacheEntry {
  data: unknown
  timestamp: number
  ttl: number // milliseconds
}

const cache = new Map<string, CacheEntry>()

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

export function setCached(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs })
}
