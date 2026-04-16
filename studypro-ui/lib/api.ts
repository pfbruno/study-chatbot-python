const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://study-chatbot-python.onrender.com";

function getAuthHeaders() {
  if (typeof window === "undefined") return {};

  const token = localStorage.getItem("access_token");
  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let error;
    try {
      error = await res.json();
    } catch {
      throw new Error(`Erro HTTP ${res.status}`);
    }
    throw new Error(error.detail || "Erro na requisição");
  }

  return res.json();
}

//
// =============================
// 🔥 PROVAS (CORRIGIDO)
// =============================
//

// LISTAR ANOS ENEM
export async function getExamYears() {
  return request("/v2/exams/enem");
}

// BUSCAR PROVA POR ANO
export async function getExamByYear(year: number) {
  return request(`/v2/exams/enem/${year}`);
}

// BUSCAR ESTRUTURA COMPLETA
export async function getExamStructure(examId: number) {
  return request(`/v2/exams/${examId}`);
}

// CRIAR TENTATIVA
export async function submitExamAttempt(payload: any) {
  return request("/v2/exams/attempts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ANALYTICS
export async function getExamAnalytics() {
  return request("/v2/exams/analytics");
}