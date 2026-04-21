import { Bot } from "lucide-react";

export const ChatTypingIndicator = () => {
  return (
    <div className="flex gap-3 animate-fade-in-up">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shrink-0 mt-1 shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.6)]">
        <Bot className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-foreground mb-1.5">
          StudyPro IA <span className="text-muted-foreground font-normal">está pensando…</span>
        </span>
        <div className="rounded-2xl rounded-tl-md bg-card border border-border px-4 py-3.5 shadow-sm">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
};
