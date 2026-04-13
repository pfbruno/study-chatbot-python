import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/app/simulados": "Simulados",
  "/app/questoes": "Questões",
  "/app/chat": "Chat com IA",
  "/app/estudo": "Área de Estudo",
  "/app/analytics": "Analytics",
  "/app/comunidade": "Comunidade",
  "/app/grupos": "Grupos de Estudo",
  "/app/aulas": "Aulas ao Vivo",
  "/app/conquistas": "Conquistas",
  "/app/conteudos": "Conteúdos",
  "/app/planos": "Planos",
  "/app/indicacao": "Indicação",
  "/app/configuracoes": "Configurações",
  "/app/perfil": "Perfil",
};

const PlaceholderPage = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Página";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Construction className="w-10 h-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground max-w-md">
          Este módulo está sendo desenvolvido e será entregue nas próximas fases. 
          A estrutura de navegação já está preparada.
        </p>
      </div>
      <div className="px-4 py-2 rounded-full border border-accent/30 bg-accent/5 text-accent text-sm font-medium">
        Em breve
      </div>
    </div>
  );
};

export default PlaceholderPage;
