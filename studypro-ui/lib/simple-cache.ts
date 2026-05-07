type TimedCacheEnvelope<T> = {
  value: T
  expiresAt: number
}

function getStorage() {
  if (typeof window === "undefined") return null
  return window.sessionStorage
}

export function readTimedCache<T>(key: string, ttlMs: number): T | null {
  const storage = getStorage()
  if (!storage || ttlMs <= 0) return null

  try {
    const raw = storage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as TimedCacheEnvelope<T>

    if (!parsed || typeof parsed.expiresAt !== "number") {
      storage.removeItem(key)
      return null
    }

    if (parsed.expiresAt <= Date.now()) {
      storage.removeItem(key)
      return null
    }

    return parsed.value
  } catch {
    storage.removeItem(key)
    return null
  }
}

export function writeTimedCache<T>(key: string, value: T, ttlMs: number) {
  const storage = getStorage()
  if (!storage || ttlMs <= 0) return

  try {
    const envelope: TimedCacheEnvelope<T> = {
      value,
      expiresAt: Date.now() + ttlMs,
    }

    storage.setItem(key, JSON.stringify(envelope))
  } catch {
    // Não bloqueia a aplicação se o navegador negar storage.
  }
}

export function clearTimedCache(prefix: string) {
  const storage = getStorage()
  if (!storage) return

  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index)
      if (key?.startsWith(prefix)) {
        storage.removeItem(key)
      }
    }
  } catch {
    // Falha de cache não deve afetar a aplicação.
  }
}

export function buildTokenCacheKey(prefix: string, token?: string | null) {
  return `${prefix}:${token ? token.slice(0, 16) : "anonymous"}`
}
