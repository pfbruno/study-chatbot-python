"use client";

import { useMemo, useState } from "react";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Layers3,
  RotateCcw,
} from "lucide-react";

type StudyTab = "flashcards" | "resumos" | "mapas";

type SubjectKey =
  | "todas"
  | "biologia"
  | "fisica"
  | "historia"
  | "quimica"
  | "portugues"
  | "geografia";

type FlashcardItem = {
  id: number;
  subject: string;
  subjectKey: SubjectKey;
  difficulty: "fácil" | "médio" | "difícil";
  question: string;
  answer: string;
};

type SummaryItem = {
  id: number;
  subject: string;
  subjectKey: SubjectKey;
  title: string;
  time: string;
  tags: string[];
  content: string[];
};

type MindMapItem = {
  id: number;
  subject: string;
  title: string;
  subtitle: string;
  branches: {
    label: string;
    children: string[];
  }[];
};

const FILTERS: { key: SubjectKey; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "biologia", label: "Biologia" },
  { key: "fisica", label: "Física" },
  { key: "historia", label: "História" },
  { key: "quimica", label: "Química" },
  { key: "portugues", label: "Português" },
  { key: "geografia", label: "Geografia" },
];

const FLASHCARDS: FlashcardItem[] = [
  {
    id: 1,
    subject: "Biologia",
    subjectKey: "biologia",
    difficulty: "médio",
    question: "O que é mitose?",
    answer:
      "Mitose é a divisão celular que gera duas células-filhas geneticamente idênticas, preservando o número de cromossomos.",
  },
  {
    id: 2,
    subject: "Biologia",
    subjectKey: "biologia",
    difficulty: "fácil",
    question: "Qual a função do DNA?",
    answer:
      "Armazenar e transmitir a informação genética responsável pela síntese de proteínas e hereditariedade.",
  },
  {
    id: 3,
    subject: "Física",
    subjectKey: "fisica",
    difficulty: "médio",
    question: "O que é velocidade média?",
    answer:
      "É a razão entre o deslocamento total e o intervalo de tempo gasto no percurso.",
  },
  {
    id: 4,
    subject: "História",
    subjectKey: "historia",
    difficulty: "difícil",
    question: "O que foi o mercantilismo?",
    answer:
      "Foi um conjunto de práticas econômicas do Estado moderno, marcado por protecionismo, metalismo e balança comercial favorável.",
  },
  {
    id: 5,
    subject: "Química",
    subjectKey: "quimica",
    difficulty: "médio",
    question: "O que é entalpia?",
    answer:
      "É a grandeza termodinâmica associada à energia de um sistema em pressão constante.",
  },
  {
    id: 6,
    subject: "Português",
    subjectKey: "portugues",
    difficulty: "fácil",
    question: "O que é oração subordinada?",
    answer:
      "É a oração que depende sintaticamente de outra oração principal para completar seu sentido.",
  },
];

const SUMMARIES: SummaryItem[] = [
  {
    id: 1,
    subject: "Biologia",
    subjectKey: "biologia",
    title: "Ecologia — Relações Ecológicas",
    time: "5 min",
    tags: ["Harmônicas", "Desarmônicas", "Intraespecíficas", "Interespecíficas"],
    content: [
      "As relações ecológicas são interações entre os seres vivos em um ecossistema.",
      "Podem ser classificadas em intraespecíficas e interespecíficas.",
      "Quanto ao efeito, podem ser harmônicas ou desarmônicas.",
    ],
  },
  {
    id: 2,
    subject: "Física",
    subjectKey: "fisica",
    title: "Cinemática — MRU e MRUV",
    time: "7 min",
    tags: ["MRU", "MRUV", "Gráficos", "Fórmulas"],
    content: [
      "MRU ocorre com velocidade constante.",
      "MRUV apresenta aceleração constante.",
      "A leitura de gráficos é central para interpretação em prova.",
    ],
  },
  {
    id: 3,
    subject: "História",
    subjectKey: "historia",
    title: "Brasil Colônia — Ciclos Econômicos",
    time: "6 min",
    tags: ["Pau-Brasil", "Açúcar", "Ouro", "Café"],
    content: [
      "A economia colonial passou por ciclos produtivos sucessivos.",
      "O açúcar consolidou a grande lavoura e o trabalho escravizado.",
      "O ouro deslocou o eixo econômico para a região mineradora.",
    ],
  },
];

