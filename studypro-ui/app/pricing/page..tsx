"use client";

import { useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com";

const AUTH_TOKEN_KEY = "studypro_auth_token";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpgrade() {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);

      if (!token) {
        setMessage("Você precisa estar logado para fazer upgrade.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/billing/plan`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: "pro" }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar plano.");
      }

      setMessage("Plano PRO ativado com sucesso!");
    } catch {
      setMessage("Erro ao fazer upgrade.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-6">

        {/* FREE */}
        <div className="border border-white/10 rounded-3xl p-6 bg-white/5">
          <h2 className="text-xl font-bold">Plano Free</h2>
          <p className="mt-2 text-neutral-400">Uso limitado diário</p>

          <ul className="mt-4 space-y-2 text-sm">
            <li>✔ 3 simulados por dia</li>
            <li>✔ Acesso básico</li>
            <li>✖ Sem análise avançada</li>
          </ul>
        </div>

        {/* PRO */}
        <div className="border border-emerald-400 rounded-3xl p-6 bg-emerald-400/10">
          <h2 className="text-xl font-bold">Plano PRO</h2>
          <p className="mt-2 text-neutral-300">Acesso completo</p>

          <ul className="mt-4 space-y-2 text-sm">
            <li>✔ Simulados ilimitados</li>
            <li>✔ Estatísticas completas</li>
            <li>✔ Prioridade de recursos</li>
          </ul>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="mt-6 w-full bg-emerald-400 text-black py-3 rounded-xl font-semibold"
          >
            {loading ? "Processando..." : "Ativar PRO"}
          </button>

          {message && (
            <p className="mt-4 text-sm text-center text-emerald-200">
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}