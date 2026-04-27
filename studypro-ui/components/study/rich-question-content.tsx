"use client"

type Segment =
  | { type: "text"; value: string }
  | { type: "image"; url: string }

type RichQuestionContentProps = {
  content: string
  className?: string
  imageClassName?: string
}

const IMAGE_URL_REGEX =
  /(https?:\/\/[^\s)\]]+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s)\]]*)?)/gi

const IMAGE_LABEL_REGEX =
  /\[(?:imagem|image|figura|gráfico|grafico|ilustração|ilustracao)(?:[^\]]*?)?:\s*(https?:\/\/[^\s\]]+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s\]]*)?)\]/gi

function normalizeContent(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(IMAGE_LABEL_REGEX, (_, url: string) => `\n${url}\n`)
    .trim()
}

function isImageOnlyLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false

  const markdownImageMatch = trimmed.match(/^!\[[^\]]*\]\((https?:\/\/[^)]+)\)$/i)
  if (markdownImageMatch) return true

  return /^(https?:\/\/[^\s]+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s]+)?)$/i.test(trimmed)
}

function extractImageUrlFromLine(line: string): string | null {
  const trimmed = line.trim()

  const markdownImageMatch = trimmed.match(/^!\[[^\]]*\]\((https?:\/\/[^)]+)\)$/i)
  if (markdownImageMatch) {
    return markdownImageMatch[1]
  }

  const directUrlMatch = trimmed.match(
    /^(https?:\/\/[^\s]+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s]+)?)$/i
  )
  if (directUrlMatch) {
    return directUrlMatch[1]
  }

  return null
}

function splitInlineImages(text: string): Segment[] {
  const segments: Segment[] = []
  let lastIndex = 0

  for (const match of text.matchAll(IMAGE_URL_REGEX)) {
    const url = match[0]
    const start = match.index ?? 0
    const end = start + url.length

    if (start > lastIndex) {
      const chunk = text.slice(lastIndex, start)
      if (chunk.trim()) {
        segments.push({ type: "text", value: chunk.trim() })
      }
    }

    segments.push({ type: "image", url })
    lastIndex = end
  }

  if (lastIndex < text.length) {
    const chunk = text.slice(lastIndex)
    if (chunk.trim()) {
      segments.push({ type: "text", value: chunk.trim() })
    }
  }

  if (segments.length === 0 && text.trim()) {
    segments.push({ type: "text", value: text.trim() })
  }

  return segments
}

function renderTextWithBreaks(text: string) {
  const lines = text.split("\n")
  return lines.map((line, index) => (
    <span key={`${line}-${index}`}>
      {line}
      {index < lines.length - 1 ? <br /> : null}
    </span>
  ))
}

export function RichQuestionContent({
  content,
  className = "",
  imageClassName = "",
}: RichQuestionContentProps) {
  const normalized = normalizeContent(content)
  const blocks = normalized.split("\n").filter((line, index, array) => {
    if (line.trim()) return true
    const prev = array[index - 1]?.trim()
    const next = array[index + 1]?.trim()
    return Boolean(prev && next)
  })

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {blocks.map((line, index) => {
        if (isImageOnlyLine(line)) {
          const imageUrl = extractImageUrlFromLine(line)
          if (!imageUrl) return null

          return (
            <div key={`img-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-2">
              <img
                src={imageUrl}
                alt={`Ilustração da questão ${index + 1}`}
                className={`max-h-[420px] w-full rounded-xl object-contain ${imageClassName}`.trim()}
                loading="lazy"
              />
            </div>
          )
        }

        const inlineSegments = splitInlineImages(line)

        return (
          <div key={`txt-${index}`} className="space-y-3">
            {inlineSegments.map((segment, segmentIndex) => {
              if (segment.type === "image") {
                return (
                  <div
                    key={`inline-img-${index}-${segmentIndex}`}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-2"
                  >
                    <img
                      src={segment.url}
                      alt={`Imagem incorporada ${segmentIndex + 1}`}
                      className={`max-h-[420px] w-full rounded-xl object-contain ${imageClassName}`.trim()}
                      loading="lazy"
                    />
                  </div>
                )
              }

              return (
                <p
                  key={`inline-text-${index}-${segmentIndex}`}
                  className="text-sm leading-7 text-slate-200"
                >
                  {renderTextWithBreaks(segment.value)}
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}