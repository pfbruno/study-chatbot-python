"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Menu, X } from "lucide-react"
import { useState } from "react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">StudyPro</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#funcionalidades" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Funcionalidades
          </Link>
          <Link href="#planos" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Planos
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/register">Começar agora</Link>
          </Button>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border/50 bg-background md:hidden">
          <div className="flex flex-col gap-4 px-4 py-4">
            <Link href="#funcionalidades" className="text-sm text-muted-foreground">
              Funcionalidades
            </Link>
            <Link href="#planos" className="text-sm text-muted-foreground">
              Planos
            </Link>
            <div className="flex flex-col gap-2 pt-4">
              <Button variant="ghost" asChild className="w-full justify-center">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild className="w-full justify-center bg-primary">
                <Link href="/register">Começar agora</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
