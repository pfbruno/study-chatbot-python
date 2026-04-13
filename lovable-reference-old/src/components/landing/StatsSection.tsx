import { TrendingUp, Users, BookOpen, Award } from "lucide-react";

const stats = [
  { icon: Users, value: "50.000+", label: "Alunos ativos", color: "text-primary" },
  { icon: BookOpen, value: "100.000+", label: "Questões resolvidas", color: "text-accent" },
  { icon: TrendingUp, value: "87%", label: "Taxa de aprovação", color: "text-primary" },
  { icon: Award, value: "200+", label: "Professores parceiros", color: "text-accent" },
];

const StatsSection = () => {
  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-8 rounded-xl bg-card/50 border border-border backdrop-blur"
            >
              <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
              <p className="font-heading text-3xl md:text-4xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
