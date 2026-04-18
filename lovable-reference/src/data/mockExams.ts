export type ExamStatus = "available" | "in_progress" | "completed";
export type ExamType = "official" | "mock" | "reviewed";

export interface ExamAlternative {
  label: "A" | "B" | "C" | "D" | "E";
  text: string;
}

export interface ExamQuestion {
  id: string;
  number: number;
  area: string;
  subject: string;
  day: 1 | 2;
  statement: string;
  imageUrl?: string;
  alternatives: ExamAlternative[];
  correctAnswer: "A" | "B" | "C" | "D" | "E";
  explanation?: string;
}

export interface ExamEdition {
  id: string;
  institutionId: string;
  year: number;
  title: string;
  description: string;
  totalQuestions: number;
  hasAnswerKey: boolean;
  hasOfficialPdf: boolean;
  pdfUrl?: string;
  status: ExamStatus;
  progress: number; // 0-100
  lastAccess?: string;
  type: ExamType;
  questions: ExamQuestion[];
}

export interface Institution {
  id: string;
  name: string;
  shortName: string;
  description: string;
  longDescription: string;
  color: string; // tailwind gradient class
  totalEditions: number;
  highlight?: boolean;
}

export const institutions: Institution[] = [
  {
    id: "enem",
    name: "Exame Nacional do Ensino Médio",
    shortName: "ENEM",
    description: "Principal porta de entrada para universidades brasileiras",
    longDescription:
      "O ENEM é a maior avaliação educacional do Brasil, aplicada anualmente pelo INEP. Resolva provas oficiais completas com gabarito, comentários e análise de desempenho por área de conhecimento.",
    color: "from-primary to-accent",
    totalEditions: 5,
    highlight: true,
  },
  {
    id: "fuvest",
    name: "Fundação Universitária para o Vestibular",
    shortName: "FUVEST",
    description: "Vestibular oficial da USP",
    longDescription: "Provas da Fuvest com foco em conhecimento aprofundado e raciocínio analítico.",
    color: "from-blue-500 to-purple-600",
    totalEditions: 3,
  },
  {
    id: "unicamp",
    name: "Comissão Permanente para os Vestibulares",
    shortName: "UNICAMP",
    description: "Vestibular da Universidade Estadual de Campinas",
    longDescription: "Vestibular Unicamp com questões dissertativas e analíticas.",
    color: "from-emerald-500 to-teal-600",
    totalEditions: 3,
  },
  {
    id: "unesp",
    name: "Vestibular Unesp",
    shortName: "UNESP",
    description: "Universidade Estadual Paulista",
    longDescription: "Provas oficiais da Unesp organizadas por edição.",
    color: "from-orange-500 to-rose-600",
    totalEditions: 2,
  },
];

const sampleAreas = [
  { area: "Linguagens", subject: "Português", day: 1 as const },
  { area: "Linguagens", subject: "Literatura", day: 1 as const },
  { area: "Humanas", subject: "História", day: 1 as const },
  { area: "Humanas", subject: "Geografia", day: 1 as const },
  { area: "Humanas", subject: "Filosofia", day: 1 as const },
  { area: "Natureza", subject: "Biologia", day: 2 as const },
  { area: "Natureza", subject: "Química", day: 2 as const },
  { area: "Natureza", subject: "Física", day: 2 as const },
  { area: "Matemática", subject: "Matemática", day: 2 as const },
];

const generateQuestions = (count: number): ExamQuestion[] =>
  Array.from({ length: count }, (_, i) => {
    const meta = sampleAreas[i % sampleAreas.length];
    const correct = (["A", "B", "C", "D", "E"] as const)[i % 5];
    return {
      id: `q-${i + 1}`,
      number: i + 1,
      area: meta.area,
      subject: meta.subject,
      day: meta.day,
      statement: `(${meta.subject}) Considere o enunciado da questão ${i + 1}. Em um contexto de avaliação de larga escala, analise a situação-problema apresentada e identifique entre as alternativas aquela que melhor responde à proposição. Esta questão envolve conceitos fundamentais de ${meta.subject.toLowerCase()} e exige interpretação cuidadosa do estudante para chegar à resposta correta.`,
      alternatives: [
        { label: "A", text: `Primeira alternativa relacionada ao tema de ${meta.subject.toLowerCase()}.` },
        { label: "B", text: `Segunda alternativa com abordagem distinta sobre o conceito apresentado.` },
        { label: "C", text: `Terceira alternativa que apresenta a resposta correta para o problema.` },
        { label: "D", text: `Quarta alternativa, plausível mas incorreta no contexto da questão.` },
        { label: "E", text: `Quinta alternativa, comum como distrator em avaliações.` },
      ],
      correctAnswer: correct,
      explanation: `A resposta correta é ${correct}. A análise do enunciado revela que o conceito central de ${meta.subject.toLowerCase()} aplicado ao problema indica essa alternativa como a única coerente.`,
    };
  });

