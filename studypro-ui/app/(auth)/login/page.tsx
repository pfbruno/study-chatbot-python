"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, ReactNode, Suspense, useMemo, useState } from "react"
import { BookOpen, Lock, Mail } from "lucide-react"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

const AUTH_TOKEN_KEY = "studypro_auth_token"
const AUTH_USER_KEY = "studypro_auth_user"

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback title="Entrar na sua conta" description="Carregando página de login..." />}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirectTo = useMemo(() => searchParams.get("redirect") || "/dashboard", [searchParams])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error((await safeReadError(response)) || "Não foi possível realizar o login.")
      }

      const data = await response.json()
      localStorage.setItem(AUTH_TOKEN_KEY, data.access_token)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
      router.push(redirectTo)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro inesperado ao realizar login.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden border-r border-white/10 lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-cyan-500/20" />
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative z-10 m-auto max-w-lg space-y-6 px-10">
            <Link href="/" className="inline-flex items-center gap-2 text-emerald-300">
              <BookOpen className="h-6 w-6" />
              <span className="text-xl font-semibold">StudyPro</span>
            </Link>
            <h1 className="text-4xl font-semibold leading-tight">
              Volte para a plataforma e acompanhe seu progresso com mais clareza.
            </h1>
            <p className="text-neutral-300">
              Simulados, histórico e evolução reunidos em uma experiência SaaS moderna,
              sem métricas infladas e com foco real no estudo.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Provas", value: "Oficiais" },
                { label: "Plano", value: "Free + Pro" },
                { label: "Foco", value: "Desempenho" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-lg font-semibold text-emerald-300">{item.value}</p>
                  <p className="text-xs text-neutral-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30">
            <h2 className="text-2xl font-semibold">Entrar</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Não tem conta? <Link href="/register" className="text-emerald-300">Criar agora</Link>
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Field icon={<Mail className="h-4 w-4 text-neutral-400" />}>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={inputClassName} />
              </Field>
              <Field icon={<Lock className="h-4 w-4 text-neutral-400" />}>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" className={inputClassName} />
              </Field>

              {errorMessage ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{errorMessage}</div> : null}

              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-black hover:brightness-95 disabled:opacity-60">
                {isSubmitting ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
      {children}
    </div>
  )
}

function AuthFallback({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-neutral-400">{description}</p>
      </div>
    </main>
  )
}

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-neutral-950 py-3 pr-4 pl-10 text-sm text-white outline-none transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"

async function safeReadError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data?.detail === "string") return data.detail
    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: unknown) => {
          if (typeof item === "string") return item
          if (item && typeof item === "object" && "msg" in item) return String((item as { msg: string }).msg)
          return "Erro de validação."
        })
        .join(" | ")
    }
    return "Erro na requisição."
  } catch {
    return "Erro na requisição."
  }
}