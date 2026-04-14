const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://study-chatbot-python.onrender.com";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  token?: string | null;
};

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Erro na requisição");
  }

  return response.json();
}

/* ===========================
   AUTH
=========================== */

export async function login(email: string, password: string) {
  return request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/* ===========================
   USER
=========================== */

export async function getMe(token: string) {
  return request("/users/me", { token });
}

/* ===========================
   BILLING (FIX CRÍTICO)
=========================== */

export type BillingEntitlements = {
  plan: "free" | "premium";
};

export async function getBillingStatus(token?: string) {
  return request("/billing/status", { token });
}

/* ===========================
   DASHBOARD
=========================== */

export async function getDashboardData(token: string) {
  return request("/dashboard", { token });
}

/* ===========================
   EXAMS (FIX CRÍTICO)
=========================== */

export type ExamType = {
  id: string;
  name: string;
};

export async function getExamTypes() {
  return request("/exams");
}

export async function getExamYears() {
  return request("/exams/enem");
}

export async function getExamByYear(year: string) {
  return request(`/exams/enem/${year}`);
}

export async function getExamByTypeAndYear(
  type: string,
  year: string
) {
  return request(`/exams/${type}/${year}`);
}

export async function submitExamAnswers(
  type: string,
  year: string,
  answers: any
) {
  return request(`/exams/${type}/${year}/submit`, {
    method: "POST",
    body: answers,
  });
}