import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Sparkles, Command, StopCircle, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
  onCommand?: () => void;
}

export const ChatComposer = ({
  value,
  onChange,
  onSubmit,
  disabled,
  isStreaming,
  onStop,
  onCommand,
}: ChatComposerProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  // auto-grow
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = Math.min(ref.current.scrollHeight, 220) + "px";
  }, [value]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-gradient-to-b from-background/0 via-background/60 to-background backdrop-blur-md">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-4">
        <div
          className={cn(
            "relative rounded-2xl border bg-card/80 backdrop-blur transition-all",
            focused
              ? "border-primary/50 shadow-[0_0_0_4px_hsl(var(--primary)/0.08),_0_8px_30px_-12px_hsl(var(--primary)/0.4)]"
              : "border-border shadow-sm",
          )}
        >
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Pergunte qualquer coisa sobre seus estudos…  (Shift + Enter para quebrar linha)"
            rows={1}
            disabled={disabled}
            className="w-full resize-none bg-transparent border-0 outline-none px-4 pt-3.5 pb-2 text-sm text-foreground placeholder:text-muted-foreground/70 max-h-[220px] leading-relaxed"
          />

          <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Anexar material"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground text-xs"
                onClick={onCommand}
              >
                <Command className="w-3.5 h-3.5" />
                Comandos
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Ditar"
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-[10px] text-muted-foreground/60 mr-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted/50 border border-border text-[10px] font-mono">↵</kbd> enviar
              </span>
              {isStreaming ? (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={onStop}
                  className="h-9 w-9 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <StopCircle className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  onClick={onSubmit}
                  disabled={disabled || !value.trim()}
                  className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground hover:opacity-90 disabled:opacity-40 shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.6)]"
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/60 text-center mt-2 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          A IA pode cometer erros. Verifique informações importantes.
        </p>
      </div>
    </div>
  );
};
