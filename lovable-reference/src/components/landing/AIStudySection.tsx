import { Brain, MessageSquare, Sparkles, Zap, BookMarked, Map } from "lucide-react";

const aiFeatures = [
  {
    icon: MessageSquare,
    title: "Chat com IA",
    description: "Converse com um tutor inteligente que entende seu nível e adapta as explicações.",
  },
  {
    icon: Sparkles,
    title: "Resumos Automáticos",
    description: "Gere resumos otimizados de qualquer conteúdo em segundos.",
  },
  {
    icon: BookMarked,
    title: "Flashcards Inteligentes",
    description: "A IA cria flashcards personalizados baseados nos seus pontos fracos.",
  },
  {
    icon: Map,
    title: "Mapas Mentais",
    description: "Visualize conexões entre temas com mapas gerados automaticamente.",
  },
  {
    icon: Zap,
    title: "Revisão Espaçada",
    description: "Algoritmo que calcula o melhor momento para revisar cada conteúdo.",
  },
  {
    icon: Brain,
    title: "Plano de Estudo",
    description: "Roteiro personalizado criado pela IA com base no seu objetivo e tempo disponível.",
  },
];

const AIStudySection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl -translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/5 mb-6">
            <Brain className="w-4 h-4 text-accent" />
            <span className="text-sm text-accent font-medium">Powered by IA</span>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold">
            Estude com{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              inteligência artificial
            </span>
          </h2>
          <p className="text-muted-foreground mt-4">
            Um tutor pessoal que nunca dorme. A IA do StudyPro aprende com você 
            e potencializa seus estudos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-xl bg-card/50 backdrop-blur border border-border hover:border-accent/40 transition-all duration-300"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-heading text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIStudySection;
