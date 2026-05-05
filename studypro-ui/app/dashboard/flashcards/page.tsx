"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react"

import { getLatestGeneratedContent } from "@/lib/generated-content-client"
import type { ReviewCard } from "@/lib/review-content"

const REVIEW_FLASHCARDS_KEY = "MinhAprovação_review_flashcards"

export default function FlashcardsPage() {
  const [cards, setCards] = useState<ReviewCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [sourceLabel, setSourceLabel] = useState("")

  useEffect(() => {
    async function loadCards() {
      try {
        const raw = localStorage.getItem(REVIEW_FLASHCARDS_KEY)

        if (raw) {
          const parsed = JSON.parse(raw) as ReviewCard[]

          if (Array.isArray(parsed) && parsed.length > 0) {
            setCards(parsed)
            setSourceLabel("Carregado do conteÃºdo gerado nesta sessÃ£o.")
            return
          }
        }

        const persisted = await getLatestGeneratedContent<ReviewCard[]>("flashcards")
        const payload = persisted?.item?.payload

        if (!Array.isArray(payload) || payload.length === 0) {
          setLoadError("Nenhum flashcard de revisÃ£o foi encontrado.")
          return
        }

        setCards(payload)
        setSourceLabel("Carregado do conteÃºdo salvo na sua conta.")
      } catch {
        setLoadError("Nenhum flashcard de revisÃ£o foi encontrado.")
      }
    }

    void loadCards()
  }, [])

  const currentCard = cards[currentIndex] ?? null

  const progressLabel = useMemo(() => {
    if (cards.length === 0) return "0/0"
    return `${currentIndex + 1}/${cards.length}`
  }, [cards.length, currentIndex])

  function handlePrev() {
    if (currentIndex === 0) return
    setCurrentIndex((prev) => prev - 1)
    setShowBack(false)
  }

  function handleNext() {
    if (currentIndex >= cards.length - 1) return
    setCurrentIndex((prev) => prev + 1)
    setShowBack(false)
  }

  function handleRestart() {
    setCurrentIndex(0)
    setShowBack(false)
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-rose-500/20 bg-rose-500/10 p-6">
          <h1 className="text-2xl font-semibold text-white">
            Flashcards nÃ£o encontrados
          </h1>
          <p className="mt-3 text-sm text-rose-100">{loadError}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/simulados"
              className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
            >
              Voltar para simulados
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Ir para o dashboard
            </Link>
          </div>
        </section>
      </div>
    )
  }

  if (!currentCard) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-[#071225] p-6 text-sm text-slate-300">
        Carregando flashcards...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <Brain className="size-4" />
              Flashcards de estudo
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
              Flashcards de revisÃ£o do seu simulado
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              CartÃµes curtos para memorizaÃ§Ã£o direta: frente com a pergunta ou
              conceito, verso com a resposta objetiva.
            </p>

            {sourceLabel ? (
              <p className="mt-4 text-sm text-slate-400">{sourceLabel}</p>
            ) : null}
          </div>

          <div className="w-full xl:max-w-[320px]">
            <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <p className="text-sm text-slate-400">Progresso</p>
              <div className="mt-2 text-3xl font-bold text-white">
                {progressLabel}
              </div>
              <p className="mt-3 text-sm text-slate-300">
                {cards.length} flashcard(s) disponÃ­veis para revisÃ£o
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Disciplina</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {currentCard.subject}
              </h2>
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-400">QuestÃ£o</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {currentCard.questionNumber}
              </h2>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-[#020b18] p-6">
            <p className="text-sm text-slate-400">
              {showBack ? "Verso" : "Frente"}
            </p>

            <div className="mt-4 min-h-[220px] text-lg leading-9 text-slate-100 whitespace-pre-line">
              {showBack ? currentCard.back : currentCard.front}
            </div>

            <button
              type="button"
              onClick={() => setShowBack((prev) => !prev)}
              className="mt-6 rounded-2xl bg-[#2f7cff] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {showBack ? "Ver frente" : "Virar cartÃ£o"}
            </button>
          </div>
        </article>

        <aside className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
              <BookOpen className="size-5 text-blue-300" />
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white">
                Controles de revisÃ£o
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Navegue pelos cartÃµes e repita atÃ© fixar o conteÃºdo.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="size-4" />
              Anterior
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= cards.length - 1}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              PrÃ³ximo
              <ChevronRight className="size-4" />
            </button>

            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
            >
              <RotateCcw className="size-4" />
              Reiniciar revisÃ£o
            </button>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-sm leading-7 text-slate-300">
            Use estes cartÃµes como vocÃª usaria um flashcard feito Ã  mÃ£o: leia a
            frente, tente responder mentalmente e sÃ³ depois vire o cartÃ£o.
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/dashboard/simulados/resultado"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="size-4" />
              Voltar ao resultado
            </Link>

            <Link
              href="/dashboard/simulados"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Ir para simulados
            </Link>
          </div>
        </aside>
      </section>
    </div>
  )
}
