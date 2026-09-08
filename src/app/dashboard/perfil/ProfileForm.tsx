"use client";

import { useState } from "react";
import { User, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AvatarUpload } from "@/components/ui/AvatarUpload";

type ProfileData = {
  name: string;
  email: string;
  avatarUrl: string;
};

export default function ProfileForm({ user }: { user: ProfileData }) {
  const [formData, setFormData] = useState(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao atualizar o perfil.");
      }

      setSuccess(true);
      router.refresh(); // Atualiza os Server Components para refletir as mudanças

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-200">
        <AvatarUpload 
          value={formData.avatarUrl} 
          onChange={(base64) => setFormData({ ...formData, avatarUrl: base64 })} 
          nameFallback={formData.name}
          size="md"
        />
        
        <div className="flex-1 w-full space-y-1">
          <label className="text-sm font-semibold text-slate-800 block">Foto de Perfil</label>
          <p className="text-xs text-slate-500">Clique na imagem para selecionar do seu computador ou tirar uma foto com a câmera do seu dispositivo.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-sm font-semibold text-slate-800 block mb-1.5">Nome Completo</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-brand-main" />
            </div>
            <input
              type="text"
              required
              placeholder="Seu nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-sm transition-all focus:border-brand-main focus:ring-1 focus:ring-brand-main outline-none text-slate-900 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-800 block mb-1.5">E-mail</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-brand-main" />
            </div>
            <input
              type="email"
              required
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-sm transition-all focus:border-brand-main focus:ring-1 focus:ring-brand-main outline-none text-slate-900 font-medium"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Perfil atualizado com sucesso!
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 py-2.5 px-6 border border-transparent rounded-lg text-sm font-bold text-white bg-brand-main hover:bg-brand-light transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-main shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Alterações"
          )}
        </button>
      </div>
    </form>
  );
}
