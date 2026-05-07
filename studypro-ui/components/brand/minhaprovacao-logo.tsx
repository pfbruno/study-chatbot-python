import Image from "next/image"
import Link from "next/link"

type MinhAprovacaoLogoProps = {
  href?: string
  size?: number
  titleClassName?: string
  subtitleClassName?: string
  className?: string
  showSubtitle?: boolean
  subtitle?: string
}

export function MinhAprovacaoLogo({
  href = "/",
  size = 52,
  titleClassName = "text-white text-[1.75rem] font-bold leading-none",
  subtitleClassName = "mt-1 text-sm text-slate-300",
  className = "",
  showSubtitle = true,
  subtitle = "Plataforma inteligente de estudos",
}: MinhAprovacaoLogoProps) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/logo.png"
        alt="Logo MinhAprovação"
        width={size}
        height={size}
        priority
        className="shrink-0 object-contain"
      />

      <div className="min-w-0">
        <div className={titleClassName}>MinhAprovação</div>

        {showSubtitle ? (
          <p className={subtitleClassName}>{subtitle}</p>
        ) : null}
      </div>
    </div>
  )

  if (!href) {
    return content
  }

  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  )
}