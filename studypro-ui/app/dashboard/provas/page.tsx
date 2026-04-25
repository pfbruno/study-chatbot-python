"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  BookOpen,
  FileText,
  GraduationCap,
  Loader2,
  Sparkles,
  Trophy,
} from "lucide-react"

import {
  AUTH_TOKEN_KEY,
  getExamYears,
  getSimulationEntitlement,
  type SimulationEntitlementResponse,
} from "@/lib/api"

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#081224] p-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-bold text-white">{value}</div>
    </div>
  )
}

function PlanStatusCard({
  entitlement,
  loading,
}: {
  entitlement: SimulationEntitlementResponse | null
  loading: boolean
}) {
  const isPro = entitlement?.entitlements.is_pro ?? false
  const remaining = entitlement?.usage.remaining_today
  const dailyLimit = entitlement?.usage.daily_limit

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#081224] p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
          <Sparkles className="size-4 text-blue-300" />
        </div>

        <div>
          <p className="text-sm text-slate-400">Plano atual</p>
          <h3 className="text-lg font-semibold text-white">
            {loading
              ? "Carregando..."
              : isPro
              ? "PRO ativo"
              : typeof remaining === "number" && typeof dailyLimit === "number"
              ? `FREE · ${remaining}/${dailyLimit} geração(ões) restantes`
              : "FREE"}
          </h3>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-300">
        {loading
          ? "Verificando seu acesso atual."
          : isPro
          ? "Seu plano já está pronto para estudar com continuidade, mais prática e menos fricção."
          : "As provas oficiais já estão disponíveis. O Pro amplia seu fluxo de treino e reduz interrupções ao longo da preparação."}
      </p>

      {!isPro ? (
        <div className="mt-4">
          <Link
            href="/pricing"
            className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
          >
            Ver plano Pro
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export default function ProvasPage() {
  const [yearsCount, setYearsCount] = useState(9)
  const [loadingYears, setLoadingYears] = useState(true)

  const [entitlement, setEntitlement] =
    useState<SimulationEntitlementResponse | null>(null)
  const [loadingEntitlement, setLoadingEntitlement] = useState(true)

  useEffect(() => {
    async function loadYears() {
      try {
        setLoadingYears(true)
        const data = await getExamYears()

        if (Array.isArray(data?.years) && data.years.length > 0) {
          setYearsCount(data.years.length)
        } else {
          setYearsCount(9)
        }
      } catch {
        setYearsCount(9)
      } finally {
        setLoadingYears(false)
      }
    }

    void loadYears()
  }, [])

  useEffect(() => {
    async function loadEntitlement() {
      try {
        setLoadingEntitlement(true)
        const token = localStorage.getItem(AUTH_TOKEN_KEY)
        const data = await getSimulationEntitlement(token)
        setEntitlement(data)
      } catch {
        setEntitlement(null)
      } finally {
        setLoadingEntitlement(false)
      }
    }

    void loadEntitlement()
  }, [])

  const totalQuestionsLabel = useMemo(() => {
    return `${yearsCount * 180}+`
  }, [yearsCount])

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(41,98,255,0.18),_rgba(3,11,29,1)_48%,_rgba(8,20,46,1)_100%)] p-8 shadow-[0_10px_50px_-28px_rgba(59,130,246,0.5)]">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2f7cff]/25 bg-[#2f7cff]/10 px-4 py-2 text-sm text-[#79a6ff]">
              <FileText className="size-4" />
              Catálogo oficial
            </div>

            <div className="mt-6 flex items-start gap-4">
              <div className="flex size-16 items-center justify-center rounded-3xl bg-[#0e2347]">
                <BookOpen className="size-7 text-[#4b8df7]" />
              </div>

              <div>
                <h1 className="text-5xl font-bold tracking-tight text-white">
                  Área de Provas
                </h1>
                <p className="mt-4 max-w-3xl text-2xl leading-10 text-[#7ea0d6]">
                  Resolva provas oficiais do ENEM com gabarito, continuidade de
                  estudo e revisão posterior.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <StatCard label="Instituições" value="1" />
              <StatCard
                label="Edições válidas"
                value={loadingYears ? "..." : String(yearsCount)}
              />
              <StatCard label="Total de questões" value={totalQuestionsLabel} />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#030b1d] p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              <GraduationCap className="size-4" />
              Instituição em destaque
            </div>

            <div className="mt-5 text-xs uppercase tracking-[0.16em] text-[#7ea0d6]">
              Exame Nacional do Ensino Médio
            </div>

            <h2 className="mt-2 text-5xl font-bold tracking-tight text-white">
              ENEM
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-300">
              O ENEM é a maior avaliação educacional do Brasil, aplicada
              anualmente pelo INEP. Resolva provas oficiais completas com
              gabarito e análise de desempenho por área de conhecimento.
            </p>

            <div className="mt-6 flex flex-wrap gap-6 text-sm text-[#7ea0d6]">
              <span className="inline-flex items-center gap-2">
                <GraduationCap className="size-4" />
                {loadingYears ? "Carregando..." : `${yearsCount} edições`}
              </span>
              <span className="inline-flex items-center gap-2">
                <Trophy className="size-4" />
                Gabarito oficial
              </span>
            </div>

            <Link
              href="/dashboard/provas/enem"
              className="mt-7 inline-flex items-center justify-center rounded-2xl bg-[#4b8df7] px-6 py-3 text-base font-semibold text-white transition hover:opacity-90"
            >
              Acessar ENEM
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <PlanStatusCard
          entitlement={entitlement}
          loading={loadingEntitlement}
        />

        <div className="rounded-[24px] border border-white/10 bg-[#081224] p-5">
          <h3 className="text-lg font-semibold text-white">
            Catálogo simplificado
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            FUVEST, UNICAMP e UNESP foram removidos temporariamente do catálogo.
            Neste momento, a navegação de provas está focada apenas no ENEM.
          </p>

          <div className="mt-4">
            <Link
              href="/dashboard/provas/enem"
              className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Ir para as provas do ENEM
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}