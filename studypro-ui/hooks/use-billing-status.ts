"use client"

import { useEffect, useState } from "react"
import { getBillingStatus, type BillingStatusResponse } from "@/lib/api"

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

      setLoading(true)
      setError(null)

      try {
        const response = await getBillingStatus(token)

        if (!cancelled) {
          setData(response)
        }
      } catch (err) {
        if (!cancelled) {
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

    load()

    return () => {
      cancelled = true
    }
  }, [token])

  return { data, loading, error }
}