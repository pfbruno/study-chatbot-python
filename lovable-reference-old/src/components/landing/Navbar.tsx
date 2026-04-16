import { BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <span className="font-heading text-lg font-bold">StudyPro</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</a>
          <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Depoimentos</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-foreground">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold">
            <Link to="/signup">Criar conta</Link>
          </Button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-6 space-y-4">
          <a href="#features" className="block text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Funcionalidades</a>
          <a href="#pricing" className="block text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Planos</a>
          <a href="#testimonials" className="block text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Depoimentos</a>
          <div className="flex gap-3 pt-2">
            <Button asChild variant="ghost" size="sm" className="text-foreground">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold">
              <Link to="/signup">Criar conta</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
