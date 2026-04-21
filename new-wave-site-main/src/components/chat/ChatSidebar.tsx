import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Sparkles,
  FileText,
  BookOpen,
  ListChecks,
  CalendarRange,
  Target,
  Layers,
  Crown,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConversationItem {
  id: string;
  title: string;
  subject?: string;
  updatedAt: Date;
}

interface ChatSidebarProps {
  conversations: ConversationItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onShortcut: (prompt: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
}

const shortcuts = [
  { icon: FileText, label: "Resumir conteúdo", prompt: "Crie um resumo estruturado sobre o seguinte tema:" },
  { icon: BookOpen, label: "Explicar tema", prompt: "Explique de forma didática, com exemplos, o tema:" },
  { icon: ListChecks, label: "Criar questões", prompt: "Gere 5 questões estilo ENEM com gabarito sobre:" },
  { icon: CalendarRange, label: "Montar cronograma", prompt: "Monte um cronograma de estudos semanal para:" },
  { icon: Target, label: "Revisar erros", prompt: "Quero revisar meus erros recentes em:" },
  { icon: Layers, label: "Gerar flashcards", prompt: "Crie 10 flashcards (pergunta/resposta) sobre:" },
];

const formatRelative = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const day = 86_400_000;
  if (diff < day) return "Hoje";
  if (diff < 2 * day) return "Ontem";
  if (diff < 7 * day) return `${Math.floor(diff / day)}d atrás`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

export const ChatSidebar = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onShortcut,
  search,
  onSearchChange,
}: ChatSidebarProps) => {
  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <aside className="w-80 shrink-0 border-r border-border bg-card/40 backdrop-blur-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <Button onClick={onNew} className="w-full gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.6)]">
          <Plus className="w-4 h-4" />
          Nova conversa
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar conversas..."
            className="pl-9 h-9 bg-background/60"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Atalhos */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Atalhos de estudo
            </h3>
            <Sparkles className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {shortcuts.map((s) => (
              <button
                key={s.label}
                onClick={() => onShortcut(s.prompt)}
                className="group flex flex-col items-start gap-2 p-3 rounded-xl border border-border bg-background/40 hover:bg-background/80 hover:border-primary/40 transition-all text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <s.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground/90 leading-tight">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Histórico */}
        <div className="px-4 pb-4 space-y-2">
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Histórico
            </h3>
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {conversations.length}
            </Badge>
          </div>
          <div className="space-y-1">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Nenhuma conversa encontrada
              </p>
            )}
            {filtered.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "group flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all border",
                  conv.id === activeId
                    ? "bg-primary/10 border-primary/30 text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <MessageSquare
                  className={cn(
                    "w-4 h-4 shrink-0 mt-0.5",
                    conv.id === activeId ? "text-primary" : "text-muted-foreground/60",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{conv.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {conv.subject && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-medium">
                        {conv.subject}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/70">
                      {formatRelative(conv.updatedAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 shrink-0 w-6 h-6 rounded flex items-center justify-center hover:bg-destructive/15 hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Plano */}
      <div className="p-4 border-t border-border">
        <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-accent/10 p-4">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Crown className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Plano Free</p>
                <p className="text-[10px] text-muted-foreground">12/30 mensagens hoje</p>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-background/50 overflow-hidden">
              <div className="h-full w-[40%] bg-gradient-to-r from-primary to-accent rounded-full" />
            </div>
            <Button size="sm" className="w-full gap-1.5 bg-foreground text-background hover:bg-foreground/90 h-8 text-xs">
              <Zap className="w-3 h-3" />
              Upgrade para Pro
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};
