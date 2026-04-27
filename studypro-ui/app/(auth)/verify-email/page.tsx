"use client"

import Link from "next/link"
import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, MailWarning, ShieldCheck } from "lucide-react"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailPageContent />
    </Suspense>
  )
}

function VerifyEmailPageContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function run() {
      if (!token) {
        setLoading(false)
        setSuccess(false)
        setMessage("Token de verificação ausente.")
        return
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
          }
        )

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          setSuccess(false)
          setMessage(
            data?.detail ||
              "Não foi possível confirmar seu e-mail. Solicite um novo link."
          )
          return
        }

        setSuccess(true)
        setMessage(
          data?.message || "E-mail confirmado com sucesso. Sua conta já está pronta para uso."
        )
      } catch {
        setSuccess(false)
        setMessage("Erro inesperado ao confirmar seu e-mail.")
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [token])

  const title = useMemo(() => {
    if (loading) return "Confirmando seu e-mail"
    return success ? "E-mail confirmado" : "Falha na confirmação"
  }, [loading, success])

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            <ShieldCheck className="size-4 text-primary" />
            Verificação de e-mail
          </div>

          <div className="mt-6 flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {loading ? (
                <Loader2 className="size-7 animate-spin" />
              ) : success ? (
                <CheckCircle2 className="size-7" />
              ) : (
                <MailWarning className="size-7" />
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="mt-3 text-base leading-8 text-slate-300">{message}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
            >
              Ir para login
            </Link>

            <Link
              href="/register"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Voltar para cadastro
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

function VerifyEmailFallback() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="size-5 animate-spin" />
            Carregando verificação...
          </div>
        </div>
      </div>
    </main>
  )
}