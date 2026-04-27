const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com";

export const AUTH_TOKEN_KEY = "studypro_auth_token";
export const AUTH_USER_KEY = "studypro_auth_user";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  plan: "free" | "pro";
  subscription_status?: string;
  current_period_end?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BillingEntitlements = {
  is_pro: boolean;
  can_access_advanced_analytics: boolean;
  can_access_critical_questions: boolean;
  can_access_smart_insights: boolean;
  can_generate_advanced_simulations: boolean;
  can_compare_simulados_vs_provas: boolean;
};

export type BillingUsage = {
  scope: "user" | "guest";
  plan: "free" | "pro" | "guest";
  usage_date: string;
  simulations_generated_today: number;
  daily_limit: number | null;
  remaining_today: number | null;
  can_generate: boolean;
};

export type BillingStatusResponse = {
  user: AuthUser;
  usage: BillingUsage;
  entitlements: BillingEntitlements;
};

export type SimulationEntitlementResponse = {
  authenticated: boolean;
  user: AuthUser | null;
  usage: BillingUsage;
  entitlements: BillingEntitlements;
};

export type CheckoutSessionResponse = {
  message: string;
  checkout_session_id: string;
  checkout_url: string;
};

export type BillingPublicConfigResponse = {
  provider: "mercadopago"
  public_key: string
  is_configured: boolean
  plan_defaults: {
    reason: string
    transaction_amount: number
    frequency: number
    frequency_type: string
    currency_id: string
    back_url: string
  }
  stored_plan: {
    plan_id: string | null
    reason: string | null
    transaction_amount: number | null
    frequency: number | null
    frequency_type: string | null
    currency_id: string | null
    back_url: string | null
  }
  config_map: Record<string, string>
}

export type MercadoPagoSubscriptionResponse = {
  message: string
  provider: "mercadopago"
  subscription: {
    id: number
    user_id: number
    provider: string
    provider_plan_id: string | null
    provider_subscription_id: string | null
    external_reference: string | null
    payer_email: string | null
    status: string
    reason: string | null
    currency_id: string
    transaction_amount: number
    frequency: number
    frequency_type: string
    next_payment_date: string | null
    last_webhook_at: string | null
    raw_payload_json: string | null
    created_at: string
    updated_at: string
  }
  remote_subscription: Record<string, unknown>
  user: AuthUser
}

export type DashboardRecentAttempt = {
  exam_id?: number;
  title?: string;
  score_percentage?: number;
  created_at?: string;
  correct_answers?: number;
  wrong_answers?: number;
  total_questions?: number;
};

export type DashboardResponse = {
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

export type ExamPdf = {
  label: string;
  url: string;
};

export type ExamYearSummary = {
  year: number;
  title: string;
  description: string;
  question_count: number;
  has_answer_key: boolean;
  has_pdfs: boolean;
  official_page_url?: string | null;
};

export type ExamType = {
  key: string;
  label: string;
  years: ExamYearSummary[];
};

export type ExamCatalogResponse = {
  exam_types: ExamType[];
};

export type ExamYearsResponse = {
  exam_type: string;
  years: number[];
};

export type ExamDetail = {
  exam_type: string;
  institution: string;
  year: number;
  title: string;
  description: string;
  question_count: number;
  pdfs: ExamPdf[];
  has_answer_key: boolean;
  official_page_url?: string | null;
};

export type RandomSimulationQuestion = {
  number: number;
  subject: string;
  statement: string;
  options: Record<string, string>;
  source_pdf_label?: string | null;
};

export type RandomSimulationResponse = {
  simulation_id: string;
  generated_at: string;
  exam_type: string;
  year: number;
  title: string;
  mode: "balanced" | "random";
  requested_question_count: number;
  generated_question_count: number;
  filters: {
    subjects: string[];
    mode: "balanced" | "random";
    seed: number | null;
  };
  subjects_used: string[];
  question_numbers: number[];
  questions: RandomSimulationQuestion[];
  access?: {
    auth_scope: "user" | "guest";
    usage: BillingUsage;
    user: AuthUser | null;
  };
};

export type GamificationProfile = {
  userName: string;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  streakDays: number;
  completedChallenges: number;
  unlockedAchievements: number;
  totalAchievements: number;
};

export type GamificationAchievement = {
  id: string;
  title: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  category: "study" | "consistency" | "performance" | "social";
  xpReward: number;
  progress: number;
  target: number;
  status: "unlocked" | "in_progress" | "locked";
  unlockedAt?: string | null;
  icon: string;
};

export type GamificationRecentUnlock = {
  id: string;
  title: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockedAt: string;
  xpReward: number;
};

export type GamificationWeeklyEvolutionPoint = {
  label: string;
  xp: number;
};

export type GamificationChallenge = {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "special";
  difficulty: "easy" | "medium" | "hard";
  status: "active" | "completed" | "locked";
  progress: number;
  target: number;
  xpReward: number;
  rewardLabel: string;
  expiresIn: string;
  icon: "target" | "brain" | "flame" | "rocket" | "award" | "trophy";
};

export type GamificationSummaryResponse = {
  profile: GamificationProfile;
  achievements: GamificationAchievement[];
  recentUnlocks: GamificationRecentUnlock[];
  weeklyEvolution: GamificationWeeklyEvolutionPoint[];
  challenges: GamificationChallenge[];
};

export type RankingUser = {
  id: string;
  name: string;
  xp: number;
  streak: number;
  completedChallenges: number;
  accuracy: number;
  level: number;
  movement: "up" | "down" | "same";
  avatar: string;
  highlight?: boolean;
};

export type GamificationRankingResponse = {
  scope: "weekly" | "monthly" | "global";
  items: RankingUser[];
};

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: unknown) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: string }).msg);
          }
          return "Erro de validação.";
        })
        .join(" | ");
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    return "Erro na requisição.";
  } catch {
    const text = await response.text().catch(() => "");
    return text || "Erro na requisição.";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

  const resolvedToken =
    typeof token === "undefined" ? getStoredToken() : token ?? null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<T>;
}

