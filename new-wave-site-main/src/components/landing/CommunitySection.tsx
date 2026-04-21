import { Users, Video, MessageCircle, Trophy, GraduationCap, Globe } from "lucide-react";

const communityFeatures = [
  {
    icon: Users,
    title: "Grupos de Estudo",
    description: "Junte-se a grupos por área, curso ou instituição e estude com quem tem os mesmos objetivos.",
    stat: "500+",
    statLabel: "grupos ativos",
  },
  {
    icon: Video,
    title: "Aulas ao Vivo",
    description: "Assista aulas com professores reais, tire dúvidas em tempo real e acesse replays.",
    stat: "50+",
    statLabel: "aulas por semana",
  },
  {
    icon: GraduationCap,
    title: "Professores Especialistas",
    description: "Conteúdos criados por professores experientes com comentários exclusivos em questões.",
    stat: "200+",
    statLabel: "professores",
  },
  {
    icon: MessageCircle,
    title: "Fórum da Comunidade",
    description: "Pergunte, responda e ajude outros alunos. A melhor resposta é destacada pela comunidade.",
    stat: "10k+",
    statLabel: "respostas",
  },
  {
    icon: Trophy,
    title: "Gamificação",
    description: "Conquiste badges, suba de nível e desbloqueie conquistas especiais como 'Dissimulado'.",
    stat: "30+",
    statLabel: "conquistas",
  },
  {
    icon: Globe,
    title: "Feed Social",
    description: "Compartilhe sua rotina de estudos, conquistas e resultados com a comunidade.",
    stat: "24h",
    statLabel: "atividade contínua",
  },
];

const CommunitySection = () => {
  return (
    <section className="py-24 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">Comunidade</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mt-3">
            Você não estuda{" "}
            <span className="text-primary">sozinho</span>
          </h2>
          <p className="text-muted-foreground mt-4">
            Uma comunidade vibrante de alunos e professores que se ajudam mutuamente.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communityFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl bg-card border border-border hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="font-heading text-xl font-bold text-accent">{feature.stat}</p>
                  <p className="text-xs text-muted-foreground">{feature.statLabel}</p>
                </div>
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

export default CommunitySection;
