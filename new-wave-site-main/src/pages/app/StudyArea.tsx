import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  BookOpen,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
  Network,
  Check,
  X,
  Star,
  Clock,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Flashcards Data ---
interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  difficulty: "fácil" | "médio" | "difícil";
  mastered: boolean;
}

const mockFlashcards: Flashcard[] = [
  { id: "1", front: "O que é mitose?", back: "Divisão celular que gera duas células-filhas geneticamente idênticas à célula-mãe. Ocorre em células somáticas para crescimento e reparo.", subject: "Biologia", difficulty: "médio", mastered: false },
  { id: "2", front: "Fórmula da energia cinética", back: "Ec = ½mv²\n\nOnde:\n• m = massa (kg)\n• v = velocidade (m/s)\n• Ec = energia cinética (Joules)", subject: "Física", difficulty: "fácil", mastered: true },
  { id: "3", front: "O que foi a Revolução Francesa?", back: "Movimento político-social (1789-1799) que derrubou a monarquia absolutista na França. Lema: Liberdade, Igualdade e Fraternidade. Marco do fim do Antigo Regime.", subject: "História", difficulty: "médio", mastered: false },
  { id: "4", front: "Quais são as funções orgânicas oxigenadas?", back: "• Álcool (R-OH)\n• Fenol (Ar-OH)\n• Éter (R-O-R')\n• Aldeído (R-CHO)\n• Cetona (R-CO-R')\n• Ácido carboxílico (R-COOH)\n• Éster (R-COO-R')", subject: "Química", difficulty: "difícil", mastered: false },
  { id: "5", front: "O que é uma oração subordinada adverbial?", back: "Oração dependente que exerce função de advérbio na oração principal. Tipos: causal, temporal, condicional, concessiva, comparativa, consecutiva, conformativa, final, proporcional.", subject: "Português", difficulty: "médio", mastered: false },
  { id: "6", front: "Defina Produto Interno Bruto (PIB)", back: "Soma de todos os bens e serviços finais produzidos em um país durante um período. Mede a atividade econômica. PIB per capita = PIB / população.", subject: "Geografia", difficulty: "fácil", mastered: true },
];

// --- Summaries Data ---
interface Summary {
  id: string;
  title: string;
  subject: string;
  content: string;
  readTime: number;
  topics: string[];
}

const mockSummaries: Summary[] = [
  {
    id: "1",
    title: "Ecologia — Relações Ecológicas",
    subject: "Biologia",
    readTime: 5,
    topics: ["Harmônicas", "Desarmônicas", "Intraespecíficas", "Interespecíficas"],
    content: `## Relações Ecológicas

As relações ecológicas são interações entre os seres vivos em um ecossistema.

### Classificação
**Por espécie:**
- **Intraespecíficas**: entre indivíduos da mesma espécie
- **Interespecíficas**: entre espécies diferentes

**Por benefício:**
- **Harmônicas** (+/+ ou +/0): ambos se beneficiam ou um é neutro
- **Desarmônicas** (+/- ou -/-): pelo menos um é prejudicado

### Exemplos importantes para o ENEM
| Relação | Tipo | Exemplo |
|---------|------|---------|
| Mutualismo | +/+ | Líquens (alga + fungo) |
| Parasitismo | +/- | Lombriga no intestino |
| Predação | +/- | Leão e zebra |
| Competição | -/- | Plantas por luz solar |
| Comensalismo | +/0 | Rêmora e tubarão |`,
  },
  {
    id: "2",
    title: "Cinemática — MRU e MRUV",
    subject: "Física",
    readTime: 7,
    topics: ["MRU", "MRUV", "Gráficos", "Fórmulas"],
    content: `## Cinemática: MRU e MRUV

### MRU — Movimento Retilíneo Uniforme
- Velocidade constante (a = 0)
- Fórmula: **S = S₀ + v·t**
- Gráfico S×t: reta inclinada
- Gráfico v×t: reta horizontal

### MRUV — Movimento Retilíneo Uniformemente Variado
- Aceleração constante (a ≠ 0)
- Fórmulas:
  - **v = v₀ + a·t**
  - **S = S₀ + v₀·t + ½a·t²**
  - **v² = v₀² + 2·a·ΔS**

### Dica ENEM
Analise sempre os gráficos! A área sob o gráfico v×t representa o deslocamento.`,
  },
  {
    id: "3",
    title: "Brasil Colônia — Ciclos Econômicos",
    subject: "História",
    readTime: 6,
    topics: ["Pau-Brasil", "Açúcar", "Ouro", "Café"],
    content: `## Ciclos Econômicos do Brasil Colônia

### 1. Pau-Brasil (1500-1530)
- Exploração extrativista
- Mão de obra indígena (escambo)
- Feitorias no litoral

### 2. Cana-de-Açúcar (1530-1700)
- Plantation: latifúndio + monocultura + exportação
- Mão de obra escrava africana
- Engenhos no Nordeste (PE e BA)

### 3. Mineração (1700-1789)
- Ouro e diamantes em Minas Gerais
- Urbanização do interior
- Derrama e Inconfidência Mineira

### Conexão ENEM
As estruturas coloniais (latifúndio, monocultura, escravidão) explicam desigualdades atuais.`,
  },
];

