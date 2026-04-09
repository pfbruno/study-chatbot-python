"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com";

const AUTH_TOKEN_KEY = "studypro_auth_token";
const AUTH_USER_KEY = "studypro_auth_user";

export default function CadastroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = useMemo(
    () => searchParams.get("redirect") || "/dashboard/simulados",
    [searchParams]
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);

    try {
      const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!registerResponse.ok) {
        const message = await safeReadError(registerResponse);
        throw new Error(message || "Não foi possível criar a conta.");
      }

      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!loginResponse.ok) {
        const message = await safeReadError(loginResponse);
        throw new Error(message || "Conta criada, mas o login automático falhou.");
      }

      const loginData = await loginResponse.json();

      localStorage.setItem(AUTH_TOKEN_KEY, loginData.access_token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(loginData.user));

      router.push(redirectTo);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro inesperado ao criar conta."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
            <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              StudyPro
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Criar conta
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-300 sm:text-base">
              Cadastre-se para acompanhar seu uso, guardar a base da monetização e
              evoluir para recursos do plano PRO.
            </p>

            <div className="mt-8 space-y-4">
              <BenefitItem text="Conta gratuita com limite diário controlado" />
              <BenefitItem text="Base pronta para upgrade de plano" />
              <BenefitItem text="Autenticação conectada ao dashboard de simulados" />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/20 p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Cadastro</h2>
              <p className="mt-2 text-sm text-neutral-400">
                Preencha seus dados para criar sua conta no sistema.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <FieldBlock label="Nome">
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  autoComplete="name"
                  className={inputClassName}
                  placeholder="Seu nome"
                />
              </FieldBlock>

              <FieldBlock label="E-mail">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className={inputClassName}
                  placeholder="voce@email.com"
                />
              </FieldBlock>

              <FieldBlock label="Senha">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  className={inputClassName}
                  placeholder="Mínimo de 6 caracteres"
                />
              </FieldBlock>

              <FieldBlock label="Confirmar senha">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  className={inputClassName}
                  placeholder="Repita sua senha"
                />
              </FieldBlock>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Criando conta..." : "Criar conta"}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
              Já possui conta?{" "}
              <Link
                href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
                className="font-semibold text-emerald-300 hover:text-emerald-200"
              >
                Entrar
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-300" />
      <p className="text-sm leading-6 text-neutral-300">{text}</p>
    </div>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-200">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20";

async function safeReadError(response: Response): Promise<string> {
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

    return "Erro na requisição.";
  } catch {
    return "Erro na requisição.";
  }
}