export const examEditions: ExamEdition[] = [
  {
    id: "enem-2023",
    institutionId: "enem",
    year: 2023,
    title: "ENEM 2023",
    description: "Prova oficial aplicada em novembro de 2023, dias 1 e 2.",
    totalQuestions: 180,
    hasAnswerKey: true,
    hasOfficialPdf: true,
    status: "available",
    progress: 0,
    type: "official",
    questions: generateQuestions(20),
  },
  {
    id: "enem-2022",
    institutionId: "enem",
    year: 2022,
    title: "ENEM 2022",
    description: "Prova oficial aplicada em novembro de 2022. Inclui ambos os dias da aplicação.",
    totalQuestions: 180,
    hasAnswerKey: true,
    hasOfficialPdf: true,
    status: "in_progress",
    progress: 38,
    lastAccess: "Há 2 dias",
    type: "official",
    questions: generateQuestions(20),
  },
  {
    id: "enem-2021",
    institutionId: "enem",
    year: 2021,
    title: "ENEM 2021",
    description: "Prova oficial aplicada em novembro de 2021.",
    totalQuestions: 180,
    hasAnswerKey: true,
    hasOfficialPdf: true,
    status: "completed",
    progress: 100,
    lastAccess: "Há 2 semanas",
    type: "official",
    questions: generateQuestions(20),
  },
  {
    id: "enem-2020",
    institutionId: "enem",
    year: 2020,
    title: "ENEM 2020",
    description: "Prova oficial aplicada em janeiro de 2021 (ENEM 2020).",
    totalQuestions: 180,
    hasAnswerKey: true,
    hasOfficialPdf: false,
    status: "available",
    progress: 0,
    type: "official",
    questions: generateQuestions(20),
  },
  {
    id: "enem-2019",
    institutionId: "enem",
    year: 2019,
    title: "ENEM 2019",
    description: "Prova oficial aplicada em novembro de 2019.",
    totalQuestions: 180,
    hasAnswerKey: true,
    hasOfficialPdf: true,
    status: "available",
    progress: 0,
    type: "official",
    questions: generateQuestions(20),
  },
  {
    id: "fuvest-2023",
    institutionId: "fuvest",
    year: 2023,
    title: "FUVEST 2023 — 1ª fase",
    description: "Primeira fase da FUVEST, com 90 questões objetivas.",
    totalQuestions: 90,
    hasAnswerKey: true,
    hasOfficialPdf: true,
    status: "available",
    progress: 0,
    type: "official",
    questions: generateQuestions(15),
  },
  {
    id: "fuvest-2022",
    institutionId: "fuvest",
    year: 2022,
    title: "FUVEST 2022 — 1ª fase",
    description: "Primeira fase da FUVEST 2022.",
    totalQuestions: 90,
    hasAnswerKey: true,
    hasOfficialPdf: true,
    status: "available",
    progress: 0,
    type: "official",
    questions: generateQuestions(15),
  },
  {
    id: "unicamp-2023",
    institutionId: "unicamp",
    year: 2023,
    title: "UNICAMP 2023 — 1ª fase",
    description: "Vestibular Unicamp 2023.",
    totalQuestions: 72,
    hasAnswerKey: true,
    hasOfficialPdf: true,
    status: "available",
    progress: 0,
    type: "official",
    questions: generateQuestions(15),
  },
  {
    id: "unesp-2023",
    institutionId: "unesp",
    year: 2023,
    title: "UNESP 2023 — Meio de Ano",
    description: "Vestibular Unesp meio de ano de 2023.",
    totalQuestions: 90,
    hasAnswerKey: false,
    hasOfficialPdf: true,
    status: "available",
    progress: 0,
    type: "official",
    questions: generateQuestions(15),
  },
];

export const getInstitution = (id: string) => institutions.find((i) => i.id === id);
export const getEdition = (id: string) => examEditions.find((e) => e.id === id);
export const getEditionsByInstitution = (institutionId: string) =>
  examEditions.filter((e) => e.institutionId === institutionId).sort((a, b) => b.year - a.year);
