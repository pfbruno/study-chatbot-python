"use client";

import { useEffect, useState } from "react";
import {
  getGamificationRanking,
  getGamificationSummary,
  type GamificationRankingResponse,
  type GamificationSummaryResponse,
} from "@/lib/api";

const EMPTY_SUMMARY: GamificationSummaryResponse = {
  profile: {
    userName: "Usuário",
    level: 1,
    currentXP: 0,
    nextLevelXP: 800,
    totalXP: 0,
    streakDays: 0,
    completedChallenges: 0,
    unlockedAchievements: 0,
    totalAchievements: 0,
  },
  achievements: [],
  recentUnlocks: [],
  weeklyEvolution: [],
  challenges: [],
};

export function useGamificationSummary(token: string | null) {
  const [data, setData] = useState<GamificationSummaryResponse>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!token) {
        if (mounted) {
          setData(EMPTY_SUMMARY);
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getGamificationSummary(token);

        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar gamificação."
          );
          setData(EMPTY_SUMMARY);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void run();

    return () => {
      mounted = false;
    };
  }, [token]);

  return { data, loading, error };
}

export function useGamificationRanking(
  token: string | null,
  scope: "weekly" | "monthly" | "global"
) {
  const [data, setData] = useState<GamificationRankingResponse>({
    scope,
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!token) {
        if (mounted) {
          setData({ scope, items: [] });
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getGamificationRanking(scope, token);

        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar ranking."
          );
          setData({ scope, items: [] });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void run();

    return () => {
      mounted = false;
    };
  }, [scope, token]);

  return { data, loading, error };
}