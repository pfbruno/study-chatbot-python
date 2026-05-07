"use client"

import { useEffect, useState } from "react"
import { getBillingStatus, type BillingStatusResponse } from "@/lib/api"
import {
  buildTokenCacheKey,
  readTimedCache,
  writeTimedCache,
} from "@/lib/simple-cache"

const BILLING_CACHE_PREFIX = "studypro_billing_cache"
const BILLING_CACHE_TTL_MS = 15 * 1000

export function useBillingStatus(token: string | null) {
  const [data, setData] = useState<BillingStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!token) {
        setData(null)
        setLoading(false)
        setError(null)
        return
      }

      const cacheKey = buildTokenCacheKey(BILLING_CACHE_PREFIX, token)
      const cached = readTimedCache<BillingStatusResponse>(
        cacheKey,
        BILLING_CACHE_TTL_MS
      )

      if (cached && !cancelled) {
        setData(cached)
        setLoading(false)
        setError(null)
      }

      try {
        if (!cached) {
          setLoading(true)
        }

        setError(null)

        const response = await getBillingStatus(token)
        writeTimedCache(cacheKey, response, BILLING_CACHE_TTL_MS)

        if (!cancelled) {
          setData(response)
        }
      } catch (err) {
        if (!cancelled && !cached) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar status do plano."
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [token])

  return { data, loading, error }
}
