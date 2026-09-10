"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Send, Plus, MessageSquare, Loader2, Sparkles, Layers, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FiggerMascot } from "@/components/ui/FiggerMascot";
import { getChatSessions, getChatMessages, createChatSession, saveChatMessage, getUserAnalyses } from "./actions";

type ChatSession = { id: string; title: string; updatedAt: Date; region?: string };
type ChatMessage = { role: "user" | "ai"; text: string };
type UserAnalysisOption = {
  id: string;
  fieldName: string;
  propertyName: string;
  crop: string;
  date: string;
};

type RegionType = "GERAL" | "MG" | "GO" | "MS";

export default function RecomendacoesPage() {
  const searchParams = useSearchParams();
  const initialAnalysisId = searchParams.get("analysisId") || "";

  const [region, setRegion] = useState<RegionType>("MG");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [userAnalyses, setUserAnalyses] = useState<UserAnalysisOption[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>(initialAnalysisId);
  
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
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const data = await getUserAnalyses();
      setUserAnalyses(data);
      if (initialAnalysisId && data.some((a) => a.id === initialAnalysisId)) {
        setSelectedAnalysisId(initialAnalysisId);
      }
    } catch (e) {
      console.error("Erro ao carregar análises", e);
    }
  };

  useEffect(() => {
    if (activeSessionId) {
      if (skipLoadRef.current) {
        skipLoadRef.current = false;
        return;
      }
      loadMessages(activeSessionId);
    } else {
      // Mensagem baseada na região e contexto
      const welcomeMsgs: Record<RegionType, string> = {
        MG: "Oi, eu sou o Figger, o especialista em adubação e correção de solo da plataforma Cultiva! Tenho acesso direto às suas análises cadastradas e fui calibrado com a 5ª Aproximação de Minas Gerais. O que vamos planejar para o seu solo hoje?",
        GO: "Oi, eu sou o Figger! Sou seu especialista em fertilidade e correção de solo para o Cerrado goiano (Sousa & Lobato). Tenho acesso às suas análises cadastradas. Como posso te ajudar hoje?",
        MS: "Olá! Sou o Figger, assistente do Cultiva preparado para nutrição e calagem no Centro-Oeste. Já consultei suas análises cadastradas. O que vamos avaliar na sua área hoje?",
        GERAL: "Oi, eu sou o Figger! Sou seu especialista em correção e adubação do solo no Cultiva. Tenho acesso aos dados das suas análises de solo. Diga-me qual sua dúvida ou qual talhão quer analisar hoje!"
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
        // Garantir que todas as mensagens do histórico estejam sem asteriscos
        const cleanData = data.map((msg) => ({
          ...msg,
          text: msg.text.replaceAll("*", ""),
        }));
        setMessages(cleanData as ChatMessage[]);
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

  const handleSendQuery = async (customQuery?: string) => {
    const textToSend = (customQuery ?? query).trim();
    if (!textToSend || isTyping) return;
    
    const userMsg = textToSend.replaceAll("*", "");
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

      // Chamar IA passando a região e a análise em foco
      const response = await fetch("/api/ai/chat-mg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newMessages, 
          region,
          analysisId: selectedAnalysisId || undefined
        }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        const cleanReply = data.reply.replaceAll("*", "");
        setMessages((prev) => [...prev, { role: "ai", text: cleanReply }]);
        await saveChatMessage(currentSessionId!, "ai", cleanReply);
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

  const quickPrompts = [
    "Como estão as análises de solo dos meus talhões?",
    "Explique a recomendação de calagem e o pH ideal",
    "Quais os melhores adubos de plantio e cobertura?",
    "Como interpretar a saturação por bases (V%)?",
  ];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-6rem)] w-full overflow-hidden animate-in fade-in duration-500 gap-4">
      {/* Sidebar de Chats */}
      <div className="w-full md:w-72 flex flex-col bg-white border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden shrink-0 h-48 md:h-full">
        <div className="p-4 border-b-2 border-slate-200 bg-slate-50">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-brand-accent text-white font-bold py-2.5 rounded-xl hover:bg-orange-500 transition-all shadow-md"
          >
            <Plus className="w-5 h-5" />
            Novo Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 px-2 mt-2">
            Histórico
          </h3>
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left font-medium",
                activeSessionId === session.id
                  ? "bg-brand-main/10 border-2 border-brand-main/30 text-brand-main font-bold"
                  : "hover:bg-slate-100 border-2 border-transparent text-slate-700 hover:text-slate-900"
              )}
            >
              <MessageSquare className="w-4 h-4 shrink-0 text-slate-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{session.title.replaceAll("*", "")}</p>
                <p className="text-[10px] text-slate-500 truncate">
                  {new Date(session.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-slate-500 font-medium text-center py-4">Nenhum chat salvo.</p>
          )}
        </div>
      </div>

      {/* Área Principal de Chat */}
      <div className="flex-1 flex flex-col bg-white border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
        <div className="bg-slate-50 border-b-2 border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between z-10 gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-brand-main" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Figger - Especialista em Solo</h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">Correção, Nutrição e Diagnóstico de Laudos</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor de Foco de Análise */}
            {userAnalyses.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white border-2 border-slate-200 px-3 py-1 rounded-xl shadow-sm text-xs font-bold text-slate-700">
                <Layers className="w-4 h-4 text-brand-main shrink-0" />
                <select
                  value={selectedAnalysisId}
                  onChange={(e) => setSelectedAnalysisId(e.target.value)}
                  aria-label="Foco da Análise de Solo"
                  className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[240px] truncate"
                >
                  <option value="">Todas as Análises da Plataforma</option>
                  {userAnalyses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.propertyName} - {a.fieldName} ({a.crop})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Seletor de Região */}
            <div className="flex items-center gap-1 bg-white border-2 border-slate-200 p-1 rounded-xl overflow-x-auto shadow-sm">
              {(["GERAL", "MG", "GO", "MS"] as RegionType[]).map((r) => (
                <button
                  key={r}
                  onClick={() => { setRegion(r); handleNewChat(); }}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                    region === r 
                      ? "bg-slate-900 text-white shadow-sm" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full text-slate-500">
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
                        ? "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-slate-200 text-slate-800 border border-slate-300 font-bold"
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
                      "p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base leading-relaxed shadow-sm whitespace-pre-wrap font-medium",
                      msg.role === "user"
                        ? "bg-brand-main text-white font-semibold rounded-tr-none"
                        : "bg-white text-slate-900 border-2 border-slate-200 rounded-tl-none"
                    )}
                  >
                    {msg.text.replaceAll("*", "")}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start gap-3 sm:gap-4 max-w-[85%]">
                  <div className="flex items-center justify-center shrink-0">
                    <FiggerMascot className="w-10 h-10 sm:w-14 sm:h-14 drop-shadow-md" isThinking={true} />
                  </div>
                  <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 rounded-tl-none flex gap-1 items-center shadow-sm">
                    <div className="w-2 h-2 bg-brand-main rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-brand-main rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-brand-main rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Sugestões Rápidas de Perguntas */}
        {messages.length <= 2 && !isTyping && (
          <div className="px-4 py-2 bg-white/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-main" /> Sugestões:
            </span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuery(p)}
                className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 px-3 py-1.5 rounded-full whitespace-nowrap transition-all shadow-2xs"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <div className="p-3 sm:p-5 border-t-2 border-slate-200 bg-white shrink-0">
          <div className="relative max-w-4xl mx-auto">
            <input
              type="text"
              placeholder={
                selectedAnalysisId
                  ? "Tire dúvidas sobre este laudo ou peça dicas de calagem/adubação..."
                  : "Pergunte sobre seus laudos, doses de calcário, adubação ou manejo do solo..."
              }
              className="w-full !bg-white border-2 border-slate-300 rounded-xl py-3 sm:py-4 pl-4 sm:pl-5 pr-14 !text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-main transition-colors text-sm sm:text-base font-semibold shadow-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendQuery();
              }}
              disabled={isTyping || isLoadingHistory}
            />
            <button
              onClick={() => handleSendQuery()}
              disabled={isTyping || isLoadingHistory || !query.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-lg bg-brand-main text-white hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
