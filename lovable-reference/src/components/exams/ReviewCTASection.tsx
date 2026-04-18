import { Link } from "react-router-dom";
import { Brain, FileText, Layers, MessageSquare, ArrowRight } from "lucide-react";

const items = [
  {
    title: "Gerar flashcards",
    description: "Cards com IA das questões que você errou",
    icon: Layers,
    to: "/app/estudo",
    color: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
  },
  {
    title: "Resumo personalizado",
    description: "Resumo focado nos seus pontos fracos",
    icon: FileText,
    to: "/app/estudo",
    color: "from-accent/20 to-accent/5",
    iconColor: "text-accent",
  },
  {
    title: "Mapa mental",
    description: "Visualize conceitos das matérias revisadas",
    icon: Brain,
    to: "/app/estudo",
    color: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
  },
  {
    title: "Tirar dúvidas com IA",
    description: "Converse sobre as questões da prova",
    icon: MessageSquare,
    to: "/app/chat",
    color: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
  },
];

export const ReviewCTASection = () => {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-semibold text-lg">Sua revisão já está pronta</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Conecte o resultado à sua área de estudo</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((it) => (
          <Link
            key={it.title}
            to={it.to}
            className={`group relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br ${it.color} p-4 hover:border-primary/40 transition-all`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg bg-background/40 backdrop-blur flex items-center justify-center ${it.iconColor}`}>
                <it.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{it.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{it.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
