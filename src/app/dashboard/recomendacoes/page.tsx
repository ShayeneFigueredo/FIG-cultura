"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, Send, Plus, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FiggerMascot } from "@/components/ui/FiggerMascot";
import { getChatSessions, getChatMessages, createChatSession, saveChatMessage } from "./actions";

type ChatSession = { id: string; title: string; updatedAt: Date; region?: string };
type ChatMessage = { role: "user" | "ai"; text: string };

type RegionType = "GERAL" | "MG" | "GO" | "MS";

export default function RecomendacoesPage() {
  const [region, setRegion] = useState<RegionType>("MG");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const skipLoadRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      if (skipLoadRef.current) {
        skipLoadRef.current = false;
        return;
      }
      loadMessages(activeSessionId);
    } else {
      // Mensagem baseada na região
      const welcomeMsgs: Record<RegionType, string> = {
        "MG": "Oi, eu sou o Figger, o seu especialista em nutrição vegetal e calagem! Fui treinado com a 5ª Aproximação de Minas Gerais (Ribeiro et al.). O que vamos cultivar em MG hoje?",
        "GO": "Oi, eu sou o Figger! Sou especialista no Cerrado goiano, treinado com o manual 'Cerrado: Correção do solo e adubação' (Sousa & Lobato). Como posso ajudar em GO hoje?",
        "MS": "Olá! Sou o Figger, preparado com o Boletim de Pesquisa de MT/MS da Fundação MT. O que vamos planejar para sua área hoje?",
        "GERAL": "Oi, eu sou o Figger! Sou seu assistente agronômico geral. Diga-me qual sua dúvida e eu buscarei as melhores referências! O que vamos cultivar hoje?"
      };

      setMessages([
        {
          role: "ai",
          text: welcomeMsgs[region],
        },
      ]);
      setIsLoadingHistory(false);
    }
  }, [activeSessionId, region]);

  const loadSessions = async () => {
    try {
      const data = await getChatSessions();
      setSessions(data as any);
    } catch (e) {
      console.error("Erro ao carregar sessões", e);
    }
  };

  const loadMessages = async (sessionId: string) => {
    setIsLoadingHistory(true);
    try {
      const data = await getChatMessages(sessionId);
      if (data.length > 0) {
        setMessages(data as ChatMessage[]);
      }
    } catch (e) {
      console.error("Erro ao carregar mensagens", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
  };

  const handleSendQuery = async () => {
    if (!query.trim() || isTyping) return;
    
    const userMsg = query;
    setQuery("");
    
    let currentSessionId = activeSessionId;
    
    // Se for um chat novo, criar a sessão primeiro
    if (!currentSessionId) {
      try {
        const newSession = await createChatSession(userMsg);
        currentSessionId = newSession.id;
        skipLoadRef.current = true;
        setActiveSessionId(currentSessionId);
        // Atualizar lista de sessões
        await loadSessions();
      } catch (e) {
        console.error("Erro ao criar sessão", e);
        return;
      }
    }

    const newMessages = [...messages, { role: "user" as const, text: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // Salvar a pergunta no banco
      await saveChatMessage(currentSessionId!, "user", userMsg);

      // Chamar IA passando a região
      const response = await fetch("/api/ai/chat-mg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, region }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
        await saveChatMessage(currentSessionId!, "ai", data.reply);
      } else {
        setMessages((prev) => [...prev, { role: "ai", text: "Desculpe, tive um problema de comunicação na rede. Pode repetir?" }]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "ai", text: "Erro ao se conectar ao servidor." }]);
    } finally {
      setIsTyping(false);
      loadSessions(); // Atualiza a data do chat na lista
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-6rem)] w-full overflow-hidden animate-in fade-in duration-500 gap-4">
      {/* Sidebar de Chats */}
      <div className="w-full md:w-72 flex flex-col bg-white/50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-2xl backdrop-blur-md overflow-hidden shrink-0 h-48 md:h-full">
        <div className="p-4 border-b border-black/10 dark:border-white/10">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-brand-accent text-white font-bold py-2.5 rounded-xl hover:bg-orange-500 transition-all shadow-[0_0_15px_rgba(249,157,28,0.3)]"
          >
            <Plus className="w-5 h-5" />
            Novo Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <h3 className="text-xs font-semibold text-black/60 dark:text-white/60 uppercase tracking-wider mb-3 px-2 mt-2">
            Histórico
          </h3>
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left",
                activeSessionId === session.id
                  ? "bg-brand-main/10 border border-brand-main/20 text-brand-main"
                  : "hover:bg-black/5 dark:hover:bg-white/5 border border-transparent text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
              )}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.title}</p>
                <p className="text-[10px] opacity-60 truncate">
                  {new Date(session.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-black/30 dark:text-white/30 text-center py-4">Nenhum chat salvo.</p>
          )}
        </div>
      </div>

      {/* Área Principal de Chat */}
      <div className="flex-1 flex flex-col bg-white/50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-2xl backdrop-blur-md overflow-hidden relative">
        <div className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between z-10 gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-brand-main" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white">Recomendações IA</h2>
              <p className="text-xs sm:text-sm text-black/70 dark:text-white/60">Apoiado em Literaturas Oficiais</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl overflow-x-auto">
            {(["GERAL", "MG", "GO", "MS"] as RegionType[]).map((r) => (
              <button
                key={r}
                onClick={() => { setRegion(r); handleNewChat(); }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  region === r 
                    ? "bg-white dark:bg-black text-brand-accent shadow-sm" 
                    : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full text-black/50 dark:text-white/50">
              <Loader2 className="w-8 h-8 animate-spin text-brand-main" />
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-3 sm:gap-4 max-w-[95%] sm:max-w-[85%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div
                    className={cn(
                      "shrink-0",
                      msg.role === "user"
                        ? "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10"
                        : "flex items-center justify-center"
                    )}
                  >
                    {msg.role === "user" ? (
                      <span className="text-xs sm:text-sm font-bold">U</span>
                    ) : (
                      <FiggerMascot className="w-10 h-10 sm:w-14 sm:h-14 drop-shadow-md" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "p-3 sm:p-4 rounded-2xl text-sm sm:text-base leading-relaxed shadow-sm whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-brand-main text-white font-medium rounded-tr-none"
                        : "bg-black/5 dark:bg-white/5 text-black/90 dark:text-white/90 border border-black/10 dark:border-white/10 rounded-tl-none"
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start gap-3 sm:gap-4 max-w-[85%]">
                  <div className="flex items-center justify-center shrink-0">
                    <FiggerMascot className="w-10 h-10 sm:w-14 sm:h-14 drop-shadow-md" isThinking={true} />
                  </div>
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-tl-none flex gap-1 items-center">
                    <div className="w-2 h-2 bg-brand-main/50 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-brand-main/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-brand-main/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="p-3 sm:p-5 border-t border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/60 shrink-0">
          <div className="relative max-w-4xl mx-auto">
            <input
              type="text"
              placeholder="Ex: Qual a recomendação de N para milho em sequeiro?"
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-3 sm:py-4 pl-4 sm:pl-5 pr-14 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:border-brand-main/50 transition-colors text-sm sm:text-base"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendQuery();
              }}
              disabled={isTyping || isLoadingHistory}
            />
            <button
              onClick={handleSendQuery}
              disabled={isTyping || isLoadingHistory || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-lg bg-brand-main text-black hover:bg-brand-main/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
