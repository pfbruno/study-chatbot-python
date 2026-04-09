import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function PerfilPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Perfil</h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie suas informações pessoais
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Card */}
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                JS
              </div>
              <h2 className="mt-4 text-xl font-semibold">João Silva</h2>
              <p className="text-sm text-muted-foreground">joao@email.com</p>
              <Badge className="mt-3 bg-primary/10 text-primary hover:bg-primary/20">
                Premium
              </Badge>
              <div className="mt-6 w-full border-t border-border/50 pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-xs text-muted-foreground">Provas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">73%</p>
                    <p className="text-xs text-muted-foreground">Acerto</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="border-border/50 bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  defaultValue="João Silva"
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="joao@email.com"
                  className="bg-secondary/50"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">Escola/Cursinho</Label>
                <Input
                  id="school"
                  placeholder="Nome da instituição"
                  className="bg-secondary/50"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button className="bg-primary hover:bg-primary/90">
                Salvar alterações
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card className="border-border/50 bg-card lg:col-span-3">
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Plano Premium</span>
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    Ativo
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Renovação automática em 15/02/2026
                </p>
              </div>
              <Button variant="outline">Gerenciar assinatura</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
