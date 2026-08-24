"use client";

import Image from "next/image";
import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(formatAuthError(res.error));
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isRegistered && (
        <div className="p-3 rounded-lg bg-brand-main/20 border border-brand-main/50 text-brand-main text-sm text-center">
          Conta criada com sucesso! Faça login abaixo.
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive-foreground text-sm">
          {error}
        </div>
      )}
      <div className="space-y-4">
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
            placeholder="Sua senha"
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
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" className="rounded border-white/20 bg-black/50 text-brand-main focus:ring-brand-main focus:ring-offset-black" />
          <span className="text-white/60 group-hover:text-white transition-colors">Lembrar de mim</span>
        </label>
        <span className="text-white/40 cursor-default" title="Disponível em breve">Esqueceu a senha?</span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-brand-main hover:bg-brand-light transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-main focus:ring-offset-black active:scale-[0.98] shadow-[0_0_15px_rgba(107,175,58,0.3)] hover:shadow-[0_0_20px_rgba(147,198,62,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2">
          {loading ? "Acessando..." : "Acessar plataforma"}
          {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
        </span>
      </button>
    </form>
  );
}

function formatAuthError(error: string): string {
  if (error === "CredentialsSignin") {
    return "E-mail ou senha inválidos.";
  }
  return error;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-black">
      {/* Left side - Branding / Visuals */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-black border-r border-white/5">
        <Image
          src="/banner-cultiva.jpg"
          alt="Cultiva Banner"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10 bg-[#050505]">

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
          className="w-full max-w-sm"
        >
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-semibold tracking-tight mb-2 text-white">Bem-vindo(a)</h2>
            <p className="text-white/60 text-sm">Faça login para acessar suas propriedades e análises.</p>
          </div>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          <div className="mt-10 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-white/60">
              Ainda não tem uma conta?{" "}
              <Link href="/cadastro" className="font-medium text-brand-main hover:text-brand-light transition-colors">
                Criar conta
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
