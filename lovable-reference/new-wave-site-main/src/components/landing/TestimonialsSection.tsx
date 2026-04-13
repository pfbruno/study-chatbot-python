import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ana Carolina",
    course: "Aprovada em Medicina - USP",
    text: "As provas reais fizeram toda a diferença! Consegui praticar exatamente o que cairia na prova.",
    stars: 5,
  },
  {
    name: "Lucas Mendes",
    course: "Aprovado em Engenharia - UNICAMP",
    text: "O filtro por matéria me ajudou a focar nas minhas fraquezas. O dashboard mostrava exatamente onde melhorar.",
    stars: 5,
  },
  {
    name: "Beatriz Santos",
    course: "Aprovada em Direito - UFMG",
    text: "Melhor investimento que fiz! As questões aleatórias viraram minha rotina diária de estudos.",
    stars: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">Depoimentos</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mt-3">
            Quem usa, <span className="text-primary">aprova</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-6 text-muted-foreground">"{t.text}"</p>
              <div>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-accent">{t.course}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
