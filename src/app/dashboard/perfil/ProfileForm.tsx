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
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/10">
        <AvatarUpload 
          value={formData.avatarUrl} 
          onChange={(base64) => setFormData({ ...formData, avatarUrl: base64 })} 
          nameFallback={formData.name}
          size="md"
        />
        
        <div className="flex-1 w-full space-y-1">
          <label className="text-sm font-medium text-white/80 block">Foto de Perfil</label>
          <p className="text-xs text-white/40">Clique na imagem para selecionar do seu computador ou tirar uma foto com a câmera do seu dispositivo.</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="group relative">
          <label className="text-sm font-medium text-white/80 block mb-1.5">Nome Completo</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-white/40 transition-colors group-focus-within:text-brand-main" />
            </div>
            <input
              type="text"
              required
              placeholder="Seu nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm transition-all focus:bg-white/5 focus:border-brand-main/50 focus:ring-1 focus:ring-brand-main/50 outline-none text-white"
            />
          </div>
        </div>

        <div className="group relative">
          <label className="text-sm font-medium text-white/80 block mb-1.5">E-mail</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-white/40 transition-colors group-focus-within:text-brand-main" />
            </div>
            <input
              type="email"
              required
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="block w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm transition-all focus:bg-white/5 focus:border-brand-main/50 focus:ring-1 focus:ring-brand-main/50 outline-none text-white"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive-foreground text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-brand-main/20 border border-brand-main/50 text-brand-main text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Perfil atualizado com sucesso!
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 py-2.5 px-6 border border-transparent rounded-lg text-sm font-medium text-white bg-brand-main hover:bg-brand-light transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-main focus:ring-offset-black shadow-[0_0_15px_rgba(107,175,58,0.2)] hover:shadow-[0_0_20px_rgba(147,198,62,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
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
