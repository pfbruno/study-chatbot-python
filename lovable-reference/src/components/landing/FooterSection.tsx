import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const FooterSection = () => {
  return (
    <footer className="border-t border-border py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="font-heading text-lg font-bold">StudyPro</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              A plataforma inteligente para quem quer ser aprovado em vestibulares e ENEM.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Produto</h4>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <a href="#features" className="block hover:text-foreground transition-colors">Funcionalidades</a>
              <a href="#pricing" className="block hover:text-foreground transition-colors">Planos</a>
              <Link to="/signup" className="block hover:text-foreground transition-colors">Criar conta</Link>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Recursos</h4>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <a href="#" className="block hover:text-foreground transition-colors">Simulados</a>
              <a href="#" className="block hover:text-foreground transition-colors">Chat com IA</a>
              <a href="#" className="block hover:text-foreground transition-colors">Comunidade</a>
              <a href="#" className="block hover:text-foreground transition-colors">Aulas ao vivo</a>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Legal</h4>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <a href="#" className="block hover:text-foreground transition-colors">Termos de uso</a>
              <a href="#" className="block hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="block hover:text-foreground transition-colors">Contato</a>
            </nav>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 StudyPro. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors text-sm">Instagram</a>
            <a href="#" className="hover:text-foreground transition-colors text-sm">YouTube</a>
            <a href="#" className="hover:text-foreground transition-colors text-sm">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