// --- Mind Maps Data ---
interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
  color?: string;
}

interface MindMap {
  id: string;
  title: string;
  subject: string;
  root: MindMapNode;
}

const mockMindMaps: MindMap[] = [
  {
    id: "1",
    title: "Genética — Leis de Mendel",
    subject: "Biologia",
    root: {
      id: "r1",
      label: "Leis de Mendel",
      color: "primary",
      children: [
        {
          id: "n1",
          label: "1ª Lei — Segregação",
          children: [
            { id: "n1a", label: "Monoibridismo" },
            { id: "n1b", label: "Genótipo × Fenótipo" },
            { id: "n1c", label: "Dominância completa" },
          ],
        },
        {
          id: "n2",
          label: "2ª Lei — Segregação Independente",
          children: [
            { id: "n2a", label: "Diibridismo" },
            { id: "n2b", label: "Proporção 9:3:3:1" },
          ],
        },
        {
          id: "n3",
          label: "Extensões",
          children: [
            { id: "n3a", label: "Codominância" },
            { id: "n3b", label: "Herança ligada ao sexo" },
            { id: "n3c", label: "Alelos múltiplos (ABO)" },
          ],
        },
      ],
    },
  },
  {
    id: "2",
    title: "Eletricidade — Circuitos",
    subject: "Física",
    root: {
      id: "r2",
      label: "Circuitos Elétricos",
      color: "accent",
      children: [
        {
          id: "e1",
          label: "Grandezas",
          children: [
            { id: "e1a", label: "Tensão (V)" },
            { id: "e1b", label: "Corrente (A)" },
            { id: "e1c", label: "Resistência (Ω)" },
          ],
        },
        {
          id: "e2",
          label: "Leis de Ohm",
          children: [
            { id: "e2a", label: "V = R·I" },
            { id: "e2b", label: "R = ρ·L/A" },
          ],
        },
        {
          id: "e3",
          label: "Associação",
          children: [
            { id: "e3a", label: "Série: Req = R1+R2" },
            { id: "e3b", label: "Paralelo: 1/Req = 1/R1+1/R2" },
          ],
        },
      ],
    },
  },
];

type TabType = "flashcards" | "resumos" | "mapas";

const StudyArea = () => {
  const [activeTab, setActiveTab] = useState<TabType>("flashcards");

  const tabs = [
    { id: "flashcards" as TabType, label: "Flashcards", icon: Layers, count: mockFlashcards.length },
    { id: "resumos" as TabType, label: "Resumos", icon: FileText, count: mockSummaries.length },
    { id: "mapas" as TabType, label: "Mapas Mentais", icon: Network, count: mockMindMaps.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          Área de Estudo
        </h1>
        <p className="text-muted-foreground mt-1">Flashcards, resumos inteligentes e mapas mentais para acelerar seu aprendizado</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-[1px]",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <Badge variant="secondary" className="text-xs px-1.5 py-0">{tab.count}</Badge>
          </button>
        ))}
      </div>

      {activeTab === "flashcards" && <FlashcardsTab />}
      {activeTab === "resumos" && <SummariesTab />}
      {activeTab === "mapas" && <MindMapsTab />}
    </div>
  );
};

