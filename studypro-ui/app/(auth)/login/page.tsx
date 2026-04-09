"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate login
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push("/dashboard")
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border/50 bg-card p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre na sua conta para continuar estudando
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
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
            {loading ? <Spinner className="h-5 w-5" /> : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  )
}