const MIND_MAPS: MindMapItem[] = [
  {
    id: 1,
    subject: "Biologia",
    title: "Genética — Leis de Mendel",
    subtitle: "3 ramificações principais",
    branches: [
      {
        label: "1ª Lei — Segregação",
        children: ["Monohibridismo", "Genótipo × Fenótipo", "Dominância completa"],
      },
      {
        label: "2ª Lei — Segregação Independente",
        children: ["Dibridismo", "Proporção 9:3:3:1"],
      },
      {
        label: "Extensões",
        children: ["Codominância", "Herança intermediária"],
      },
    ],
  },
  {
    id: 2,
    subject: "Física",
    title: "Eletricidade — Circuitos",
    subtitle: "3 ramificações principais",
    branches: [
      {
        label: "Grandezas",
        children: ["Tensão", "Corrente", "Resistência"],
      },
      {
        label: "Leis de Ohm",
        children: ["U = R.I", "Potência elétrica"],
      },
      {
        label: "Associação",
        children: ["Série", "Paralelo"],
      },
    ],
  },
];

function StatCard({
  value,
  label,
  extra,
}: {
  value: string;
  label: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#081224] px-6 py-5">
      <div className="text-center">
        <div className="text-[2.1rem] font-semibold tracking-tight text-white">
          {value}
        </div>
        <div className="mt-1 text-base text-white/55">{label}</div>
        {extra ? <div className="mt-3">{extra}</div> : null}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border px-4 py-2.5 text-base font-medium transition",
        active
          ? "border-[#4b8df7] bg-[#4b8df7] text-white"
          : "border-white/12 bg-transparent text-white hover:border-[#2b5dbb] hover:bg-white/[0.03]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-[#224579] bg-[#0a1730] px-3 py-1 text-sm font-medium text-white">
      {children}
    </span>
  );
}

