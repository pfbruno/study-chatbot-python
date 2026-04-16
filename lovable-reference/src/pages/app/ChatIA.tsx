import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Calculator,
  FlaskConical,
  Globe,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  subject?: string;
}

const subjectSuggestions = [
  { icon: Calculator, label: "Matemática", prompt: "Me explique o conceito de derivadas com exemplos práticos" },
  { icon: FlaskConical, label: "Química", prompt: "Quais são os principais tipos de ligações químicas?" },
  { icon: BookOpen, label: "Português", prompt: "Me ajude a entender figuras de linguagem com exemplos do ENEM" },
  { icon: Globe, label: "Geografia", prompt: "Explique os principais biomas brasileiros e suas características" },
  { icon: Pencil, label: "Redação", prompt: "Me dê dicas para fazer uma boa introdução na redação do ENEM" },
  { icon: Sparkles, label: "Física", prompt: "Explique as Leis de Newton de forma simples e com exemplos" },
];

const mockResponses: Record<string, string> = {
  default: `Ótima pergunta! Vou te ajudar com isso.

## Pontos principais

1. **Conceito fundamental**: Todo conteúdo tem uma base teórica que precisa ser compreendida antes da aplicação prática.

2. **Aplicação no ENEM**: As questões costumam cobrar interpretação e conexão entre conceitos, não apenas memorização.

3. **Dica de estudo**: Faça resumos com suas próprias palavras e pratique com questões anteriores.

> 💡 **Dica**: Tente resolver pelo menos 10 questões sobre este tema antes da prova!

Quer que eu aprofunde em algum desses pontos?`,
  matemática: `## Derivadas — Explicação Simplificada

A **derivada** mede a *taxa de variação* de uma função. Pense assim:

### Exemplo do dia a dia
Se você dirige um carro, a derivada da sua **posição** em relação ao tempo é a **velocidade**.

### Fórmula básica
$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$

### Regras principais
| Regra | Fórmula | Exemplo |
|-------|---------|---------|
| Potência | $(x^n)' = nx^{n-1}$ | $(x^3)' = 3x^2$ |
| Constante | $(c)' = 0$ | $(5)' = 0$ |
| Soma | $(f+g)' = f'+g'$ | $(x^2+3x)' = 2x+3$ |

> 💡 No ENEM, derivadas aparecem em questões de **máximos e mínimos** e **taxa de variação**.

Quer praticar com exercícios?`,
};

const ChatIA = () => {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Dúvida sobre Termoquímica",
      messages: [
        { id: "m1", role: "user", content: "O que é entalpia?", timestamp: new Date(Date.now() - 86400000) },
        { id: "m2", role: "assistant", content: "**Entalpia** (H) é a quantidade de energia contida em uma substância sob pressão constante.\n\n### Tipos:\n- **Exotérmica**: libera calor (ΔH < 0)\n- **Endotérmica**: absorve calor (ΔH > 0)\n\nÉ um dos temas mais cobrados no ENEM em Química!", timestamp: new Date(Date.now() - 86400000) },
      ],
      createdAt: new Date(Date.now() - 86400000),
      subject: "Química",
    },
    {
      id: "2",
      title: "Redação ENEM 2024",
      messages: [
        { id: "m3", role: "user", content: "Como estruturar uma redação nota 1000?", timestamp: new Date(Date.now() - 172800000) },
        { id: "m4", role: "assistant", content: "## Estrutura da Redação Nota 1000\n\n1. **Introdução**: Contextualização + tese clara\n2. **Desenvolvimento 1**: Argumento + repertório sociocultural\n3. **Desenvolvimento 2**: Segundo argumento + dados/citações\n4. **Conclusão**: Proposta de intervenção detalhada\n\n> Cada parágrafo deve ter entre 7-10 linhas.", timestamp: new Date(Date.now() - 172800000) },
      ],
      createdAt: new Date(Date.now() - 172800000),
      subject: "Redação",
    },
  ]);
  const [activeConversationId, setActiveConversationId] = useState<string>("1");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "Nova conversa",
      messages: [],
      createdAt: new Date(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    inputRef.current?.focus();
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveConversationId(remaining[0]?.id || "");
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          const title = c.messages.length === 0 ? content.trim().slice(0, 40) + "..." : c.title;
          return { ...c, title, messages: [...c.messages, userMsg] };
        }
        return c;
      })
    );
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const lowerContent = content.toLowerCase();
    let responseContent = mockResponses.default;
    if (lowerContent.includes("derivad") || lowerContent.includes("matemátic")) {
      responseContent = mockResponses.matemática;
    }

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: responseContent,
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId ? { ...c, messages: [...c.messages, assistantMsg] } : c
      )
    );
    setIsTyping(false);
  };

  const handleSuggestionClick = (prompt: string) => {
    if (!activeConversation || activeConversation.messages.length > 0) {
      createNewConversation();
      setTimeout(() => sendMessage(prompt), 100);
    } else {
      sendMessage(prompt);
    }
  };

  const renderMessage = (content: string) => {
    // Simple markdown-like rendering
    return content
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("## ")) return <h3 key={i} className="text-lg font-bold mt-3 mb-1 text-foreground">{line.slice(3)}</h3>;
        if (line.startsWith("### ")) return <h4 key={i} className="text-base font-semibold mt-2 mb-1 text-foreground">{line.slice(4)}</h4>;
        if (line.startsWith("> ")) return <blockquote key={i} className="border-l-2 border-primary pl-3 my-2 text-muted-foreground italic">{line.slice(2)}</blockquote>;
        if (line.startsWith("- ")) return <li key={i} className="ml-4 list-disc text-foreground/90">{renderInline(line.slice(2))}</li>;
        if (line.match(/^\d+\.\s/)) return <li key={i} className="ml-4 list-decimal text-foreground/90">{renderInline(line.replace(/^\d+\.\s/, ""))}</li>;
        if (line.startsWith("|")) return null; // Skip table rows for simplicity
        if (line.trim() === "") return <br key={i} />;
        return <p key={i} className="text-foreground/90 leading-relaxed">{renderInline(line)}</p>;
      });
  };

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{part.slice(1, -1)}</code>;
      return part;
    });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-4 md:-m-6">
      {/* Sidebar */}
      <div className="w-72 border-r border-border bg-card/50 flex flex-col shrink-0 hidden md:flex">
        <div className="p-3 border-b border-border">
          <Button onClick={createNewConversation} className="w-full gap-2" size="sm">
            <Plus className="w-4 h-4" /> Nova Conversa
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm",
                  conv.id === activeConversationId
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
                onClick={() => setActiveConversationId(conv.id)}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{conv.title}</p>
                  {conv.subject && (
                    <span className="text-xs opacity-60">{conv.subject}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConversation && activeConversation.messages.length > 0 ? (
          <>
            <ScrollArea className="flex-1 p-4 md:p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {activeConversation.messages.map((msg) => (
                  <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-card border border-border rounded-bl-md"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose-sm">{renderMessage(msg.content)}</div>
                      ) : (
                        <p className="leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full text-center space-y-8">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-foreground">StudyPro IA</h2>
                <p className="text-muted-foreground mt-2">Tire dúvidas, peça explicações e estude com inteligência artificial</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {subjectSuggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSuggestionClick(s.prompt)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all text-sm group"
                  >
                    <s.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4 bg-card/30">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }}
            className="max-w-3xl mx-auto flex gap-2"
          >
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pergunte qualquer coisa sobre seus estudos..."
              className="flex-1 bg-background"
              disabled={isTyping}
            />
            <Button type="submit" size="icon" disabled={!inputValue.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatIA;
