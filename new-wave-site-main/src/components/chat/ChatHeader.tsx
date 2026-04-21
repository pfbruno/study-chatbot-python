import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Share2, MoreHorizontal, History, PanelLeft } from "lucide-react";

interface ChatHeaderProps {
  title?: string;
  subject?: string;
  onToggleSidebar?: () => void;
}

export const ChatHeader = ({ title, subject, onToggleSidebar }: ChatHeaderProps) => {
  return (
    <header className="border-b border-border bg-card/30 backdrop-blur-md">
      <div className="px-4 md:px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 md:hidden"
            onClick={onToggleSidebar}
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.6)]">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-heading font-semibold text-foreground truncate">
                {title || "Chat IA"}
              </h1>
              <Badge className="h-5 px-1.5 text-[10px] bg-accent/15 text-accent border-accent/30 hover:bg-accent/20">
                Beta
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {subject ? `Estudo de ${subject}` : "Tire dúvidas, gere materiais e estude com IA focada em vestibulares"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="ghost" size="sm" className="hidden md:inline-flex h-9 gap-1.5 text-muted-foreground hover:text-foreground">
            <History className="w-4 h-4" />
            Histórico
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
