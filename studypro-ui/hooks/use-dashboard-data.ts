"use client";

import { useEffect, useState } from "react";
import {
  getDashboardData,
  type AuthUser,
  type BillingEntitlements,
  type BillingUsage,
  type DashboardRecentAttempt,
} from "@/lib/api";

type DashboardData = {
  questions: number;
  correct: number;
  wrong: number;
  insights: string;
  average_score: number;
  attempts_count: number;
  recent_attempts: DashboardRecentAttempt[];
  user: AuthUser | null;
  usage: BillingUsage | null;
  entitlements: BillingEntitlements | null;
};

const EMPTY_DASHBOARD: DashboardData = {
  questions: 0,
  correct: 0,
  wrong: 0,
  insights: "Ainda não há dados suficientes para gerar insights.",
  average_score: 0,
  attempts_count: 0,
  recent_attempts: [],
  user: null,
  usage: null,
  entitlements: null,
};

export function useDashboardData(token: string | null) {
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      if (!token) {
        if (mounted) {
          setData(EMPTY_DASHBOARD);
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getDashboardData(token);

        if (mounted) {
          setData({
            ...EMPTY_DASHBOARD,
            ...result,
            recent_attempts: Array.isArray(result.recent_attempts)
              ? result.recent_attempts
              : [],
          });
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro inesperado ao carregar o dashboard."
          );
          setData(EMPTY_DASHBOARD);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [token]);

  return { data, loading, error };
}