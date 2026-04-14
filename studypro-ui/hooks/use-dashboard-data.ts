"use client";

import { useEffect, useState } from "react";
import { getDashboardData } from "@/lib/api";

type DashboardData = {
  questions: number;
  correct: number;
  wrong: number;
  insights: string;
  streak: number;
  best_streak: number;
  plan: "free" | "pro";
  recent_attempts: Array<{
    exam_id?: number;
    title?: string;
    score_percentage?: number;
    created_at?: string;
  }>;
};

const EMPTY_DASHBOARD: DashboardData = {
  questions: 0,
  correct: 0,
  wrong: 0,
  insights: "Ainda não há dados suficientes para gerar insights.",
  streak: 0,
  best_streak: 0,
  plan: "free",
  recent_attempts: [],
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