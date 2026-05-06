"use client"

import { Fragment, useState } from "react"
import {
  Brain,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react"

import {
  generateQuestionExplanation,
  type QuestionExplanationItem,
  type QuestionExplanationPayload,
} from "@/lib/question-explanations-client"

type QuestionAIExplanationProps = {
  payload: QuestionExplanationPayload
}

type ParsedExplanationSection = {
  id: string
  title: string
  lines: string[]
}

function normalizeExplanationText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\*{4,}n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function cleanInlineText(value: string) {
  return value
    .replace(/\\\((.*?)\\\)/g, "$1")
    .replace(/\\\[(.*?)\\\]/g, "$1")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ")
    .replace(/\\quad/g, " ")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

function cleanMathText(value: string) {
  return cleanInlineText(value)
    .replace(/^\\\[/, "")
    .replace(/\\\]$/, "")
    .replace(/^\\\(/, "")
    .replace(/\\\)$/, "")
    .replace(/\{([^{}]*)\}/g, "$1")
    .trim()
}

function parseExplanationSections(text: string): ParsedExplanationSection[] {
  const normalized = normalizeExplanationText(text)
  const lines = normalized.split("\n")

  const sections: ParsedExplanationSection[] = []
  let current: ParsedExplanationSection | null = null

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const headingMatch = line
      .trim()
      .match(/^\*\*\s*(\d+)\.\s+(.+?)\s*\*\*$/)

    if (headingMatch) {
      current = {
        id: headingMatch[1],
        title: cleanInlineText(headingMatch[2]),
        lines: [],
      }

      sections.push(current)
      continue
    }

    if (!current) {
      current = {
        id: "intro",
        title: "Explicação",
        lines: [],
      }

      sections.push(current)
    }

    current.lines.push(line)
  }

  return sections.filter(
    (section) =>
      section.title.trim().length > 0 ||
      section.lines.some((line) => line.trim().length > 0)
  )
}

function renderInlineText(value: string) {
  const normalized = cleanInlineText(value)
  const parts = normalized.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (!part) return null

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-white">
          {cleanInlineText(part.slice(2, -2))}
        </strong>
      )
    }

    return <Fragment key={`${part}-${index}`}>{part.replace(/\*\*/g, "")}</Fragment>
  })
}

function isMathBoundary(line: string) {
  const trimmed = line.trim()
  return trimmed === "\\[" || trimmed === "\\]" || trimmed === "\\(" || trimmed === "\\)"
}

function isLikelyMathLine(line: string) {
  const trimmed = line.trim()

  if (!trimmed) return false
  if (isMathBoundary(trimmed)) return true
  if (trimmed.startsWith("\\[") || trimmed.endsWith("\\]")) return true
  if (trimmed.startsWith("\\(") || trimmed.endsWith("\\)")) return true

  return (
    /[=+\-×*/]/.test(trimmed) &&
    /[a-zA-Z0-9_{}\\]/.test(trimmed) &&
    trimmed.length <= 160
  )
}

function renderLines(lines: string[]) {
  const elements: JSX.Element[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? ""

    if (!line) {
      index += 1
      continue
    }

    if (isMathBoundary(line)) {
      index += 1
      continue
    }

    if (isLikelyMathLine(line)) {
      const mathLines: string[] = []

      while (index < lines.length) {
        const current = lines[index]?.trim() ?? ""

        if (!current) break

        if (isMathBoundary(current)) {
          index += 1
          continue
        }

        if (!isLikelyMathLine(current)) break

        mathLines.push(cleanMathText(current))
        index += 1
      }

      if (mathLines.length > 0) {
        elements.push(
          <div
            key={`math-${index}-${mathLines.join("-")}`}
            className="my-4 overflow-x-auto rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-3"
          >
            <pre className="whitespace-pre-wrap text-sm font-semibold leading-7 text-blue-100">
              {mathLines.join("\n")}
            </pre>
          </div>
        )
      }

      continue
    }

    if (line.startsWith("- ")) {
      const items: string[] = []

      while (index < lines.length) {
        const current = lines[index]?.trim() ?? ""

        if (!current.startsWith("- ")) break

        items.push(current.slice(2))
        index += 1
      }

      elements.push(
        <ul
          key={`ul-${index}-${items.length}`}
          className="my-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        >
          {items.map((item, itemIndex) => (
            <li
              key={`${item}-${itemIndex}`}
              className="flex gap-3 text-sm leading-7 text-slate-200"
            >
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-300" />
              <span>{renderInlineText(item)}</span>
            </li>
          ))}
        </ul>
      )

      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []

      while (index < lines.length) {
        const current = lines[index]?.trim() ?? ""

        if (!/^\d+\.\s+/.test(current)) break

        items.push(current.replace(/^\d+\.\s+/, ""))
        index += 1
      }

      elements.push(
        <ol
          key={`ol-${index}-${items.length}`}
          className="my-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        >
          {items.map((item, itemIndex) => (
            <li
              key={`${item}-${itemIndex}`}
              className="grid grid-cols-[auto_1fr] gap-3 text-sm leading-7 text-slate-200"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-200">
                {itemIndex + 1}
              </span>
              <span>{renderInlineText(item)}</span>
            </li>
          ))}
        </ol>
      )

      continue
    }

    const paragraphLines = [line]
    index += 1

    while (index < lines.length) {
      const current = lines[index]?.trim() ?? ""

      if (
        !current ||
        current.startsWith("- ") ||
        /^\d+\.\s+/.test(current) ||
        isLikelyMathLine(current) ||
        isMathBoundary(current) ||
        current.match(/^\*\*\s*(\d+)\.\s+(.+?)\s*\*\*$/)
      ) {
        break
      }

      paragraphLines.push(current)
      index += 1
    }

    elements.push(
      <p
        key={`p-${index}-${paragraphLines.join("-")}`}
        className="my-3 text-sm leading-7 text-slate-200"
      >
        {renderInlineText(paragraphLines.join(" "))}
      </p>
    )
  }

  return elements
}

function getSectionBadgeColor(index: number) {
  const colors = [
    "border-blue-400/30 bg-blue-400/10 text-blue-200",
    "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
    "border-amber-400/30 bg-amber-400/10 text-amber-200",
    "border-rose-400/30 bg-rose-400/10 text-rose-200",
    "border-violet-400/30 bg-violet-400/10 text-violet-200",
  ]

  return colors[index % colors.length]
}

function FormattedExplanation({ text }: { text: string }) {
  const sections = parseExplanationSections(text)

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <section
          key={`${section.id}-${section.title}`}
          className="rounded-2xl border border-white/10 bg-[#020b18] p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${getSectionBadgeColor(
                index
              )}`}
            >
              {section.id === "intro" ? "IA" : section.id}
            </span>

            <h5 className="text-base font-semibold text-white">
              {section.title}
            </h5>
          </div>

          <div>{renderLines(section.lines)}</div>
        </section>
      ))}
    </div>
  )
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
          <FormattedExplanation text={item.explanation_text} />

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