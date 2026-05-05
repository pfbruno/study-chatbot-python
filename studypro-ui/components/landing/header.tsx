"use client"

import Link from "next/link"
import { useState } from "react"
import { BookOpen, Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"

const navItems = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="container-shell">
        <div className="flex h-18 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <BookOpen className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-white">
                MinhAprovação
              </span>
              <span className="text-xs text-muted-foreground">
                Plataforma inteligente de estudos
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button
              asChild
              variant="ghost"
              className="text-sm text-muted-foreground hover:bg-white/5 hover:text-white"
            >
              <Link href="/login">Entrar</Link>
            </Button>

            <Button
              asChild
              className="rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_12px_40px_-16px_rgba(59,130,246,0.85)]"
            >
              <Link href="/register">Criar conta</Link>
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white md:hidden"
            aria-label="Abrir menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/10 py-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-3 grid gap-3">
                <Button asChild variant="outline" className="rounded-xl border-white/10 bg-white/5">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Entrar
                  </Link>
                </Button>

                <Button asChild className="rounded-xl">
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    Criar conta
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
