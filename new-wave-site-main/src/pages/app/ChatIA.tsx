import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatSidebar, type ConversationItem } from "@/components/chat/ChatSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { ChatTypingIndicator } from "@/components/chat/ChatTypingIndicator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation extends ConversationItem {
  messages: Message[];
}

const mockResponses: Record<string, string> = {
  default: `Ótima pergunta! Vou te ajudar com isso de forma estruturada.

## Pontos principais

1. **Conceito fundamental**: Todo conteúdo tem uma base teórica que precisa ser compreendida antes da aplicação prática.
2. **Aplicação no ENEM**: As questões costumam cobrar interpretação e conexão entre conceitos, não apenas memorização.
3. **Dica de estudo**: Faça resumos com suas próprias palavras e pratique com questões anteriores.

> 💡 **Dica**: Tente resolver pelo menos 10 questões sobre este tema antes da prova!

Quer que eu aprofunde em algum desses pontos ou gere um material de revisão?`,
  matematica: `## Derivadas — Explicação completa

A **derivada** mede a *taxa de variação* de uma função em relação a uma variável.

### Intuição
Se você dirige um carro, a derivada da sua **posição** em relação ao tempo é a **velocidade**. Já a derivada da velocidade é a **aceleração**.

### Regras essenciais
- **Potência**: a derivada de \`x^n\` é \`n·x^(n-1)\`
- **Constante**: a derivada de uma constante é sempre zero
- **Soma**: a derivada da soma é a soma das derivadas
- **Produto**: \`(f·g)' = f'·g + f·g'\`

### Onde aparece no ENEM
1. Problemas de **máximos e mínimos** (otimização)
2. **Taxa de variação** em situações reais (custo, velocidade, crescimento)
3. Análise de **gráficos** de funções

> 💡 Lembre-se: a derivada é o coeficiente angular da reta tangente ao gráfico naquele ponto.

Quer praticar com 5 questões sobre o tema?`,
};

const ChatIA = () => {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Dúvida sobre Termoquímica",
      subject: "Química",
      updatedAt: new Date(Date.now() - 3_600_000),
      messages: [
        {
          id: "m1",
          role: "user",
          content: "O que é entalpia e como ela aparece no ENEM?",
          timestamp: new Date(Date.now() - 3_600_000),
        },
        {
          id: "m2",
          role: "assistant",
          content: `## Entalpia (H)

**Entalpia** é a quantidade de energia armazenada em uma substância sob pressão constante.

### Tipos de reação
- **Exotérmica**: libera calor — ΔH < 0
- **Endotérmica**: absorve calor — ΔH > 0

### Como cai no ENEM
1. Cálculo de \`ΔH\` usando a Lei de Hess
2. Interpretação de **diagramas de energia**
3. Aplicação em combustão, fotossíntese e queima de combustíveis

> 💡 Foque em entender o **sinal** do ΔH antes de decorar fórmulas.

Quer que eu gere flashcards com as principais reações?`,
          timestamp: new Date(Date.now() - 3_500_000),
        },
      ],
    },
    {
      id: "2",
      title: "Estrutura da Redação Nota 1000",
      subject: "Redação",
      updatedAt: new Date(Date.now() - 86_400_000),
      messages: [
        {
          id: "m3",
          role: "user",
          content: "Como estruturar uma redação nota 1000 no ENEM?",
          timestamp: new Date(Date.now() - 86_400_000),
        },
        {
          id: "m4",
          role: "assistant",
          content: `## Estrutura da Redação Nota 1000

1. **Introdução** — contextualização + tese clara
2. **Desenvolvimento 1** — argumento + repertório sociocultural
3. **Desenvolvimento 2** — segundo argumento + dados ou citações
4. **Conclusão** — proposta de intervenção detalhada (5 elementos)

> Cada parágrafo deve ter entre 7 e 10 linhas para manter equilíbrio.`,
          timestamp: new Date(Date.now() - 86_400_000),
        },
      ],
    },
    {
      id: "3",
      title: "Cronograma 4 semanas pré-ENEM",
      subject: "Cronograma",
      updatedAt: new Date(Date.now() - 3 * 86_400_000),
      messages: [],
    },
  ]);

  const [activeId, setActiveId] = useState("1");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, isTyping]);

  const createNew = () => {
    const id = Date.now().toString();
    const conv: Conversation = {
      id,
      title: "Nova conversa",
      updatedAt: new Date(),
      messages: [],
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(id);
    setMobileSidebarOpen(false);
  };

  const deleteConv = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const next = conversations.find((c) => c.id !== id);
      setActiveId(next?.id || "");
    }
    toast.success("Conversa removida");
  };

  const sendMessage = async (content: string, targetId?: string) => {
    const text = content.trim();
    if (!text || isTyping) return;

    let convId = targetId ?? activeId;
    if (!convId) {
      convId = Date.now().toString();
      const conv: Conversation = {
        id: convId,
        title: text.slice(0, 40),
        updatedAt: new Date(),
        messages: [],
      };
      setConversations((prev) => [conv, ...prev]);
      setActiveId(convId);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const title = c.messages.length === 0 ? text.slice(0, 40) : c.title;
        return { ...c, title, updatedAt: new Date(), messages: [...c.messages, userMsg] };
      }),
    );
    setInputValue("");
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 1100 + Math.random() * 700));

    const lower = text.toLowerCase();
    let response = mockResponses.default;
    if (lower.includes("derivad") || lower.includes("matemátic")) response = mockResponses.matematica;

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, updatedAt: new Date(), messages: [...c.messages, aiMsg] } : c,
      ),
    );
    setIsTyping(false);
  };

  const handleShortcut = (prompt: string) => {
    setInputValue(prompt + " ");
  };

  const handleEmptyPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleAction = (action: "summary" | "flashcards" | "questions" | "save") => {
    const labels = {
      summary: "Resumo gerado e salvo na Área de Estudo",
      flashcards: "Flashcards criados com base na resposta",
      questions: "Questões geradas para você praticar",
      save: "Resposta salva nos seus materiais",
    };
    toast.success(labels[action]);
  };

  const sidebarProps = {
    conversations,
    activeId,
    onSelect: (id: string) => {
      setActiveId(id);
      setMobileSidebarOpen(false);
    },
    onNew: createNew,
    onDelete: deleteConv,
    onShortcut: handleShortcut,
    search,
    onSearchChange: setSearch,
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-4 md:-m-6 bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <ChatSidebar {...sidebarProps} />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[320px] border-r border-border">
          <ChatSidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <ChatHeader
          title={active?.title}
          subject={active?.subject}
          onToggleSidebar={() => setMobileSidebarOpen(true)}
        />

        {active && active.messages.length > 0 ? (
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
              {active.messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  timestamp={m.timestamp}
                  onAction={handleAction}
                />
              ))}
              {isTyping && <ChatTypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 overflow-hidden">
            <ChatEmptyState onSelectPrompt={handleEmptyPrompt} />
          </div>
        )}

        <ChatComposer
          value={inputValue}
          onChange={setInputValue}
          onSubmit={() => sendMessage(inputValue)}
          disabled={isTyping}
          isStreaming={isTyping}
          onStop={() => setIsTyping(false)}
        />
      </main>
    </div>
  );
};

export default ChatIA;
