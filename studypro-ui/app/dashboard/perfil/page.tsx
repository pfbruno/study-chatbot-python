"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { CreditCard, Mail, ShieldCheck, User2 } from "lucide-react"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

const AUTH_TOKEN_KEY = "studypro_auth_token"
const AUTH_USER_KEY = "studypro_auth_user"

type AuthUser = {
  id: number
  name: string
  email: string
  plan: "free" | "pro"
  is_active: boolean
  created_at: string
  updated_at: string
}

type AuthMeResponse = {
  user: AuthUser
  usage: {
    scope: "user"
    plan: "free" | "pro"
    usage_date: string
    simulations_generated_today: number
    daily_limit: number | null
    remaining_today: number | null
    can_generate: boolean
  }
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"

export default function PerfilPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      const storedUser = localStorage.getItem(AUTH_USER_KEY)

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser) as AuthUser)
        } catch {
          localStorage.removeItem(AUTH_USER_KEY)
        }
      }

      if (!token) {
        setIsLoading(false)
        setErrorMessage("Faça login para visualizar seu perfil.")
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        })

        if (!response.ok) {
          const message = await safeReadError(response)
          throw new Error(message || "Não foi possível carregar seu perfil.")
        }

        const data: AuthMeResponse = await response.json()
        setUser(data.user)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro inesperado ao carregar o perfil."
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const initials = useMemo(() => {
    if (!user?.name) return "SP"

    const parts = user.name.trim().split(/\s+/).filter(Boolean)
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
  }, [user])

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-[24px] border border-white/10 bg-white/5 text-xl font-semibold text-white">
                {isLoading ? "..." : initials}
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Perfil do aluno</p>
                <h1 className="mt-1 text-2xl font-semibold text-white">
                  {isLoading ? "Carregando..." : user?.name || "Usuário"}
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                  {isLoading ? "Carregando e-mail..." : user?.email || "—"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-muted-foreground">Plano</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {user?.plan === "pro" ? "Premium" : "Free"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {user?.is_active ? "Ativo" : "Inativo"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-muted-foreground">Visão geral</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Gerencie suas informações
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Esta etapa moderniza a interface do perfil, mantendo o consumo real
              da rota `/auth/me` já usada pelo projeto.
            </p>

            {errorMessage ? (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-[32px] p-6">
          <h2 className="text-2xl font-semibold text-white">
            Informações pessoais
          </h2>

          <div className="mt-6 grid gap-5">
            <FieldBlock label="Nome" icon={<User2 className="size-4 text-primary" />}>
              <input
                className={inputClassName}
                value={user?.name ?? ""}
                readOnly
                placeholder="Nome do usuário"
              />
            </FieldBlock>

            <FieldBlock label="E-mail" icon={<Mail className="size-4 text-primary" />}>
              <input
                className={inputClassName}
                value={user?.email ?? ""}
                readOnly
                placeholder="E-mail do usuário"
              />
            </FieldBlock>

            <FieldBlock
              label="Situação da conta"
              icon={<ShieldCheck className="size-4 text-primary" />}
            >
              <input
                className={inputClassName}
                value={user?.is_active ? "Conta ativa" : "Conta inativa"}
                readOnly
              />
            </FieldBlock>
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-6">
          <h2 className="text-2xl font-semibold text-white">Assinatura</h2>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <CreditCard className="size-5 text-primary" />
              </div>

              <div>
                <p className="text-lg font-semibold text-white">
                  {user?.plan === "pro" ? "Plano Premium" : "Plano Free"}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {user?.plan === "pro"
                    ? "Seu acesso PRO está ativo."
                    : "Seu acesso atual é Free. Faça upgrade para liberar uso ilimitado."}
                </p>
              </div>
            </div>

            <Link
              href="/pricing"
              className="mt-6 inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
            >
              {user?.plan === "pro" ? "Gerenciar assinatura" : "Fazer upgrade"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function FieldBlock({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  )
}

async function safeReadError(response: Response): Promise<string> {
  try {
    const data = await response.json()

    if (typeof data?.detail === "string") {
      return data.detail
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: unknown) => {
          if (typeof item === "string") return item
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: string }).msg)
          }
          return "Erro de validação."
        })
        .join(" | ")
    }

    return "Erro na requisição."
  } catch {
    return "Erro na requisição."
  }
}
