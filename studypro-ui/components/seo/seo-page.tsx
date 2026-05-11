import Link from "next/link"

type SeoPageProps = {
  badge: string
  title: string
  description: string
  sections: {
    title: string
    content: string
  }[]
  ctaTitle?: string
  ctaDescription?: string
}

export function SeoPage({
  badge,
  title,
  description,
  sections,
  ctaTitle = "Comece a estudar com mais direção",
  ctaDescription = "Teste gratuitamente o MinhAprovação e use questões, simulados, provas e correção inteligente para entender seus erros.",
}: SeoPageProps) {
  return (
    <main className="min-h-screen bg-[#050b16] text-white">
      <section className="mx-auto flex max-w-5xl flex-col px-6 py-16 sm:px-8 lg:py-24">
        <Link href="/" className="mb-10 inline-flex items-center gap-3">
          <img
            src="/logo.png"
            alt="MinhAprovação"
            className="h-12 w-12 object-contain"
          />
          <div>
            <p className="text-lg font-bold leading-none">MinhAprovação</p>
            <p className="mt-1 text-sm text-slate-400">
              Estudo com IA e correção inteligente
            </p>
          </div>
        </Link>

        <div className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_20px_80px_-40px_rgba(47,124,255,0.75)] sm:p-10">
          <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
            {badge}
          </div>

          <h1 className="mt-8 max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {title}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            {description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex justify-center rounded-2xl bg-[#2f7cff] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Começar grátis
            </Link>

            <Link
              href="/login"
              className="inline-flex justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Entrar na plataforma
            </Link>
          </div>
        </div>

        <section className="mt-10 grid gap-5">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6"
            >
              <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                {section.content}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-[32px] border border-blue-400/20 bg-blue-500/10 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">{ctaTitle}</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
            {ctaDescription}
          </p>

          <Link
            href="/register"
            className="mt-6 inline-flex rounded-2xl bg-white px-6 py-3 text-sm font-bold text-[#071225] transition hover:opacity-90"
          >
            Testar gratuitamente
          </Link>
        </section>
      </section>
    </main>
  )
}
