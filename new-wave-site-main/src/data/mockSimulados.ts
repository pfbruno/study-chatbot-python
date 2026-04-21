export interface TeacherComment {
  teacherName: string;
  teacherAvatar: string;
  content: string;
  type: "explanation" | "trap" | "strategy" | "observation";
}

export interface Question {
  id: string;
  number: number;
  text: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  alternatives: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  teacherComments: TeacherComment[];
  avgTime: number; // seconds
  accuracyRate: number;
  errorRate: number;
  mostChosenAlternative: string;
}

export interface Simulado {
  id: string;
  title: string;
  description: string;
  subject: string;
  subjects: string[];
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  duration: number; // minutes
  rating: number;
  ratingCount: number;
  timesCompleted: number;
  author: string;
  authorType: "student" | "teacher";
  createdAt: string;
  tags: string[];
  isPremium: boolean;
  questions: Question[];
}

const teacherComments: TeacherComment[] = [
  {
    teacherName: "Prof. Ana Silva",
    teacherAvatar: "AS",
    content: "Atenção: essa questão costuma confundir pela semelhança entre as alternativas B e D. A chave está no enunciado — leia com calma.",
    type: "trap",
  },
  {
    teacherName: "Prof. Carlos Mendes",
    teacherAvatar: "CM",
    content: "Para resolver essa questão rapidamente em prova, elimine as alternativas absurdas primeiro. Geralmente 2 das 5 são claramente erradas.",
    type: "strategy",
  },
  {
    teacherName: "Prof. Ana Silva",
    teacherAvatar: "AS",
    content: "Esse tema é recorrente no ENEM desde 2018. Vale a pena revisar os conceitos fundamentais.",
    type: "observation",
  },
];

function generateQuestions(subject: string, count: number): Question[] {
  const subjects: Record<string, { texts: string[]; alternatives: string[][] }> = {
    Biologia: {
      texts: [
        "A mitose é um processo de divisão celular que resulta em duas células geneticamente idênticas à célula-mãe. Sobre esse processo, é correto afirmar que:",
        "Os ecossistemas são formados por componentes bióticos e abióticos que interagem entre si. Assinale a alternativa que apresenta apenas fatores abióticos:",
        "A fotossíntese é um processo fundamental para a vida na Terra. Sobre esse processo, assinale a alternativa correta:",
        "O DNA é a molécula responsável pelo armazenamento da informação genética. Sobre sua estrutura, é correto afirmar:",
        "A evolução biológica é o processo de modificação das espécies ao longo do tempo. Segundo a teoria de Darwin:",
      ],
      alternatives: [
        ["Ocorre apenas em células somáticas", "Resulta em células haploides", "Possui apenas uma fase de divisão", "Não envolve replicação do DNA", "Ocorre apenas em organismos unicelulares"],
        ["Temperatura, luz e umidade", "Plantas, fungos e bactérias", "Herbívoros e carnívoros", "Produtores e consumidores", "Parasitas e hospedeiros"],
        ["Ocorre no citoplasma", "Produz CO₂ como subproduto principal", "Utiliza luz solar como fonte de energia", "Consome oxigênio", "Ocorre em todos os seres vivos"],
        ["É formado por uma fita simples", "Possui uracila como base nitrogenada", "Tem estrutura de dupla hélice", "É encontrado apenas no citoplasma", "Não possui ligações de hidrogênio"],
        ["As espécies são imutáveis", "A seleção natural favorece os mais adaptados", "Características adquiridas são herdadas", "A evolução ocorre por saltos", "Todos os organismos evoluem na mesma velocidade"],
      ],
    },
    Matemática: {
      texts: [
        "Uma função f(x) = 2x² - 8x + 6 possui raízes reais. A soma das raízes dessa função é:",
        "Em uma progressão aritmética, o primeiro termo é 3 e a razão é 5. O vigésimo termo dessa PA é:",
        "Um triângulo retângulo tem catetos medindo 6 cm e 8 cm. A hipotenusa mede:",
        "A probabilidade de se retirar uma carta de copas de um baralho comum de 52 cartas é:",
        "O logaritmo de 1000 na base 10 é igual a:",
      ],
      alternatives: [
        ["2", "4", "6", "-4", "8"],
        ["98", "100", "95", "103", "97"],
        ["10 cm", "12 cm", "14 cm", "9 cm", "11 cm"],
        ["1/2", "1/3", "1/4", "1/13", "1/52"],
        ["2", "3", "4", "10", "100"],
      ],
    },
    Física: {
      texts: [
        "Um corpo em movimento retilíneo uniforme percorre 100 metros em 20 segundos. Sua velocidade é:",
        "A segunda lei de Newton estabelece que a força resultante sobre um corpo é igual a:",
        "A energia cinética de um corpo de massa 2 kg movendo-se a 10 m/s é:",
        "Sobre ondas eletromagnéticas, é correto afirmar:",
        "Um circuito elétrico com resistência de 10Ω e tensão de 20V possui corrente elétrica de:",
      ],
      alternatives: [
        ["5 m/s", "10 m/s", "2 m/s", "20 m/s", "50 m/s"],
        ["Massa × Aceleração", "Massa × Velocidade", "Peso × Aceleração", "Massa / Tempo", "Força × Distância"],
        ["100 J", "200 J", "50 J", "20 J", "10 J"],
        ["Precisam de meio material para se propagar", "Viajam na velocidade da luz no vácuo", "São ondas mecânicas", "Não transportam energia", "São sempre visíveis"],
        ["2 A", "0.5 A", "200 A", "10 A", "5 A"],
      ],
    },
  };

  const subjectData = subjects[subject] || subjects["Biologia"];
  const difficulties: ("easy" | "medium" | "hard")[] = ["easy", "medium", "hard"];
  const labels = ["A", "B", "C", "D", "E"];

  return Array.from({ length: count }, (_, i) => {
    const qi = i % subjectData.texts.length;
    const diff = difficulties[i % 3];
    return {
      id: `q-${subject}-${i + 1}`,
      number: i + 1,
      text: subjectData.texts[qi],
      subject,
      difficulty: diff,
      alternatives: subjectData.alternatives[qi].map((text, j) => ({
        label: labels[j],
        text,
      })),
      correctAnswer: labels[0],
      explanation: `A alternativa correta é a ${labels[0]}. Este é um conceito fundamental de ${subject} frequentemente cobrado em vestibulares e no ENEM.`,
      teacherComments: [teacherComments[i % teacherComments.length]],
      avgTime: 60 + Math.floor(Math.random() * 120),
      accuracyRate: 30 + Math.floor(Math.random() * 50),
      errorRate: 0,
      mostChosenAlternative: labels[Math.floor(Math.random() * 5)],
    };
  }).map((q) => ({ ...q, errorRate: 100 - q.accuracyRate }));
}

