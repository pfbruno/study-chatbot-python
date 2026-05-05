"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { FormEvent, Suspense, useMemo, useState } from "react"
import { BookOpen, Eye, EyeOff, Lock, Mail, User } from "lucide-react"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

const inputClassName =
  "h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-primary/60 focus:bg-white/[0.07]"

function safeDecodeError(text: string): string {
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed?.detail === "string") return parsed.detail
    if (typeof parsed?.message === "string") return parsed.message
    return text || "NÃ£o foi possÃ­vel criar a conta."
  } catch {
    return text || "NÃ£o foi possÃ­vel criar a conta."
  }
}

async function safeReadError(response: Response) {
  try {
    const text = await response.text()
    return safeDecodeError(text)
  } catch {
    return "NÃ£o foi possÃ­vel criar a conta."
  }
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando...</div>}>
      <RegisterPageContent />
    </Suspense>
  )
}

function RegisterPageContent() {
  const searchParams = useSearchParams()

  const redirectTo = useMemo(
    () => searchParams.get("redirect") || "/login",
    [searchParams]
  )

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [createdEmail, setCreatedEmail] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (password !== confirmPassword) {
      setErrorMessage("As senhas nÃ£o coincidem.")
      return
    }

    setIsSubmitting(true)

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
      })

      if (!registerResponse.ok) {
        throw new Error(
          (await safeReadError(registerResponse)) || "NÃ£o foi possÃ­vel criar a conta."
        )
      }

      const data = await registerResponse.json()

      setCreatedEmail(email)
      setSuccessMessage(
        data?.message ||
          "Conta criada com sucesso. Verifique seu e-mail para confirmar o cadastro antes de entrar."
      )

      setName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao criar conta."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="glass-panel hidden rounded-[32px] border-white/10 p-8 lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            <BookOpen className="size-4 text-primary" />
            MinhAprovação
          </div>

          <h1 className="mt-8 max-w-xl text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            Comece sua jornada para a{" "}
            <span className="text-gradient">evoluÃ§Ã£o</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
            Organize estudos, acompanhe desempenho e evolua com uma experiÃªncia
            visual pensada para o fluxo real do aluno.
          </p>

          <ul className="mt-10 space-y-4">
            {[
              "Simulados com banco oficial de questÃµes",
              "Dashboard com evoluÃ§Ã£o por disciplina",
              "Upgrade fÃ¡cil para plano Pro com Mercado Pago",
              "RecomendaÃ§Ãµes inteligentes para revisÃ£o",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                <div className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-accent/15 text-accent">
                  âœ“
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
          <p className="text-sm text-muted-foreground">ExperiÃªncia orientada a dados</p>
          <p className="mt-3 text-lg font-semibold text-white">
            Crie sua conta e transforme estudo em rotina orientada por desempenho.
          </p>
        </div>
      </section>

      <section className="glass-panel w-full rounded-[32px] border-white/10 p-6 sm:p-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 lg:hidden">
              <BookOpen className="size-4 text-primary" />
              MinhAprovação
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-white">
              Criar conta
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              JÃ¡ possui conta?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </div>

          {successMessage ? (
            <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
              <p>{successMessage}</p>
              {createdEmail ? (
                <p className="mt-2 text-emerald-200">
                  E-mail cadastrado: <span className="font-semibold">{createdEmail}</span>
                </p>
              ) : null}
              <div className="mt-4">
                <Link
                  href={redirectTo}
                  className="inline-flex rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black"
                >
                  Ir para login
                </Link>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-white">
                Nome
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome"
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-white">
                E-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu@email.com"
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-white">
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Crie uma senha"
                  className={`${inputClassName} pr-12`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-white"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-white"
              >
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirme sua senha"
                  className={`${inputClassName} pr-12`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-white"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_16px_50px_-18px_rgba(59,130,246,0.85)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Criando conta..." : "Criar conta"}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
