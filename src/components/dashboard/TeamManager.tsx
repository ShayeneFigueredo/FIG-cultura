"use client";

import { useState, useEffect } from "react";
import { Users, Search, Plus, Loader2, X, AlertTriangle, ShieldCheck, Mail } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type SearchUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

type Member = {
  id: string; // propertyMember ID
  role: string;
  user: SearchUser;
};

export function TeamManager({ propertyId, initialMembers }: { propertyId: string, initialMembers: Member[] }) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [bulkEmails, setBulkEmails] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);
  
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out users already in the team
          const filtered = data.filter((u: SearchUser) => !members.some(m => m.user.id === u.id));
          setSearchResults(filtered);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, members]);

  const showMessage = (text: string, type: "success" | "error" | "warning") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 8000);
  };

  const addSingleUser = async (user: SearchUser) => {
    setIsAdding(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao adicionar");

      setSearchQuery("");
      showMessage(`${user.name} foi adicionado(a) à equipe!`, "success");
      router.refresh();
      
      // Update local state for immediate feedback
      setMembers([...members, { id: "temp", role: "MEMBER", user }]);
    } catch (e: any) {
      showMessage(e.message, "error");
    } finally {
      setIsAdding(false);
    }
  };

  const addBulkUsers = async () => {
    if (!bulkEmails.trim()) return;
    
    setIsAdding(true);
    setMessage(null);
    const emails = bulkEmails.split(",").map(e => e.trim()).filter(e => e.length > 0);
    
    try {
      const res = await fetch(`/api/properties/${propertyId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao processar lote");

      let msg = "";
      let type: "success" | "warning" = "success";

      if (data.added.length > 0) {
        msg += `${data.added.length} usuário(s) adicionado(s) com sucesso. `;
      }
      
      if (data.notFound && data.notFound.length > 0) {
        msg += `Não encontramos contas para: ${data.notFound.join(", ")}. Peça para se cadastrarem primeiro.`;
        type = "warning";
      }

      showMessage(msg || "Nenhum usuário novo foi adicionado.", type);
      if (data.added.length > 0) {
        setBulkEmails("");
        router.refresh();
      }
    } catch (e: any) {
      showMessage(e.message, "error");
    } finally {
      setIsAdding(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este membro da equipe?")) return;
    
    try {
      const res = await fetch(`/api/properties/${propertyId}/members?userId=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMembers(members.filter(m => m.user.id !== userId));
        router.refresh();
      } else {
        const data = await res.json();
        showMessage(data.message || "Erro ao remover", "error");
      }
    } catch (e: any) {
      showMessage(e.message, "error");
    }
  };

  const getInitials = (name: string) => name.trim().split(/\s+/).slice(0,2).map(p => p[0]?.toUpperCase() ?? "").join("");

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <Users className="w-6 h-6 text-brand-main" />
        <h2 className="text-xl font-medium">Equipe da Fazenda</h2>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 text-sm ${
          message.type === "success" ? "bg-brand-main/10 border-brand-main/30 text-brand-light" : 
          message.type === "warning" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" : 
          "bg-destructive/10 border-destructive/30 text-destructive-foreground"
        }`}>
          {message.type === "warning" ? <AlertTriangle className="w-5 h-5 shrink-0" /> : 
           message.type === "success" ? <ShieldCheck className="w-5 h-5 shrink-0" /> : 
           <X className="w-5 h-5 shrink-0" />}
          <div className="mt-0.5">{message.text}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Busca Individual */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-white/80 mb-2">Adicionar pessoa específica</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Pesquisar por e-mail ou nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm focus:border-brand-main/50 outline-none transition-colors"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-brand-main animate-spin absolute right-3.5 top-3" />
              )}
            </div>
          </div>

          {searchQuery.length >= 3 && searchResults.length > 0 && (
            <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-main/20 flex items-center justify-center overflow-hidden relative">
                      {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" unoptimized />
                      ) : (
                        <span className="text-sm text-brand-main font-bold">{getInitials(user.name)}</span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-white/50 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => addSingleUser(user)}
                    disabled={isAdding}
                    className="w-8 h-8 rounded-lg bg-brand-main/20 text-brand-main hover:bg-brand-main hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
            <div className="p-4 text-center text-sm text-white/40 bg-black/40 rounded-xl border border-white/10">
              Nenhum usuário encontrado com esse termo.
            </div>
          )}
        </div>

        {/* Adição em Lote */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-white/80 mb-2">Adicionar Turma (Vários E-mails)</h3>
            <p className="text-xs text-white/50 mb-3">Cole os e-mails separados por vírgula. Ex: aluno1@gmail.com, prof@esalq.usp.br</p>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
              <textarea
                rows={3}
                placeholder="Cole os e-mails aqui..."
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm focus:border-brand-main/50 outline-none transition-colors resize-none"
              />
            </div>
            <button
              onClick={addBulkUsers}
              disabled={isAdding || !bulkEmails.trim()}
              className="mt-3 w-full py-2.5 bg-brand-main/20 text-brand-main border border-brand-main/30 hover:bg-brand-main hover:text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Adicionar E-mails
            </button>
          </div>
        </div>
      </div>

      {/* Lista Atual */}
      <h3 className="text-sm font-medium text-white/80 mb-4 pb-2 border-b border-white/10">Membros Atuais ({members.length})</h3>
      
      {members.length === 0 ? (
        <div className="text-center py-8 text-white/40 text-sm bg-black/20 rounded-xl border border-white/5">
          Ninguém foi adicionado à equipe ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(member => (
            <div key={member.user.id} className="bg-black/40 border border-white/10 p-4 rounded-xl flex items-center justify-between group">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-brand-main/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {member.user.avatarUrl ? (
                    <Image src={member.user.avatarUrl} alt={member.user.name} fill className="object-cover" unoptimized />
                  ) : (
                    <span className="text-sm text-brand-main">{getInitials(member.user.name)}</span>
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate" title={member.user.name}>{member.user.name}</p>
                  <p className="text-xs text-white/50 truncate" title={member.user.email}>{member.user.email}</p>
                </div>
              </div>
              <button 
                onClick={() => removeMember(member.user.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-white/30 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                title="Remover Membro"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