export const mockSimulados: Simulado[] = [
  {
    id: "sim-1",
    title: "ENEM 2024 — Ciências da Natureza",
    description: "Simulado completo baseado no padrão ENEM com questões de Biologia, Química e Física.",
    subject: "Ciências da Natureza",
    subjects: ["Biologia", "Química", "Física"],
    difficulty: "medium",
    questionCount: 10,
    duration: 30,
    rating: 4.7,
    ratingCount: 234,
    timesCompleted: 1847,
    author: "Prof. Ana Silva",
    authorType: "teacher",
    createdAt: "2024-03-15",
    tags: ["ENEM", "Ciências", "2024"],
    isPremium: false,
    questions: generateQuestions("Biologia", 10),
  },
  {
    id: "sim-2",
    title: "Matemática FUVEST — Funções e Geometria",
    description: "Simulado focado nos temas mais cobrados pela FUVEST em Matemática.",
    subject: "Matemática",
    subjects: ["Matemática"],
    difficulty: "hard",
    questionCount: 10,
    duration: 45,
    rating: 4.9,
    ratingCount: 189,
    timesCompleted: 956,
    author: "Prof. Carlos Mendes",
    authorType: "teacher",
    createdAt: "2024-02-20",
    tags: ["FUVEST", "Matemática", "Funções"],
    isPremium: true,
    questions: generateQuestions("Matemática", 10),
  },
  {
    id: "sim-3",
    title: "Física — Mecânica e Termodinâmica",
    description: "Questões selecionadas de mecânica e termodinâmica para vestibulares.",
    subject: "Física",
    subjects: ["Física"],
    difficulty: "medium",
    questionCount: 10,
    duration: 35,
    rating: 4.5,
    ratingCount: 312,
    timesCompleted: 2103,
    author: "João Pedro",
    authorType: "student",
    createdAt: "2024-03-01",
    tags: ["Física", "Mecânica", "Vestibular"],
    isPremium: false,
    questions: generateQuestions("Física", 10),
  },
  {
    id: "sim-4",
    title: "Biologia — Genética e Evolução",
    description: "Simulado aprofundado em genética mendeliana, molecular e evolução biológica.",
    subject: "Biologia",
    subjects: ["Biologia"],
    difficulty: "hard",
    questionCount: 10,
    duration: 40,
    rating: 4.8,
    ratingCount: 156,
    timesCompleted: 723,
    author: "Prof. Ana Silva",
    authorType: "teacher",
    createdAt: "2024-01-10",
    tags: ["Biologia", "Genética", "Evolução"],
    isPremium: true,
    questions: generateQuestions("Biologia", 10),
  },
  {
    id: "sim-5",
    title: "ENEM — Matemática e suas Tecnologias",
    description: "45 questões no padrão ENEM para treinar matemática completa.",
    subject: "Matemática",
    subjects: ["Matemática"],
    difficulty: "easy",
    questionCount: 10,
    duration: 25,
    rating: 4.3,
    ratingCount: 567,
    timesCompleted: 4521,
    author: "Maria Clara",
    authorType: "student",
    createdAt: "2024-03-20",
    tags: ["ENEM", "Matemática", "Básico"],
    isPremium: false,
    questions: generateQuestions("Matemática", 10),
  },
  {
    id: "sim-6",
    title: "Física UNICAMP — Eletromagnetismo",
    description: "Simulado de alta dificuldade focado em eletromagnetismo para UNICAMP.",
    subject: "Física",
    subjects: ["Física"],
    difficulty: "hard",
    questionCount: 10,
    duration: 50,
    rating: 4.6,
    ratingCount: 98,
    timesCompleted: 412,
    author: "Prof. Ricardo Lima",
    authorType: "teacher",
    createdAt: "2024-02-05",
    tags: ["UNICAMP", "Física", "Eletromagnetismo"],
    isPremium: true,
    questions: generateQuestions("Física", 10),
  },
];

export const subjects = ["Todas", "Biologia", "Matemática", "Física", "Química", "História", "Geografia", "Português"];
export const difficulties = [
  { value: "all", label: "Todas" },
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Médio" },
  { value: "hard", label: "Difícil" },
];
