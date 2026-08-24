"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AvatarUpload } from "@/components/ui/AvatarUpload";

export default function CadastroPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, avatarUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao registrar usuário.");
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        throw new Error("Conta criada, mas não foi possível logar automaticamente.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-black">
      {/* Left side - Branding / Visuals */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-black border-r border-white/5">
        <Image
          src="/bannercadastro-cultiva.jpg"
          alt="Cultiva Banner Cadastro"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right side - Registration Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10 bg-[#050505] overflow-y-auto">
        
        {/* Mobile Logo */}
        <div className="lg:hidden mb-8 mt-8 flex flex-col items-center gap-3">
          <Image src="/cultivalogo-powered.png" alt="Cultiva" width={250} height={75} className="object-contain" />
          <div className="flex items-center gap-2 text-white/40 text-xs font-light mt-1">
            <span>by</span>
            <Image src="/icone-branco.png" alt="FIG Agrotech" width={16} height={16} className="opacity-60" />
            <span className="font-medium">FIG</span>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm my-auto"
        >
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-semibold tracking-tight mb-2 text-white">Criar conta</h2>
            <p className="text-white/60 text-sm">Preencha seus dados para começar a usar a Cultiva.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive-foreground text-sm">
                {error}
              </div>
            )}
            
            <div className="flex justify-center mb-6">
              <AvatarUpload 
                value={avatarUrl} 
                onChange={setAvatarUrl} 
                nameFallback={name || "Novo Usuário"} 
                size="md" 
              />
            </div>
            
            <div className="group relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-white/40 transition-colors group-focus-within:text-brand-main" />
              </div>
              <input
                type="text"
                required
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm transition-all focus:bg-white/10 focus:border-brand-main/50 focus:ring-2 focus:ring-brand-main/20 outline-none text-white placeholder:text-white/40"
              />
            </div>

            <div className="group relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-white/40 transition-colors group-focus-within:text-brand-main" />
              </div>
              <input
                type="email"
                required
                placeholder="Seu e-mail profissional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm transition-all focus:bg-white/10 focus:border-brand-main/50 focus:ring-2 focus:ring-brand-main/20 outline-none text-white placeholder:text-white/40"
              />
            </div>

            <div className="group relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-white/40 transition-colors group-focus-within:text-brand-main" />
              </div>
          <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Crie uma senha (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm transition-all focus:bg-white/10 focus:border-brand-main/50 focus:ring-2 focus:ring-brand-main/20 outline-none text-white placeholder:text-white/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white/80 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="group relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-white/40 transition-colors group-focus-within:text-brand-main" />
              </div>
          <input
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm transition-all focus:bg-white/10 focus:border-brand-main/50 focus:ring-2 focus:ring-brand-main/20 outline-none text-white placeholder:text-white/40"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white/80 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-brand-main hover:bg-brand-light transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-main focus:ring-offset-black active:scale-[0.98] shadow-[0_0_15px_rgba(107,175,58,0.3)] hover:shadow-[0_0_20px_rgba(147,198,62,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  {loading ? "Criando conta..." : "Criar minha conta"}
                  {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </span>
              </button>
            </div>
            
            <p className="text-xs text-white/40 text-center mt-4">
              Ao criar uma conta, você concorda com nossos Termos de Serviço e Política de Privacidade.
            </p>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center pb-8 lg:pb-0">
            <p className="text-sm text-white/60">
              Já tem uma conta?{" "}
              <Link href="/" className="font-medium text-brand-main hover:text-brand-light transition-colors">
                Fazer login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
