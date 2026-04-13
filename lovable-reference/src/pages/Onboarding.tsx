import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Users, ArrowRight, ArrowLeft, Check, Target, Clock, Brain } from "lucide-react";

type ProfileType = "student" | "teacher" | null;

interface Subject {
  id: string;
  name: string;
  emoji: string;
}

const subjects: Subject[] = [
  { id: "math", name: "Matemática", emoji: "📐" },
  { id: "physics", name: "Física", emoji: "⚡" },
  { id: "chemistry", name: "Química", emoji: "🧪" },
  { id: "biology", name: "Biologia", emoji: "🧬" },
  { id: "history", name: "História", emoji: "📜" },
  { id: "geography", name: "Geografia", emoji: "🌍" },
  { id: "portuguese", name: "Português", emoji: "📖" },
  { id: "english", name: "Inglês", emoji: "🇬🇧" },
  { id: "philosophy", name: "Filosofia", emoji: "💭" },
  { id: "sociology", name: "Sociologia", emoji: "🏛️" },
  { id: "literature", name: "Literatura", emoji: "📚" },
  { id: "writing", name: "Redação", emoji: "✍️" },
];

const goals = [
  { id: "enem", label: "ENEM", icon: Target },
  { id: "vestibular", label: "Vestibular específico", icon: GraduationCap },
  { id: "concurso", label: "Concurso público", icon: BookOpen },
  { id: "reforco", label: "Reforço escolar", icon: Brain },
];

const studyTime = [
  { id: "1h", label: "1 hora/dia", description: "Para quem está começando" },
  { id: "2h", label: "2 horas/dia", description: "Ritmo moderado" },
  { id: "4h", label: "4 horas/dia", description: "Foco total" },
  { id: "6h", label: "6+ horas/dia", description: "Modo aprovação" },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileType>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 0: return profile !== null;
      case 1: return selectedSubjects.length > 0;
      case 2: return selectedGoal !== null;
      case 3: return selectedTime !== null;
      default: return false;
    }
  };

  const handleFinish = () => {
    // Mock - será integrado com backend
    window.location.href = "/app";
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="font-heading text-lg font-bold">StudyPro</span>
          </div>
          <span className="text-sm text-muted-foreground">
            Passo {step + 1} de {totalSteps}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-secondary h-1">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Step 0: Profile */}
          {step === 0 && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="text-center space-y-3">
                <h1 className="font-heading text-3xl font-bold">Como você quer usar o StudyPro?</h1>
                <p className="text-muted-foreground">Isso nos ajuda a personalizar sua experiência.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={() => setProfile("student")}
                  className={`p-8 rounded-2xl border-2 transition-all duration-300 text-left space-y-4 ${
                    profile === "student"
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    profile === "student" ? "bg-primary/20" : "bg-primary/10"
                  }`}>
                    <GraduationCap className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold">Sou Aluno</h3>
                  <p className="text-sm text-muted-foreground">
                    Quero estudar com simulados, IA e acompanhar meu progresso para ser aprovado.
                  </p>
                  {profile === "student" && (
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                      <Check className="w-4 h-4" /> Selecionado
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setProfile("teacher")}
                  className={`p-8 rounded-2xl border-2 transition-all duration-300 text-left space-y-4 ${
                    profile === "teacher"
                      ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
                      : "border-border bg-card hover:border-accent/30"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    profile === "teacher" ? "bg-accent/20" : "bg-accent/10"
                  }`}>
                    <Users className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold">Sou Professor</h3>
                  <p className="text-sm text-muted-foreground">
                    Quero criar conteúdo, publicar simulados e acompanhar turmas.
                  </p>
                  {profile === "teacher" && (
                    <div className="flex items-center gap-2 text-accent text-sm font-medium">
                      <Check className="w-4 h-4" /> Selecionado
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Subjects */}
          {step === 1 && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="text-center space-y-3">
                <h1 className="font-heading text-3xl font-bold">
                  {profile === "teacher" ? "Quais matérias você leciona?" : "Quais matérias quer focar?"}
                </h1>
                <p className="text-muted-foreground">Selecione uma ou mais matérias.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                      selectedSubjects.includes(subject.id)
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <span className="text-xl">{subject.emoji}</span>
                    <span className="text-sm font-medium">{subject.name}</span>
                    {selectedSubjects.includes(subject.id) && (
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Goal */}
          {step === 2 && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="text-center space-y-3">
                <h1 className="font-heading text-3xl font-bold">Qual é seu objetivo principal?</h1>
                <p className="text-muted-foreground">Vamos criar um plano personalizado para você.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                      selectedGoal === goal.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      selectedGoal === goal.id ? "bg-primary/20" : "bg-primary/10"
                    }`}>
                      <goal.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-semibold">{goal.label}</span>
                    {selectedGoal === goal.id && (
                      <Check className="w-5 h-5 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Study time */}
          {step === 3 && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="text-center space-y-3">
                <h1 className="font-heading text-3xl font-bold">Quanto tempo por dia você estuda?</h1>
                <p className="text-muted-foreground">Ajuste quando quiser nas configurações.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {studyTime.map((time) => (
                  <button
                    key={time.id}
                    onClick={() => setSelectedTime(time.id)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedTime === time.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className={`w-5 h-5 ${selectedTime === time.id ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                          <p className="font-semibold">{time.label}</p>
                          <p className="text-sm text-muted-foreground">{time.description}</p>
                        </div>
                      </div>
                      {selectedTime === time.id && <Check className="w-5 h-5 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="border-t border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {step < totalSteps - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold px-8"
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold px-8"
            >
              Começar a estudar!
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
