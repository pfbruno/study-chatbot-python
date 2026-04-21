import { useMemo, useState } from "react";
import { ExamHero } from "@/components/exams/ExamHero";
import { ExamCatalogCard } from "@/components/exams/ExamCatalogCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, GraduationCap, Sparkles, Trophy, Clock, BookOpenCheck, Library } from "lucide-react";
import { institutions, examEditions } from "@/data/mockExams";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

const ExamsCatalog = () => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [order, setOrder] = useState("recent");

  const inProgress = examEditions.find((e) => e.status === "in_progress");
  const completedCount = examEditions.filter((e) => e.status === "completed").length;

  const filtered = useMemo(() => {
    let list = institutions.filter((i) =>
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      i.shortName.toLowerCase().includes(query.toLowerCase())
    );
    if (order === "alphabetic") list = [...list].sort((a, b) => a.shortName.localeCompare(b.shortName));
    if (order === "editions") list = [...list].sort((a, b) => b.totalEditions - a.totalEditions);
    return list;
  }, [query, order]);

  const featured = institutions.find((i) => i.highlight);

  return (
    <div className="space-y-6 max-w-7xl">
      <ExamHero
        title="Área de Provas"
        subtitle="Resolva provas oficiais completas de vestibulares e ENEM, com gabarito, comentários e revisão integrada à sua área de estudo."
        badge="Novo · Catálogo expandido"
        icon={<Library className="w-7 h-7 text-primary" />}
        stats={[
          { label: "Provas oficiais", value: examEditions.length },
          { label: "Instituições", value: institutions.length },
          { label: "Concluídas", value: completedCount },
          { label: "Total de questões", value: "1.5k+" },
        ]}
      />

      {/* Featured + In progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {featured && (
          <Link
            to={`/app/provas/${featured.id}`}
            className="lg:col-span-2 group relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-accent/10 p-6 hover:border-primary/50 transition-all"
          >
            <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                <GraduationCap className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Destaque
                </span>
                <h2 className="font-heading text-2xl font-bold mt-2">{featured.shortName}</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">{featured.longDescription}</p>
                <div className="flex items-center gap-4 mt-4 text-xs">
                  <span className="flex items-center gap-1.5"><BookOpenCheck className="w-4 h-4 text-primary" /> {featured.totalEditions} edições</span>
                  <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-accent" /> Gabarito oficial</span>
                </div>
                <Button className="mt-5 gap-1.5">
                  Explorar provas {featured.shortName}
                </Button>
              </div>
            </div>
          </Link>
        )}

        {inProgress ? (
          <Link
            to={`/app/provas/${inProgress.institutionId}/${inProgress.year}`}
            className="rounded-2xl border border-border/60 bg-card hover:border-accent/40 p-5 transition-all flex flex-col"
          >
            <div className="flex items-center gap-2 text-xs text-accent">
              <Clock className="w-4 h-4" /> Continuar de onde parei
            </div>
            <h3 className="font-heading text-xl font-bold mt-3">{inProgress.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 flex-1">{inProgress.description}</p>
            <div className="space-y-1.5 mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{inProgress.lastAccess}</span>
                <span className="font-semibold">{inProgress.progress}%</span>
              </div>
              <Progress value={inProgress.progress} className="h-1.5" />
            </div>
            <Button variant="outline" className="mt-4 gap-1.5">Continuar prova</Button>
          </Link>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-5 flex flex-col items-center justify-center text-center">
            <Clock className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Nenhuma prova em andamento</p>
            <p className="text-xs text-muted-foreground mt-1">Inicie uma prova abaixo para ver aqui.</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar instituição ou exame..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-background border-border/60"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 md:flex md:gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="md:w-36 bg-background border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="md:w-32 bg-background border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Ano</SelectItem>
                {[2023, 2022, 2021, 2020, 2019].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={order} onValueChange={setOrder}>
              <SelectTrigger className="md:w-40 bg-background border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="alphabetic">Alfabética</SelectItem>
                <SelectItem value="editions">Mais edições</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Catalog grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-semibold">Catálogo de instituições</h2>
          <span className="text-xs text-muted-foreground">{filtered.length} resultado(s)</span>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma instituição encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((inst) => (
              <ExamCatalogCard key={inst.id} institution={inst} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamsCatalog;
