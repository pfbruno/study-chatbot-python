const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com";

export async function getSimulationLibrary() {
  const res = await fetch(`${API_URL}/simulados/library?exam_type=enem`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Erro ao carregar biblioteca de simulados");
  }

  return res.json();
}

export async function generateLibrarySimulation(
  presetId: string,
  token?: string | null
) {
  const res = await fetch(
    `${API_URL}/simulados/library/${presetId}/generate?exam_type=enem`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({}),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || "Erro ao gerar simulado");
  }

  return res.json();
}