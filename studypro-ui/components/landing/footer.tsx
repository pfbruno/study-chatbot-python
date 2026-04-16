import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-12">
      <div className="container-shell">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
                <BookOpen className="size-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">StudyPro</p>
                <p className="text-sm text-muted-foreground">
                  Plataforma inteligente de estudos
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              Experiência focada no aluno, com navegação mais clara, leitura
              rápida de desempenho e fluxo de estudo mais consistente.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
              Produto
            </h4>
            <div className="mt-4 flex flex-col gap-3">
              <Link href="#funcionalidades" className="text-sm text-muted-foreground hover:text-white">
                Funcionalidades
              </Link>
              <Link href="#como-funciona" className="text-sm text-muted-foreground hover:text-white">
                Como funciona
              </Link>
              <Link href="#planos" className="text-sm text-muted-foreground hover:text-white">
                Planos
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
              Acesso
            </h4>
            <div className="mt-4 flex flex-col gap-3">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-white">
                Entrar
              </Link>
              <Link href="/register" className="text-sm text-muted-foreground hover:text-white">
                Criar conta
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-white">
                Assinatura
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} StudyPro. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}