export function StudyArea() {
  const [tab, setTab] = useState<StudyTab>("flashcards");
  const [filter, setFilter] = useState<SubjectKey>("todas");
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<SummaryItem | null>(null);
  const [selectedMindMap, setSelectedMindMap] = useState<MindMapItem | null>(null);

  const filteredFlashcards = useMemo(() => {
    if (filter === "todas") return FLASHCARDS;
    return FLASHCARDS.filter((item) => item.subjectKey === filter);
  }, [filter]);

  const filteredSummaries = useMemo(() => {
    if (filter === "todas") return SUMMARIES;
    return SUMMARIES.filter((item) => item.subjectKey === filter);
  }, [filter]);

  const currentFlashcard =
    filteredFlashcards[flashcardIndex] ?? filteredFlashcards[0] ?? null;

  const masteredCount = 2;
  const pendingCount = 4;
  const completion = 33;

  function resetFlashcards() {
    setFlashcardIndex(0);
    setShowAnswer(false);
  }

  function nextFlashcard() {
    if (!filteredFlashcards.length) return;
    setShowAnswer(false);
    setFlashcardIndex((prev) => (prev + 1) % filteredFlashcards.length);
  }

  function prevFlashcard() {
    if (!filteredFlashcards.length) return;
    setShowAnswer(false);
    setFlashcardIndex((prev) =>
      prev === 0 ? filteredFlashcards.length - 1 : prev - 1
    );
  }

  if (selectedSummary) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#030a16] p-6 sm:p-8">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setSelectedSummary(null)}
            className="inline-flex items-center gap-2 text-lg font-medium text-white hover:text-[#79a6ff]"
          >
            <ChevronLeft className="h-5 w-5" />
            Voltar
          </button>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#071224] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="rounded-full bg-white/10 px-4 py-1.5 text-base font-semibold text-white">
              {selectedSummary.subject}
            </span>
            <span className="inline-flex items-center gap-1.5 text-base text-white/45">
              <Clock3 className="h-4 w-4" />
              {selectedSummary.time} de leitura
            </span>
          </div>

          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white">
            {selectedSummary.title}
          </h2>

          <div className="mt-5 flex flex-wrap gap-3">
            {selectedSummary.tags.map((tag) => (
              <Pill key={tag}>{tag}</Pill>
            ))}
          </div>

          <div className="mt-10 space-y-8 text-[1.05rem] leading-8 text-white/90">
            <section>
              <h3 className="mb-4 text-2xl font-semibold text-white">Resumo</h3>
              {selectedSummary.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>

            <section>
              <h3 className="mb-4 text-2xl font-semibold text-white">
                Classificação
              </h3>
              <ul className="list-disc space-y-2 pl-6">
                <li>Por espécie: intraespecíficas e interespecíficas.</li>
                <li>Por benefício: harmônicas e desarmônicas.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (selectedMindMap) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#030a16] p-6 sm:p-8">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setSelectedMindMap(null)}
            className="inline-flex items-center gap-2 text-lg font-medium text-white hover:text-[#79a6ff]"
          >
            <ChevronLeft className="h-5 w-5" />
            Voltar
          </button>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#071224] p-6 sm:p-8">
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-base font-semibold text-white">
            {selectedMindMap.subject}
          </span>

          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            {selectedMindMap.title}
          </h2>

          <p className="mt-3 text-lg text-white/55">{selectedMindMap.subtitle}</p>

          <div className="mt-10 space-y-7">
            {selectedMindMap.branches.map((branch, index) => (
              <div key={branch.label} className="relative pl-6">
                {index !== selectedMindMap.branches.length - 1 ? (
                  <span className="absolute left-[11px] top-12 h-[calc(100%+12px)] w-px bg-white/10" />
                ) : null}

                <div className="inline-flex items-center gap-2 rounded-2xl border border-[#3b82f6] bg-[#0a1730] px-5 py-3 text-lg font-semibold text-[#6ca2ff]">
                  {index === 0 ? <Brain className="h-5 w-5" /> : null}
                  {branch.label}
                </div>

                <div className="mt-4 ml-6 flex flex-wrap gap-3">
                  {branch.children.map((child) => (
                    <span
                      key={child}
                      className="rounded-2xl bg-white/[0.05] px-5 py-3 text-lg text-white/90"
                    >
                      {child}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#030a16] p-6 sm:p-8">
      <div className="max-w-4xl">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-[#4b8df7]" />
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Área de Estudo
          </h1>
        </div>

        <p className="mt-3 text-xl text-white/55">
          Flashcards, resumos inteligentes e mapas mentais para acelerar seu aprendizado
        </p>
      </div>

      <div className="mt-8 border-b border-white/10">
        <div className="flex flex-wrap gap-8">
          <button
            type="button"
            onClick={() => setTab("flashcards")}
            className={`relative flex items-center gap-2 pb-4 text-lg font-medium ${
              tab === "flashcards" ? "text-[#4b8df7]" : "text-white/60"
            }`}
          >
            <Layers3 className="h-5 w-5" />
            Flashcards
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-sm text-white">
              6
            </span>
            {tab === "flashcards" ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#3b82f6]" />
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setTab("resumos")}
            className={`relative flex items-center gap-2 pb-4 text-lg font-medium ${
              tab === "resumos" ? "text-[#4b8df7]" : "text-white/60"
            }`}
          >
            <FileText className="h-5 w-5" />
            Resumos
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-sm text-white">
              3
            </span>
            {tab === "resumos" ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#3b82f6]" />
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setTab("mapas")}
            className={`relative flex items-center gap-2 pb-4 text-lg font-medium ${
              tab === "mapas" ? "text-[#4b8df7]" : "text-white/60"
            }`}
          >
            <Brain className="h-5 w-5" />
            Mapas Mentais
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-sm text-white">
              2
            </span>
            {tab === "mapas" ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#3b82f6]" />
            ) : null}
          </button>
        </div>
      </div>

      {tab === "flashcards" ? (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-4">
            <StatCard value="6" label="Total" />
            <StatCard value={String(masteredCount)} label="Dominados" />
            <StatCard value={String(pendingCount)} label="Pendentes" />
            <StatCard
              value={`${completion}%`}
              label="completo"
              extra={
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#3b82f6]"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              }
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {FILTERS.map((item) => (
              <FilterChip
                key={item.key}
                active={filter === item.key}
                onClick={() => {
                  setFilter(item.key);
                  setFlashcardIndex(0);
                  setShowAnswer(false);
                }}
              >
                {item.label}
              </FilterChip>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-3xl">
              <div
                className="cursor-pointer rounded-[28px] border border-white/10 bg-[#081224] px-6 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                onClick={() => setShowAnswer((prev) => !prev)}
              >
                {currentFlashcard ? (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <span className="rounded-full bg-white/10 px-4 py-1.5 text-base font-semibold text-white">
                        {currentFlashcard.subject}
                      </span>

                      <span className="rounded-full bg-emerald-500/15 px-4 py-1.5 text-base font-semibold text-emerald-400">
                        {currentFlashcard.difficulty}
                      </span>
                    </div>

                    <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                      <Eye className="mb-5 h-8 w-8 text-white/45" />

                      <h3 className="max-w-2xl text-4xl font-semibold tracking-tight text-white">
                        {showAnswer
                          ? currentFlashcard.answer
                          : currentFlashcard.question}
                      </h3>

                      <p className="mt-5 text-lg text-white/45">
                        {showAnswer
                          ? "Clique para voltar à pergunta"
                          : "Clique para ver a resposta"}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[280px] items-center justify-center text-lg text-white/45">
                    Nenhum flashcard encontrado para este filtro.
                  </div>
                )}
              </div>

              {currentFlashcard ? (
                <>
                  <div className="mt-5 flex items-center justify-center gap-5">
                    <button
                      type="button"
                      onClick={prevFlashcard}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#081224] text-white transition hover:border-[#3b82f6]"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <span className="text-lg text-white/75">
                      {flashcardIndex + 1} / {filteredFlashcards.length}
                    </span>

                    <button
                      type="button"
                      onClick={nextFlashcard}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#081224] text-white transition hover:border-[#3b82f6]"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={nextFlashcard}
                      className="rounded-2xl border border-white/10 bg-[#081224] px-5 py-3 text-lg font-semibold text-white transition hover:border-emerald-400 hover:text-emerald-400"
                    >
                      Dominei!
                    </button>

                    <button
                      type="button"
                      onClick={resetFlashcards}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#081224] px-5 py-3 text-lg font-semibold text-white transition hover:border-[#3b82f6] hover:text-[#79a6ff]"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Recomeçar
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {tab === "resumos" ? (
        <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-3">
          {filteredSummaries.map((summary) => (
            <button
              key={summary.id}
              type="button"
              onClick={() => setSelectedSummary(summary)}
              className="rounded-[24px] border border-white/10 bg-[#071224] p-6 text-left transition hover:border-[#2f66d0] hover:bg-[#09182f]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-white/10 px-4 py-1.5 text-base font-semibold text-white">
                  {summary.subject}
                </span>
                <span className="inline-flex items-center gap-1.5 text-base text-white/45">
                  <Clock3 className="h-4 w-4" />
                  {summary.time}
                </span>
              </div>

              <h3 className="mt-6 text-3xl font-semibold tracking-tight text-white">
                {summary.title}
              </h3>

              <div className="mt-5 flex flex-wrap gap-3">
                {summary.tags.map((tag) => (
                  <Pill key={tag}>{tag}</Pill>
                ))}
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {tab === "mapas" ? (
        <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
          {MIND_MAPS.map((map) => (
            <button
              key={map.id}
              type="button"
              onClick={() => setSelectedMindMap(map)}
              className="rounded-[24px] border border-white/10 bg-[#071224] p-6 text-left transition hover:border-[#2f66d0] hover:bg-[#09182f]"
            >
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-base font-semibold text-white">
                {map.subject}
              </span>

              <h3 className="mt-6 text-3xl font-semibold tracking-tight text-white">
                {map.title}
              </h3>

              <p className="mt-3 text-lg text-white/55">{map.subtitle}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                {map.branches.map((branch) => (
                  <Pill key={branch.label}>{branch.label}</Pill>
                ))}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}