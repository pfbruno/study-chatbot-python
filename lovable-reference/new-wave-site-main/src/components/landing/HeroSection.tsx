import heroImage from "@/assets/hero-illustration.jpg";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Brain, Target } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Plataforma inteligente de estudos</span>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Conquiste sua vaga com{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                provas reais
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg">
              Pratique com questões de vestibulares e ENEM, filtre por matéria, 
              acompanhe seu desempenho e alcance a aprovação que você merece.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold text-base px-8 animate-pulse-glow">
                Começar agora
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary font-semibold text-base px-8">
                Ver planos
              </Button>
            </div>

            <div className="flex gap-8 pt-4">
              {[
                { icon: BookOpen, label: "Provas oficiais", value: "50+" },
                { icon: Target, label: "Questões", value: "10.000+" },
                { icon: Brain, label: "Matérias", value: "12" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="w-5 h-5 text-accent mx-auto mb-1" />
                  <p className="font-heading text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative animate-float">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-2xl" />
              <img
                src={heroImage}
                alt="Plataforma de estudos com provas e questões"
                className="relative rounded-2xl border border-border shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
