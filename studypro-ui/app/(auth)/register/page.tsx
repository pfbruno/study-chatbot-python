"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com";

const AUTH_TOKEN_KEY = "studypro_auth_token";
const AUTH_USER_KEY = "studypro_auth_user";

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
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
        error instanceof Error
          ? error.message
          : "Erro inesperado ao criar a conta."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <Link href="/" className="text-sm font-semibold text-emerald-300">
            StudyPro
          </Link>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Cadastro
            </p>

            <h1 className="text-4xl font-semibold tracking-tight">
              Criar sua conta
            </h1>

            <p className="max-w-xl text-base leading-7 text-neutral-300">
              Cadastre-se para salvar sua conta, controlar o plano atual e
              liberar o fluxo de upgrade para o PRO.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              title="Conta pronta para upgrade"
              description="Seu cadastro já fica preparado para ativação automática do plano PRO após o checkout."
            />
            <FeatureCard
              title="Acesso aos simulados"
              description="Entre na plataforma, acompanhe seus limites e gerencie a experiência de estudos."
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold">Cadastro</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Preencha os dados abaixo para criar sua conta.
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
                placeholder="Crie uma senha"
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
                placeholder="Digite novamente sua senha"
              />
            </FieldBlock>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
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

          <p className="mt-6 text-sm text-neutral-400">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-emerald-300">
              Entrar
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function RegisterPageFallback() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <Link href="/" className="text-sm font-semibold text-emerald-300">
            StudyPro
          </Link>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Cadastro
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">
              Criar sua conta
            </h1>
            <p className="max-w-xl text-base leading-7 text-neutral-300">
              Carregando página de cadastro...
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold">Cadastro</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Preparando formulário...
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-300">{description}</p>
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
    <label className="block space-y-2">
      <span className="text-sm font-medium text-neutral-200">{label}</span>
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