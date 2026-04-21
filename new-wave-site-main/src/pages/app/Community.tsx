import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  Sparkles,
  Search,
  Image as ImageIcon,
  Send,
  Pin,
  Flame,
} from "lucide-react";

type Post = {
  id: string;
  author: { name: string; initials: string; role: string };
  time: string;
  category: string;
  title?: string;
  content: string;
  likes: number;
  comments: number;
  liked?: boolean;
  pinned?: boolean;
  trending?: boolean;
  tags: string[];
};

const mockPosts: Post[] = [
  {
    id: "1",
    author: { name: "Profa. Mariana Lopes", initials: "ML", role: "Professora" },
    time: "2h",
    category: "Dica",
    title: "Como interpretar gráficos de função do 2º grau no ENEM",
    content:
      "Pessoal, separei 3 erros mais comuns ao analisar parábolas em questões de Matemática. O principal é confundir vértice com raízes. Sempre identifique primeiro a concavidade...",
    likes: 234,
    comments: 42,
    pinned: true,
    tags: ["matemática", "enem", "dica"],
  },
  {
    id: "2",
    author: { name: "Carlos Eduardo", initials: "CE", role: "Aluno" },
    time: "5h",
    category: "Pergunta",
    title: "Alguém entendeu a questão 78 do simulado ENEM 2024?",
    content:
      "Estou travado na questão de Química Orgânica sobre isomeria. O gabarito diz letra C mas eu cheguei em B. Alguém pode explicar o raciocínio?",
    likes: 56,
    comments: 28,
    trending: true,
    tags: ["química", "dúvida"],
  },
  {
    id: "3",
    author: { name: "Beatriz Moraes", initials: "BM", role: "Aluno" },
    time: "1d",
    category: "Conquista",
    content:
      "Galera, consegui 920 na redação do último simulado! 🎉 A dica da Profa. Mariana sobre repertório sociocultural fez TODA a diferença. Obrigada StudyPro!",
    likes: 489,
    comments: 67,
    tags: ["redação", "conquista"],
  },
  {
    id: "4",
    author: { name: "Prof. Ricardo Alves", initials: "RA", role: "Professor" },
    time: "1d",
    category: "Conteúdo",
    title: "Resumo: Revolução Industrial em 5 minutos",
    content:
      "Acabei de publicar um resumo visual sobre as 3 fases da Revolução Industrial. Acessem na Área de Estudo > Resumos. Inclui mapa mental e flashcards!",
    likes: 178,
    comments: 19,
    tags: ["história", "resumo"],
  },
];

const categories = ["Todos", "Dica", "Pergunta", "Conquista", "Conteúdo", "Discussão"];

const Community = () => {
  const [posts, setPosts] = useState(mockPosts);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [newPost, setNewPost] = useState("");

  const filtered = posts.filter((p) => activeCategory === "Todos" || p.category === activeCategory);

  const toggleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p,
      ),
    );
  };

  const handlePublish = () => {
    if (!newPost.trim()) return;
    const post: Post = {
      id: String(Date.now()),
      author: { name: "Você", initials: "VC", role: "Aluno" },
      time: "agora",
      category: "Discussão",
      content: newPost,
      likes: 0,
      comments: 0,
      tags: [],
    };
    setPosts([post, ...posts]);
    setNewPost("");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold">Comunidade</h1>
        <p className="text-muted-foreground">
          Conecte-se, tire dúvidas e compartilhe conquistas com outros estudantes e professores.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          {/* Composer */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">VC</AvatarFallback>
                </Avatar>
                <Textarea
                  placeholder="Compartilhe uma dúvida, dica ou conquista..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div className="flex items-center justify-between pl-12">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  Anexar
                </Button>
                <Button onClick={handlePublish} disabled={!newPost.trim()}>
                  <Send className="w-4 h-4" />
                  Publicar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((c) => (
              <Button
                key={c}
                variant={activeCategory === c ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(c)}
                className="shrink-0"
              >
                {c}
              </Button>
            ))}
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {filtered.map((post) => (
              <Card key={post.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <Avatar>
                        <AvatarFallback
                          className={
                            post.author.role.includes("rofess")
                              ? "bg-accent/10 text-accent"
                              : "bg-primary/10 text-primary"
                          }
                        >
                          {post.author.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{post.author.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {post.author.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{post.time}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs h-5">
                            {post.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {post.pinned && (
                        <Badge className="bg-accent/10 text-accent border-accent/20">
                          <Pin className="w-3 h-3" />
                          Fixado
                        </Badge>
                      )}
                      {post.trending && (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                          <Flame className="w-3 h-3" />
                          Em alta
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {post.title && <h3 className="font-heading text-lg font-semibold">{post.title}</h3>}
                  <p className="text-sm text-muted-foreground leading-relaxed">{post.content}</p>
                  {post.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {post.tags.map((t) => (
                        <span key={t} className="text-xs text-primary">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(post.id)}
                      className={post.liked ? "text-destructive" : ""}
                    >
                      <Heart className={`w-4 h-4 ${post.liked ? "fill-current" : ""}`} />
                      {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="w-4 h-4" />
                      {post.comments}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4" />
                      Compartilhar
                    </Button>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <Bookmark className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar na comunidade..." className="pl-9" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-semibold">Tópicos em alta</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { tag: "enem2025", count: 1240 },
                { tag: "redação", count: 892 },
                { tag: "matemática", count: 756 },
                { tag: "química", count: 543 },
                { tag: "fuvest", count: 421 },
              ].map((t) => (
                <div key={t.tag} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-primary">#{t.tag}</span>
                  <span className="text-xs text-muted-foreground">{t.count} posts</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-heading font-semibold">Estudantes ativos</h3>
              </div>
              <div className="flex -space-x-2">
                {["AL", "BM", "CR", "DS", "EM"].map((i) => (
                  <Avatar key={i} className="w-8 h-8 border-2 border-background">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {i}
                    </AvatarFallback>
                  </Avatar>
                ))}
                <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                  +98
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                103 estudantes online agora estudando junto com você.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default Community;
