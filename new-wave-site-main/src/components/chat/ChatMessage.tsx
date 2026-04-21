import { Bot, User, Copy, RefreshCw, ThumbsUp, ThumbsDown, FileText, Layers, ListChecks, Bookmark, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  onAction?: (action: "summary" | "flashcards" | "questions" | "save") => void;
}

const renderInline = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-[0.85em] font-mono text-primary">{part.slice(1, -1)}</code>;
    return part;
  });
};

const renderContent = (content: string) => {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let listBuffer: { ordered: boolean; items: string[] } | null = null;

  const flushList = () => {
    if (!listBuffer) return;
    const Tag = listBuffer.ordered ? "ol" : "ul";
    elements.push(
      <Tag
        key={`list-${elements.length}`}
        className={cn(
          "my-2 space-y-1.5 pl-5",
          listBuffer.ordered ? "list-decimal" : "list-disc",
          "marker:text-primary/60",
        )}
      >
        {listBuffer.items.map((item, i) => (
          <li key={i} className="text-foreground/90 leading-relaxed">
            {renderInline(item)}
          </li>
        ))}
      </Tag>,
    );
    listBuffer = null;
  };

  lines.forEach((line, i) => {
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-foreground font-heading">
          {line.slice(3)}
        </h3>,
      );
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={i} className="text-base font-semibold mt-3 mb-1.5 text-foreground">
          {line.slice(4)}
        </h4>,
      );
    } else if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote key={i} className="border-l-2 border-primary/60 bg-primary/5 pl-3 pr-2 py-2 my-2 rounded-r text-sm text-foreground/80">
          {renderInline(line.slice(2))}
        </blockquote>,
      );
    } else if (line.startsWith("- ")) {
      if (!listBuffer || listBuffer.ordered) {
        flushList();
        listBuffer = { ordered: false, items: [] };
      }
      listBuffer.items.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      if (!listBuffer || !listBuffer.ordered) {
        flushList();
        listBuffer = { ordered: true, items: [] };
      }
      listBuffer.items.push(line.replace(/^\d+\.\s/, ""));
    } else if (line.trim() === "") {
      flushList();
      elements.push(<div key={i} className="h-2" />);
    } else if (line.startsWith("|")) {
      // skip simple table rendering
    } else {
      flushList();
      elements.push(
        <p key={i} className="text-foreground/90 leading-relaxed">
          {renderInline(line)}
        </p>,
      );
    }
  });
  flushList();
  return elements;
};

const formatTime = (d: Date) =>
  d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const ChatMessage = ({ role, content, timestamp, onAction }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copiado para a área de transferência");
    setTimeout(() => setCopied(false), 2000);
  };

  if (role === "user") {
    return (
      <div className="flex gap-3 justify-end group animate-fade-in-up">
        <div className="flex flex-col items-end max-w-[78%]">
          <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-4 py-3 shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.5)]">
            <p className="leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(timestamp)}
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 group animate-fade-in-up">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shrink-0 mt-1 shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.6)]">
        <Bot className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0 max-w-[88%]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-foreground">StudyPro IA</span>
          <span className="text-[10px] text-muted-foreground">{formatTime(timestamp)}</span>
        </div>
        <div className="rounded-2xl rounded-tl-md bg-card border border-border px-4 py-3.5 shadow-sm">
          <div className="space-y-1">{renderContent(content)}</div>
        </div>

        {/* Ações pós-resposta */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1.5 border-border bg-background/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
            onClick={() => onAction?.("summary")}
          >
            <FileText className="w-3 h-3" />
            Resumo
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1.5 border-border bg-background/40 hover:bg-accent/10 hover:border-accent/40 hover:text-accent"
            onClick={() => onAction?.("flashcards")}
          >
            <Layers className="w-3 h-3" />
            Flashcards
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1.5 border-border bg-background/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
            onClick={() => onAction?.("questions")}
          >
            <ListChecks className="w-3 h-3" />
            Gerar questões
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1.5 border-border bg-background/40 hover:bg-foreground/10"
            onClick={() => onAction?.("save")}
          >
            <Bookmark className="w-3 h-3" />
            Salvar
          </Button>

          <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopy}>
              {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={cn("h-7 w-7", feedback === "up" && "text-accent")}
              onClick={() => setFeedback(feedback === "up" ? null : "up")}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={cn("h-7 w-7", feedback === "down" && "text-destructive")}
              onClick={() => setFeedback(feedback === "down" ? null : "down")}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
