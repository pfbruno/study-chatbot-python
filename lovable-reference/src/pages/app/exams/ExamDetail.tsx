import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { ExamHero } from "@/components/exams/ExamHero";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  Play,
  RotateCcw,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  Brain,
  Layers,
  Sparkles,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { getInstitution, examEditions } from "@/data/mockExams";
import { ExamMetaCard } from "@/components/exams/ExamMetaCard";
import { ReviewCTASection } from "@/components/exams/ReviewCTASection";

const ExamDetail = () => {
  const { institutionId, year } = useParams();
  const navigate = useNavigate();
  const institution = getInstitution(institutionId || "");
  const edition = examEditions.find(
    (e) => e.institutionId === institutionId && String(e.year) === year
  );

  if (!institution || !edition) return <Navigate to="/app/provas" replace />;

  const isInProgress = edition.status === "in_progress";
  const isCompleted = edition.status === "completed";
  const resolveUrl = `/app/provas/${institution.id}/${edition.year}/resolver`;
  const resultUrl = `/app/provas/${institution.id}/${edition.year}/resultado`;

  return (
    <div className="space-y-6 max-w-6xl">
      <Link
        to={`/app/provas/${institution.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar para {institution.shortName}
      </Link>

      <ExamHero
        title={edition.title}
        subtitle={edition.description}
        badge={`${institution.shortName} · ${edition.year}`}
        icon={<BookOpen className="w-7 h-7 text-primary" />}
        actions={
          <>
            {isCompleted ? (
              <>
                <Button onClick={() => navigate(resultUrl)} className="gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Ver resultado
                </Button>
                <Button variant="outline" onClick={() => navigate(resolveUrl)} className="gap-1.5">
                  <RotateCcw className="w-4 h-4" /> Refazer
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate(resolveUrl)} className="gap-1.5" size="lg">
                <Play className="w-4 h-4" /> {isInProgress ? "Continuar prova" : "Iniciar prova"}
              </Button>
            )}
            {edition.hasOfficialPdf && (
              <Button variant="outline" className="gap-1.5">
                <Download className="w-4 h-4" /> PDF oficial
              </Button>
            )}
          </>
        }
      />

      {/* Progress alert */}
      {isInProgress && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Você tem uma tentativa em andamento</p>
            <p className="text-xs text-muted-foreground">
              Último acesso {edition.lastAccess?.toLowerCase()} • {edition.progress}% concluído
            </p>
            <Progress value={edition.progress} className="h-1.5 mt-2" />
          </div>
          <Button onClick={() => navigate(resolveUrl)} size="sm">
            Continuar
          </Button>
        </div>
      )}

      {/* Meta grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ExamMetaCard icon={<FileText className="w-4 h-4" />} label="Questões" value={edition.totalQuestions} hint="total da prova" />
        <ExamMetaCard icon={<BookOpen className="w-4 h-4" />} label="Dias" value="2" hint="dia 1 e dia 2" />
        <ExamMetaCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Gabarito"
          value={edition.hasAnswerKey ? "Sim" : "Não"}
          hint={edition.hasAnswerKey ? "oficial" : "indisponível"}
          accent={edition.hasAnswerKey}
        />
        <ExamMetaCard icon={<Sparkles className="w-4 h-4" />} label="Comentários" value="IA" hint="por questão" />
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* About */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-5 md:p-6 space-y-4">
          <h3 className="font-heading font-semibold text-lg">Sobre esta experiência de resolução</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Você terá acesso à prova oficial completa, com navegação livre entre as questões, marcação para revisão,
            folha de respostas visual e salvamento automático do progresso. Ao finalizar, geramos uma análise detalhada
            com seu desempenho por área de conhecimento e sugestões personalizadas de revisão.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Feature icon={<CheckCircle2 className="w-4 h-4" />} title="Salvamento automático" desc="Sua tentativa é salva a cada resposta" />
            <Feature icon={<Layers className="w-4 h-4" />} title="Folha de respostas" desc="Visão lateral de todas as questões" />
            <Feature icon={<Brain className="w-4 h-4" />} title="Revisão automática" desc="Geração de materiais com IA após finalizar" />
            <Feature icon={<Sparkles className="w-4 h-4" />} title="Correção comentada" desc="Explicação detalhada por questão" />
          </div>
        </div>

        {/* Side info */}
        <div className="space-y-4">
          {!edition.hasOfficialPdf && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">PDF oficial indisponível</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    O conteúdo das questões está completo, mas o PDF original não está disponível para download.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
            <h4 className="font-heading font-semibold">Recursos disponíveis</h4>
            <ResourceItem label="Gabarito oficial" enabled={edition.hasAnswerKey} />
            <ResourceItem label="PDF da prova original" enabled={edition.hasOfficialPdf} />
            <ResourceItem label="Comentários por IA" enabled />
            <ResourceItem label="Análise por disciplina" enabled />
            <ResourceItem label="Geração de flashcards" enabled />
          </div>
        </div>
      </div>

      {/* Review CTAs */}
      <ReviewCTASection />
    </div>
  );
};

const Feature = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border/40">
    <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">{icon}</div>
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  </div>
);

const ResourceItem = ({ label, enabled }: { label: string; enabled: boolean }) => (
  <div className="flex items-center justify-between text-sm">
    <span className={enabled ? "" : "text-muted-foreground line-through"}>{label}</span>
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${enabled ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
      {enabled ? "Disponível" : "Em breve"}
    </span>
  </div>
);

export default ExamDetail;
