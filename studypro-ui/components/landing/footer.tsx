import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">StudyPro</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link href="#funcionalidades" className="transition-colors hover:text-foreground">
              Funcionalidades
            </Link>
            <Link href="#planos" className="transition-colors hover:text-foreground">
              Planos
            </Link>
            <Link href="/login" className="transition-colors hover:text-foreground">
              Entrar
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} StudyPro. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
