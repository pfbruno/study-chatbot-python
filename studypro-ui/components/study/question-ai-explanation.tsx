"use client"

import { useState } from "react"
import { Brain, ExternalLink, Loader2, Sparkles } from "lucide-react"

import {
  generateQuestionExplanation,
  type QuestionExplanationItem,
  type QuestionExplanationPayload,
} from "@/lib/question-explanations-client"

type QuestionAIExplanationProps = {
  payload: QuestionExplanationPayload
}

export function QuestionAIExplanation({ payload }: QuestionAIExplanationProps) {
  const [item, setItem] = useState<QuestionExplanationItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleGenerate() {
    try {
      setLoading(true)
      setError("")

      const response = await generateQuestionExplanation(payload)
      setItem(response.item)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível gerar a explicação."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-5 rounded-[22px] border border-blue-500/20 bg-blue-500/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
            <Brain className="size-5" />
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white">
              Explicação da IA
            </h4>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Gere uma explicação individual para entender o erro desta questão.
            </p>
          </div>
        </div>

        {!item ? (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#2f7cff] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {loading ? "Gerando..." : "Gerar explicação"}
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {item ? (
        <div className="mt-5 space-y-5">
          <div className="rounded-2xl border border-white/10 bg-[#020b18] p-5">
            <p className="whitespace-pre-line text-sm leading-7 text-slate-200">
              {item.explanation_text}
            </p>
          </div>

          {item.sources.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#020b18] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
                Fontes confiáveis para aprofundamento
              </p>

              <div className="mt-4 space-y-3">
                {item.sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    <span>
                      <span className="block font-semibold text-white">
                        {source.title}
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {source.publisher}
                      </span>
                    </span>

                    <ExternalLink className="mt-1 size-4 shrink-0 text-blue-300" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}