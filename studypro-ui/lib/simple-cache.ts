const memoryCache = new Map<string, { value: unknown; expiresAt: number }>()

export async function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const cached = memoryCache.get(key)
  if (cached && cached.expiresAt > now) {
    return cached.value as T
  }

  if (typeof window !== "undefined") {
    const raw = sessionStorage.getItem(`sp_cache:${key}`)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { value: T; expiresAt: number }
        if (parsed.expiresAt > now) {
          memoryCache.set(key, parsed)
          return parsed.value
        }
      } catch {
        // ignora cache inválido
      }
    }
  }

  const value = await fetcher()
  const payload = { value, expiresAt: now + ttlMs }
  memoryCache.set(key, payload)
  if (typeof window !== "undefined") {
    sessionStorage.setItem(`sp_cache:${key}`, JSON.stringify(payload))
  }
  return value
}

export function clearCachePrefix(prefix: string) {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key)
    }
  }
  if (typeof window !== "undefined") {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith(`sp_cache:${prefix}`)) {
        sessionStorage.removeItem(key)
      }
    })
  }
}
