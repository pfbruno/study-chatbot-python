"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Calculator,
  FlaskConical,
  Globe,
  PenTool,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ChatConversation = {
  id: string;
  title: string;
  subject: string;
  messages: ChatMessage[];
};

const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    id: "conv-1",
    title: "Dúvida sobre Termoquímica",
    subject: "Química",
    messages: [
      {
        id: "m-1",
        role: "user",
        content: "O que é entalpia?",
      },
      {
        id: "m-2",
        role: "assistant",
        content:
          "Entalpia (H) é a quantidade de energia contida em uma substância sob pressão constante.\n\nTipos:\n• Exotérmica: libera calor (ΔH < 0)\n• Endotérmica: absorve calor (ΔH > 0)\n\nÉ um dos temas mais cobrados no ENEM em Química.",
      },
    ],
  },
  {
    id: "conv-2",
    title: "Redação ENEM 2024",
    subject: "Redação",
    messages: [],
  },
];

const SUGGESTIONS = [
  { label: "Matemática", icon: Calculator },
  { label: "Química", icon: FlaskConical },
  { label: "Português", icon: BookOpen },
  { label: "Geografia", icon: Globe },
  { label: "Redação", icon: PenTool },
  { label: "Física", icon: Sparkles },
];

function buildAssistantReply(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("entalpia")) {
    return "Entalpia é a variação de energia de um sistema em processos a pressão constante. Em química, ela é usada para descrever trocas de calor em reações endotérmicas e exotérmicas.";
  }

  if (lower.includes("mitose")) {
    return "Mitose é o processo de divisão celular que origina duas células-filhas geneticamente idênticas, mantendo o número de cromossomos da célula-mãe.";
  }

  if (lower.includes("mendel")) {
    return "As leis de Mendel explicam padrões básicos de herança genética, com destaque para segregação dos alelos e segregação independente.";
  }

  return "Resposta simulada do StudyPro IA. Esta estrutura já está pronta para integração futura com backend ou provedor de IA real, mantendo histórico, loading e renderização de mensagens.";
}

export function ChatIA() {
  const [conversations, setConversations] =
    useState<ChatConversation[]>(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] =
    useState<string>("conv-1");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messageViewportRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(() => {
    return (
      conversations.find((conversation) => conversation.id === activeConversationId) ??
      conversations[0]
    );
  }, [activeConversationId, conversations]);

  useEffect(() => {
    if (!messageViewportRef.current) return;
    messageViewportRef.current.scrollTop =
      messageViewportRef.current.scrollHeight;
  }, [activeConversation?.messages, isLoading]);

  function createNewConversation() {
    const newConversation: ChatConversation = {
      id: `conv-${Date.now()}`,
      title: "Nova conversa",
      subject: "Geral",
      messages: [],
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setInput("");
  }

  async function sendMessage(customPrompt?: string) {
    const content = (customPrompt ?? input).trim();
    if (!content || !activeConversation) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };

    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== activeConversation.id) return conversation;

        const updatedMessages = [...conversation.messages, userMessage];
        const updatedTitle =
          conversation.messages.length === 0
            ? content.slice(0, 32)
            : conversation.title;

        return {
          ...conversation,
          title: updatedTitle,
          messages: updatedMessages,
        };
      })
    );

    setInput("");
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 900));

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: buildAssistantReply(content),
    };

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              messages: [...conversation.messages, assistantMessage],
            }
          : conversation
      )
    );

    setIsLoading(false);
  }

  return (
    <div className="grid h-[calc(100vh-10.5rem)] min-h-[640px] grid-cols-1 overflow-hidden rounded-[28px] border border-white/10 bg-[#050b18] shadow-[0_0_0_1px_rgba(255,255,255,0.02)] xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="hidden border-r border-white/10 bg-[#081225] xl:flex xl:flex-col">
        <div className="border-b border-white/10 p-4">
          <button
            type="button"
            onClick={createNewConversation}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#3b82f6] text-base font-semibold text-white transition hover:bg-[#4b8df7]"
          >
            <span className="text-xl leading-none">＋</span>
            Nova Conversa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={[
                    "w-full rounded-2xl border px-4 py-3 text-left transition",
                    isActive
                      ? "border-[#1f4b99] bg-[#0c1e3f]"
                      : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.03]",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg text-[#5b93ff]">
                      <BookOpen className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`truncate text-[15px] font-medium ${
                          isActive ? "text-[#4b8df7]" : "text-white/80"
                        }`}
                      >
                        {conversation.title}
                      </p>
                      <p className="mt-0.5 text-sm text-white/45">
                        {conversation.subject}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-col">
        <div
          ref={messageViewportRef}
          className="flex-1 overflow-y-auto bg-[#030a16] px-4 py-6 sm:px-6 lg:px-10"
        >
          {activeConversation?.messages.length ? (
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
              {activeConversation.messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[84%] ${isUser ? "order-2" : ""}`}>
                      {isUser ? (
                        <div className="flex items-start justify-end gap-3">
                          <div className="rounded-[22px] bg-[#3b82f6] px-5 py-4 text-[15px] leading-7 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                            {message.content}
                          </div>

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0d1728] text-sm font-semibold text-white/80">
                            <span>JP</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#38bdf8] to-[#22c55e] text-[#03101f] shadow-[0_0_25px_rgba(34,197,94,0.18)]">
                            <Wand2 className="h-5 w-5" />
                          </div>

                          <div className="rounded-[22px] border border-white/10 bg-[#071529] px-5 py-4 text-[15px] leading-7 text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] whitespace-pre-line">
                            {message.content}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#38bdf8] to-[#22c55e] text-[#03101f]">
                      <Wand2 className="h-5 w-5" />
                    </div>

                    <div className="rounded-[22px] border border-white/10 bg-[#071529] px-5 py-4 text-sm text-white/60">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white/50" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white/40 [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white/30 [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-4 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#38bdf8] to-[#22c55e] text-[#03101f] shadow-[0_0_35px_rgba(34,197,94,0.16)]">
                <Sparkles className="h-9 w-9" />
              </div>

              <h1 className="text-4xl font-semibold tracking-tight text-white">
                StudyPro IA
              </h1>

              <p className="mt-3 max-w-2xl text-lg text-white/55">
                Tire dúvidas, peça explicações e estude com inteligência artificial
              </p>

              <div className="mt-10 grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {SUGGESTIONS.map((suggestion) => {
                  const Icon = suggestion.icon;

                  return (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() =>
                        sendMessage(`Quero estudar ${suggestion.label}.`)
                      }
                      className="group rounded-[22px] border border-white/10 bg-[#061224] px-6 py-8 text-center transition hover:border-[#2f66d0] hover:bg-[#08182f]"
                    >
                      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-white/65 transition group-hover:text-[#77a5ff]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-xl font-medium text-[#80a9ff]">
                        {suggestion.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-[#030a16] px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <div className="relative flex-1">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Pergunte qualquer coisa sobre seus estudos..."
                className="h-16 w-full rounded-[20px] border border-[#1f4b99] bg-[#050f20] px-5 pr-16 text-base text-white outline-none transition placeholder:text-white/35 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20"
              />

              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl bg-[#1e4f9f] text-white transition hover:bg-[#2863c0] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Enviar mensagem"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}