// --- Flashcards Tab ---
const FlashcardsTab = () => {
  const [cards, setCards] = useState(mockFlashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string | null>(null);

  const filtered = filterSubject ? cards.filter((c) => c.subject === filterSubject) : cards;
  const current = filtered[currentIndex];
  const subjects = [...new Set(cards.map((c) => c.subject))];
  const mastered = cards.filter((c) => c.mastered).length;

  const next = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i + 1) % filtered.length);
  };
  const prev = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i - 1 + filtered.length) % filtered.length);
  };
  const toggleMastered = () => {
    setCards((prev) => prev.map((c) => (c.id === current.id ? { ...c, mastered: !c.mastered } : c)));
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/50"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{cards.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card className="bg-card/50"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{mastered}</p>
          <p className="text-xs text-muted-foreground">Dominados</p>
        </CardContent></Card>
        <Card className="bg-card/50"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">{cards.length - mastered}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </CardContent></Card>
        <Card className="bg-card/50"><CardContent className="p-4 text-center">
          <Progress value={(mastered / cards.length) * 100} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-1">{Math.round((mastered / cards.length) * 100)}% completo</p>
        </CardContent></Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={filterSubject === null ? "default" : "outline"} size="sm" onClick={() => { setFilterSubject(null); setCurrentIndex(0); }}>
          Todas
        </Button>
        {subjects.map((s) => (
          <Button key={s} variant={filterSubject === s ? "default" : "outline"} size="sm" onClick={() => { setFilterSubject(s); setCurrentIndex(0); setFlipped(false); }}>
            {s}
          </Button>
        ))}
      </div>

      {/* Card */}
      {current && (
        <div className="flex flex-col items-center gap-4">
          <div
            onClick={() => setFlipped(!flipped)}
            className={cn(
              "w-full max-w-lg min-h-[280px] rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center p-8 text-center relative",
              flipped
                ? "bg-primary/5 border-primary/30"
                : "bg-card border-border hover:border-primary/20"
            )}
          >
            <Badge className="absolute top-3 left-3" variant="secondary">{current.subject}</Badge>
            <Badge className={cn("absolute top-3 right-3", current.difficulty === "difícil" ? "bg-destructive/10 text-destructive" : current.difficulty === "médio" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary")} variant="secondary">
              {current.difficulty}
            </Badge>
            {current.mastered && <Star className="absolute bottom-3 right-3 w-5 h-5 text-accent fill-accent" />}

            {!flipped ? (
              <>
                <Eye className="w-6 h-6 text-muted-foreground mb-3" />
                <p className="text-lg font-medium text-foreground">{current.front}</p>
                <p className="text-xs text-muted-foreground mt-4">Clique para ver a resposta</p>
              </>
            ) : (
              <>
                <EyeOff className="w-6 h-6 text-primary mb-3" />
                <div className="text-foreground/90 text-sm leading-relaxed whitespace-pre-line">{current.back}</div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={prev}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center">{currentIndex + 1} / {filtered.length}</span>
            <Button variant="outline" size="icon" onClick={next}><ChevronRight className="w-4 h-4" /></Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={toggleMastered}>
              {current.mastered ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              {current.mastered ? "Desmarcar" : "Dominei!"}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setCurrentIndex(0); setFlipped(false); }}>
              <RotateCcw className="w-3.5 h-3.5" /> Recomeçar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Summaries Tab ---
const SummariesTab = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = mockSummaries.find((s) => s.id === selectedId);

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold mt-4 mb-2 text-foreground">{line.slice(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-3 mb-1 text-foreground">{line.slice(4)}</h3>;
      if (line.startsWith("- ")) return <li key={i} className="ml-4 list-disc text-foreground/90 text-sm">{renderBold(line.slice(2))}</li>;
      if (line.startsWith("|")) return null;
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="text-foreground/90 text-sm leading-relaxed">{renderBold(line)}</p>;
    });
  };

  const renderBold = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong> : p
    );
  };

  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <Card className="bg-card/50">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{selected.subject}</Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {selected.readTime} min de leitura
              </span>
            </div>
            <CardTitle className="text-xl">{selected.title}</CardTitle>
            <div className="flex gap-1.5 flex-wrap mt-2">
              {selected.topics.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose-sm">{renderContent(selected.content)}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {mockSummaries.map((s) => (
        <Card
          key={s.id}
          className="bg-card/50 hover:border-primary/30 transition-colors cursor-pointer group"
          onClick={() => setSelectedId(s.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{s.subject}</Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {s.readTime} min
              </span>
            </div>
            <CardTitle className="text-base mt-2 group-hover:text-primary transition-colors">{s.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1.5 flex-wrap">
              {s.topics.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// --- Mind Maps Tab ---
const MindMapsTab = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = mockMindMaps.find((m) => m.id === selectedId);

  const renderNode = (node: MindMapNode, level: number = 0) => {
    const isRoot = level === 0;
    return (
      <div key={node.id} className={cn("flex flex-col", !isRoot && "ml-6 mt-2")}>
        <div
          className={cn(
            "px-4 py-2 rounded-xl border-2 inline-flex items-center gap-2 w-fit transition-colors",
            isRoot
              ? "bg-primary/10 border-primary text-primary font-bold text-base"
              : level === 1
              ? "bg-card border-border text-foreground font-semibold text-sm"
              : "bg-muted/50 border-transparent text-foreground/80 text-sm"
          )}
        >
          {isRoot && <Brain className="w-4 h-4" />}
          {node.label}
        </div>
        {node.children && (
          <div className="border-l-2 border-border/50 ml-4 pl-0 mt-1">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <Card className="bg-card/50">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">{selected.subject}</Badge>
            <CardTitle className="text-xl mt-2">{selected.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              {renderNode(selected.root)}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {mockMindMaps.map((m) => (
        <Card
          key={m.id}
          className="bg-card/50 hover:border-primary/30 transition-colors cursor-pointer group"
          onClick={() => setSelectedId(m.id)}
        >
          <CardHeader>
            <Badge variant="secondary" className="w-fit">{m.subject}</Badge>
            <CardTitle className="text-base mt-2 group-hover:text-primary transition-colors">{m.title}</CardTitle>
            <CardDescription>
              {m.root.children?.length || 0} ramificações principais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {m.root.children?.map((c) => (
                <Badge key={c.id} variant="outline" className="text-xs">{c.label}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StudyArea;
