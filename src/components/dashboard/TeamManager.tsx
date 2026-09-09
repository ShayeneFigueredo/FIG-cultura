"use client";

import { useState, useEffect } from "react";
import { Users, Search, Plus, Loader2, X, AlertTriangle, ShieldCheck, Mail, Briefcase, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export const TEAM_ROLES = [
  { id: "AGRONOMIST", label: "Agrônomo Responsável", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { id: "CONSULTANT", label: "Consultor Técnico", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { id: "FIELD_TECH", label: "Técnico de Campo", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "PRODUCER", label: "Produtor / Gerente", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "MEMBER", label: "Membro de Equipe", color: "bg-slate-100 text-slate-800 border-slate-300" },
];

type SearchUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

type Member = {
  id: string;
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
  const [selectedRole, setSelectedRole] = useState("AGRONOMIST");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [bulkEmails, setBulkEmails] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  const router = useRouter();

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

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
          const filtered = data.filter((u: SearchUser) => !members.some((m) => m.user.id === u.id));
          setSearchResults(filtered);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

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
        body: JSON.stringify({ userId: user.id, role: selectedRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao adicionar");

      setSearchQuery("");
      showMessage(`${user.name} foi adicionado(a) como ${getRoleLabel(selectedRole)}!`, "success");
      router.refresh();

      setMembers([...members, { id: "temp-" + Date.now(), role: selectedRole, user }]);
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
        body: JSON.stringify({ emails, role: selectedRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao processar lote");

      let msg = "";
      let type: "success" | "warning" = "success";

      if (data.added && data.added.length > 0) {
        msg += `${data.added.length} membro(s) adicionado(s) como ${getRoleLabel(selectedRole)}. `;
      }

      if (data.notFound && data.notFound.length > 0) {
        msg += `E-mails não cadastrados: ${data.notFound.join(", ")}. Peça para criarem conta no Cultiva.`;
        type = "warning";
      }

      showMessage(msg || "Nenhum usuário novo foi adicionado.", type);
      if (data.added && data.added.length > 0) {
        setBulkEmails("");
        router.refresh();
      }
    } catch (e: any) {
      showMessage(e.message, "error");
    } finally {
      setIsAdding(false);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    setUpdatingMemberId(userId);
    try {
      const res = await fetch(`/api/properties/${propertyId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.user.id === userId ? { ...m, role: newRole } : m))
        );
        showMessage("Função agronômica atualizada!", "success");
        router.refresh();
      } else {
        const data = await res.json();
        showMessage(data.message || "Erro ao atualizar cargo", "error");
      }
    } catch (e: any) {
      showMessage(e.message, "error");
    } finally {
      setUpdatingMemberId(null);
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
        showMessage("Membro removido da equipe.", "success");
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

  const getRoleBadge = (role: string) => {
    const found = TEAM_ROLES.find((r) => r.id === role);
    return found || TEAM_ROLES[4];
  };

  const getRoleLabel = (role: string) => getRoleBadge(role).label;

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-main/15 flex items-center justify-center border border-brand-main/30 text-brand-main">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Equipe da Fazenda</h2>
            <p className="text-xs text-slate-500 font-medium">
              Gerencie agrônomos, consultores, técnicos de campo e colaboradores.
            </p>
          </div>
        </div>

        <span className="text-xs font-bold bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700">
          {members.length} {members.length === 1 ? 'Membro' : 'Membros'}
        </span>
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

      {/* Seleção Global da Função ao Adicionar */}
      <div className="mb-6 bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Briefcase className="w-4 h-4 text-brand-main" />
          <span>Cargo a ser atribuído ao adicionar:</span>
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-main shadow-sm"
        >
          {TEAM_ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Busca Individual */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1.5">
              Adicionar membro específico
            </h3>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Pesquisar por e-mail ou nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 outline-none transition-all font-medium"
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
                    <div className="w-10 h-10 rounded-full bg-brand-main/20 flex items-center justify-center overflow-hidden relative border border-brand-main/30 shrink-0">
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
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-main text-white hover:bg-brand-light font-bold text-xs transition-all disabled:opacity-50 shadow-sm shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
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
              Adicionar Equipe em Lote (Vários E-mails)
            </h3>
            <p className="text-xs text-slate-500 mb-2 font-medium">
              Cole os e-mails separados por vírgula. Ex: agronomo@fazenda.com, consultor@agronomia.com
            </p>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <textarea
                rows={2}
                placeholder="Cole os e-mails aqui..."
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 outline-none transition-all resize-none font-medium"
              />
            </div>
            <button
              onClick={addBulkUsers}
              disabled={isAdding || !bulkEmails.trim()}
              className="mt-2.5 w-full py-2.5 bg-brand-main hover:bg-brand-light text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Adicionar Lote como {getRoleLabel(selectedRole)}
            </button>
          </div>
        </div>
      </div>

      {/* Lista Atual da Equipe */}
      <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
        Membros e Funções Agronômicas ({members.length})
      </h3>

      {members.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-2xl border border-slate-200 font-medium">
          Ninguém foi adicionado à equipe desta fazenda ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => {
            const roleBadge = getRoleBadge(member.role);
            return (
              <div
                key={member.user.id}
                className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl flex flex-col justify-between group shadow-sm hover:border-brand-main/60 transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
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

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`mailto:${member.user.email}`}
                      className="p-2 text-slate-400 hover:text-brand-main hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
                      title="Enviar E-mail"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => removeMember(member.user.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Remover Membro"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Seletor Inline de Função Agronômica */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border uppercase ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>

                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                    {updatingMemberId === member.user.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-main" />
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) => updateRole(member.user.id, e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-brand-main"
                      >
                        {TEAM_ROLES.map((r) => (
                          <option key={r.id} value={r.id}>
                            Alterar: {r.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
