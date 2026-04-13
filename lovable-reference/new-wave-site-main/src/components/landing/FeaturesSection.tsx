import { BookOpen, Filter, BarChart3, Trophy, Clock, Shuffle } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Provas Oficiais",
    description: "Acesso a provas reais de vestibulares e ENEM com gabarito oficial para praticar.",
  },
  {
    icon: Shuffle,
    title: "Questões Aleatórias",
    description: "Pratique com questões aleatórias ou monte simulados personalizados do seu jeito.",
  },
  {
    icon: Filter,
    title: "Filtro por Matéria",
    description: "Escolha estudar apenas Biologia, Matemática, História ou a matéria que precisar.",
  },
  {
    icon: BarChart3,
    title: "Dashboard de Desempenho",
    description: "Gráficos detalhados mostrando sua evolução, acertos e pontos fracos.",
  },
  {
    icon: Clock,
    title: "Correção Automática",
    description: "Resultado instantâneo com correção automática baseada no gabarito oficial.",
  },
  {
    icon: Trophy,
    title: "Ranking e Progresso",
    description: "Compare seu desempenho e acompanhe sua evolução ao longo do tempo.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">Funcionalidades</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mt-3">
            Tudo que você precisa para{" "}
            <span className="text-primary">estudar melhor</span>
          </h2>
          <p className="text-muted-foreground mt-4">
            Ferramentas pensadas para otimizar seu tempo de estudo e maximizar seus resultados.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl bg-card border border-border hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
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

export default FeaturesSection;
