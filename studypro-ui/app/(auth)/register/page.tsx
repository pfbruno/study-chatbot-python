"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate registration
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push("/dashboard")
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border/50 bg-card p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Crie sua conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Comece a estudar e conquiste sua vaga
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome"
              required
              className="h-11 bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              required
              className="h-11 bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              className="h-11 bg-secondary/50"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full bg-primary hover:bg-primary/90"
          >
            {loading ? <Spinner className="h-5 w-5" /> : "Criar conta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao criar uma conta, você concorda com nossos{" "}
          <Link href="#" className="text-primary hover:underline">
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link href="#" className="text-primary hover:underline">
            Política de Privacidade
          </Link>
        </p>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  )
}
