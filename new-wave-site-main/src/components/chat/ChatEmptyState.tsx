import { Sparkles, BookOpen, Calculator, FlaskConical, Globe, Pencil, Brain, Lightbulb, ArrowRight } from "lucide-react";

interface PromptSuggestion {
  icon: React.ElementType;
  label: string;
  prompt: string;
  hint: string;
}

const suggestions: PromptSuggestion[] = [
  {
    icon: Calculator,
    label: "Matemática",
    hint: "Conceito fundamental",
    prompt: "Me explique o conceito de derivadas com exemplos práticos do ENEM",
  },
  {
    icon: FlaskConical,
    label: "Química",
    hint: "Resumo rápido",
    prompt: "Faça um resumo completo sobre ligações químicas",
  },
  {
    icon: BookOpen,
    label: "Português",
    hint: "Aprofundamento",
    prompt: "Me ajude a entender figuras de linguagem com exemplos do ENEM",
  },
  {
    icon: Globe,
    label: "Geografia",
    hint: "Tema cobrado",
    prompt: "Explique os principais biomas brasileiros e suas características",
  },
  {
    icon: Pencil,
    label: "Redação",
    hint: "Dica prática",
    prompt: "Me dê dicas para fazer uma boa introdução na redação do ENEM",
  },
  {
    icon: Brain,
    label: "Cronograma",
    hint: "Plano de estudo",
    prompt: "Monte um cronograma de estudos de 4 semanas para o ENEM",
  },
];

const capabilities = [
  {
    icon: Lightbulb,
    title: "Explicações didáticas",
    description: "Conceitos complexos explicados de forma simples e direta",
  },
  {
    icon: BookOpen,
    title: "Resumos inteligentes",
    description: "Transforme qualquer conteúdo em resumos focados no que cai na prova",
  },
  {
    icon: Brain,
    title: "Plano de estudo personalizado",
    description: "Cronogramas adaptados ao seu tempo e meta de pontuação",
  },
];

interface ChatEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export const ChatEmptyState = ({ onSelectPrompt }: ChatEmptyStateProps) => {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-14 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent blur-2xl opacity-50" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.6)]">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
              Como posso ajudar nos seus estudos hoje?
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Tire dúvidas, peça resumos, gere questões ou monte um cronograma. Tudo focado no que cai no ENEM e vestibulares.
            </p>
          </div>
        </div>

        {/* Capabilities */}
        <div className="grid md:grid-cols-3 gap-3">
          {capabilities.map((c, i) => (
            <div
              key={c.title}
              className="rounded-xl border border-border bg-card/40 p-4 hover:bg-card/70 hover:border-primary/30 transition-all animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                <c.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.description}</p>
            </div>
          ))}
        </div>

        {/* Prompt suggestions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Sugestões para começar
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {suggestions.map((s, i) => (
              <button
                key={s.label}
                onClick={() => onSelectPrompt(s.prompt)}
                className="group relative text-left p-4 rounded-xl border border-border bg-card/40 hover:bg-card/80 hover:border-primary/40 transition-all animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <s.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground">{s.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-medium">
                        {s.hint}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-snug">{s.prompt}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/0 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
