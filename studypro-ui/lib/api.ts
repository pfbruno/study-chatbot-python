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

export async function register(data: any) {
  return request("/auth/register", {
    method: "POST",
    body: data,
  });
}

/* ===========================
   USER
=========================== */

export async function getMe(token: string) {
  return request("/users/me", { token });
}

/* ===========================
   DASHBOARD
=========================== */

export async function getDashboardData(token: string) {
  return request("/dashboard", { token });
}

/* ===========================
   EXAMS
=========================== */

export async function getExamYears() {
  return request("/exams/enem");
}

export async function getExamByYear(year: string) {
  return request(`/exams/enem/${year}`);
}