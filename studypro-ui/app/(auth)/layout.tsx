import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-grid opacity-[0.08]" />
      <div className="absolute left-[10%] top-16 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute right-[8%] top-24 -z-10 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />

      <div className="container-shell flex min-h-screen flex-col">
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="MinhAprovação"
              className="size-11 shrink-0 rounded-2xl object-cover ring-1 ring-primary/25"
            />
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-white">
                MinhAprovação
              </span>
              <span className="text-xs text-muted-foreground">
                Plataforma inteligente de estudos
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Voltar ao início
          </Link>
        </header>

        <main className="flex flex-1 items-center py-6 md:py-10">{children}</main>

        <footer className="py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MinhAprovação. Todos os direitos reservados.
        </footer>
      </div>
    </div>
  )
}