/* ===========================
   AUTH
=========================== */

export async function login(email: string, password: string) {
  return request<{
    message: string;
    token_type: "Bearer";
    access_token: string;
    expires_at: string;
    user: AuthUser;
    usage: BillingUsage;
    entitlements: BillingEntitlements;
  }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function getMe(token?: string | null) {
  return request<{
    user: AuthUser;
    usage: BillingUsage;
    entitlements: BillingEntitlements;
  }>("/auth/me", { token });
}

/* ===========================
   BILLING
=========================== */

export async function getBillingStatus(token?: string | null) {
  return request<BillingStatusResponse>("/billing/status", { token });
}

export async function getSimulationEntitlement(token?: string | null) {
  return request<SimulationEntitlementResponse>("/simulados/entitlement", {
    token,
  });
}

export async function getBillingPublicConfig() {
  return request<BillingPublicConfigResponse>("/billing/public-config");
}

export async function createMercadoPagoSubscription(
  payload: {
    card_token_id: string;
    payer_email: string;
    identification_type?: string | null;
    identification_number?: string | null;
  },
  token?: string | null
) {
  return request<MercadoPagoSubscriptionResponse>(
    "/billing/mercadopago/subscriptions",
    {
      method: "POST",
      token,
      body: payload,
    }
  );
}

export async function cancelMercadoPagoSubscription(token?: string | null) {
  return request<{
    message: string;
    subscription: Record<string, unknown>;
    user: AuthUser;
  }>("/billing/cancel", {
    method: "POST",
    token,
    body: {},
  });
}

/* ===========================
   DASHBOARD
=========================== */

export async function getDashboardData(token?: string | null) {
  return request<DashboardResponse>("/dashboard", { token });
}

/* ===========================
   GAMIFICATION
=========================== */

export async function getGamificationSummary(token?: string | null) {
  return request<GamificationSummaryResponse>("/gamification/summary", {
    token,
  });
}

export async function getGamificationRanking(
  scope: "weekly" | "monthly" | "global",
  token?: string | null
) {
  return request<GamificationRankingResponse>(
    `/gamification/ranking?scope=${scope}`,
    { token }
  );
}

/* ===========================
   EXAMS
=========================== */

export async function getExamTypes() {
  const data = await request<{ items?: Array<any> }>("/v2/exams");

  const items = data?.items ?? [];

  return items.map((item: any) => ({
    id: item.id,
    type: item.source || item.type || item.exam_type || "enem",
    label: (item.source || item.type || item.exam_type || "enem").toUpperCase(),
    year: item.year,
    title: item.title,
  }));
}

export async function getExamYears() {
  return request<ExamYearsResponse>("/v2/exams/enem");
}

export async function getExamByYear(year: string | number) {
  return request<ExamDetail>(`/v2/exams/enem/${year}`);
}

export async function getExamByTypeAndYear(
  type: string,
  year: string | number
) {
  return request<ExamDetail>(`/v2/exams/${type}/${year}`);
}

export async function submitExamAnswers(
  type: string,
  year: string | number,
  answers: Array<string | null>,
  token?: string | null
) {
  return request(`/v2/exams/${type}/${year}/submit`, {
    method: "POST",
    token,
    body: { answers },
  });
}

/* ===========================
   RANDOM SIMULATIONS
=========================== */

export async function generateRandomSimulation(
  payload: {
    exam_type: string;
    year: number;
    question_count: number;
    subjects?: string[] | null;
    mode?: "balanced" | "random";
    seed?: number | null;
  },
  token?: string | null
) {
  return request<RandomSimulationResponse>("/simulados/random", {
    method: "POST",
    token,
    body: payload,
  });
}