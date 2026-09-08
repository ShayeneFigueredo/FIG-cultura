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

export function TeamManager({
  propertyId,
  initialMembers,
}: {
  propertyId: string;
  initialMembers: Member[];
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [bulkEmails, setBulkEmails] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "warning";
  } | null>(null);

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
          const filtered = data.filter((u: SearchUser) => !members.some((m) => m.user.id === u.id));
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
    const emails = bulkEmails
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

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
        msg += `Não encontramos contas para: ${data.notFound.join(
          ", "
        )}. Peça para se cadastrarem primeiro.`;
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
        setMembers(members.filter((m) => m.user.id !== userId));
        router.refresh();
      } else {
        const data = await res.json();
        showMessage(data.message || "Erro ao remover", "error");
      }
    } catch (e: any) {
      showMessage(e.message, "error");
    }
  };

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-xl text-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-brand-main/15 flex items-center justify-center border border-brand-main/30 text-brand-main">
          <Users className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Equipe da Fazenda</h2>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : message.type === "warning"
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          {message.type === "warning" ? (
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
          ) : message.type === "success" ? (
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <X className="w-5 h-5 shrink-0 text-red-600" />
          )}
          <div className="mt-0.5">{message.text}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Busca Individual */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1.5">
              Adicionar pessoa específica
            </h3>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Pesquisar por e-mail ou nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 outline-none transition-all"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-brand-main animate-spin absolute right-3.5 top-3.5" />
              )}
            </div>
          </div>

          {searchQuery.length >= 3 && searchResults.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto shadow-lg">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-main/20 flex items-center justify-center overflow-hidden relative border border-brand-main/30">
                      {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" unoptimized />
                      ) : (
                        <span className="text-sm text-brand-main font-bold">{getInitials(user.name)}</span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addSingleUser(user)}
                    disabled={isAdding}
                    className="w-8 h-8 rounded-xl bg-brand-main text-white hover:bg-brand-light flex items-center justify-center transition-all disabled:opacity-50 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 font-medium">
              Nenhum usuário encontrado com esse termo.
            </div>
          )}
        </div>

        {/* Adição em Lote */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Adicionar Turma (Vários E-mails)
            </h3>
            <p className="text-xs text-slate-500 mb-2 font-medium">
              Cole os e-mails separados por vírgula. Ex: aluno1@gmail.com, prof@esalq.usp.br
            </p>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <textarea
                rows={3}
                placeholder="Cole os e-mails aqui..."
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 outline-none transition-all resize-none"
              />
            </div>
            <button
              onClick={addBulkUsers}
              disabled={isAdding || !bulkEmails.trim()}
              className="mt-3 w-full py-3 bg-brand-main hover:bg-brand-light text-white rounded-2xl text-sm font-bold transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Adicionar E-mails
            </button>
          </div>
        </div>
      </div>

      {/* Lista Atual */}
      <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
        Membros Atuais ({members.length})
      </h3>

      {members.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-2xl border border-slate-200 font-medium">
          Ninguém foi adicionado à equipe ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div
              key={member.user.id}
              className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between group shadow-sm hover:border-brand-main/50 transition-all"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-brand-main/15 flex items-center justify-center shrink-0 overflow-hidden relative border border-brand-main/30">
                  {member.user.avatarUrl ? (
                    <Image src={member.user.avatarUrl} alt={member.user.name} fill className="object-cover" unoptimized />
                  ) : (
                    <span className="text-sm text-brand-main font-bold">{getInitials(member.user.name)}</span>
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-900 truncate" title={member.user.name}>
                    {member.user.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate" title={member.user.email}>
                    {member.user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeMember(member.user.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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
