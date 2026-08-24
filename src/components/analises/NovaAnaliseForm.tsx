"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Loader2, Save, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type FieldOption = {
  id: string;
  name: string;
  crop: string | null;
  propertyName: string;
  city: string;
  state: string;
};

type InitialData = {
  data: string;
  profundidade: string;
  culturaAnterior: string;
  culturaDesejada: string;
};

type PhysicalData = { argila: string; silte: string; areia: string };

type ChemicalData = {
  pH: string; P: string; K: string; Ca: string; Mg: string; MO: string;
  S: string; CTC: string; V_percent: string; m_percent: string;
};

type FormData = {
  dadosIniciais: InitialData;
  parametrosFisicos: PhysicalData;
  parametrosQuimicos: ChemicalData;
};

const EMPTY_FORM: FormData = {
  dadosIniciais: {
    data: "",
    profundidade: "0-20",
    culturaAnterior: "",
    culturaDesejada: "",
  },
  parametrosFisicos: { argila: "", silte: "", areia: "" },
  parametrosQuimicos: {
    pH: "", P: "", K: "", Ca: "", Mg: "", MO: "", S: "", CTC: "", V_percent: "", m_percent: "",
  },
};

export default function NovaAnaliseForm({ fields }: { fields: FieldOption[] }) {
  const router = useRouter();
  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [fieldId, setFieldId] = useState(fields.length === 1 ? fields[0].id : "");
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  const handleAIParse = async () => {
    if (!textInput.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/parse-soil-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput }),
      });

      const data = await res.json();

      if (res.ok) {
        setFormData({
          dadosIniciais: {
            data: data.dadosIniciais?.data || formData.dadosIniciais.data,
            profundidade: data.dadosIniciais?.profundidade || formData.dadosIniciais.profundidade,
            culturaAnterior: data.dadosIniciais?.culturaAnterior || formData.dadosIniciais.culturaAnterior,
            culturaDesejada: data.dadosIniciais?.culturaDesejada || formData.dadosIniciais.culturaDesejada,
          },
          parametrosFisicos: {
            argila: toInput(data.parametrosFisicos?.argila),
            silte: toInput(data.parametrosFisicos?.silte),
            areia: toInput(data.parametrosFisicos?.areia),
          },
          parametrosQuimicos: {
            pH: toInput(data.parametrosQuimicos?.pH),
            P: toInput(data.parametrosQuimicos?.P),
            K: toInput(data.parametrosQuimicos?.K),
            Ca: toInput(data.parametrosQuimicos?.Ca),
            Mg: toInput(data.parametrosQuimicos?.Mg),
            MO: toInput(data.parametrosQuimicos?.MO),
            S: toInput(data.parametrosQuimicos?.S),
            CTC: toInput(data.parametrosQuimicos?.CTC),
            V_percent: toInput(data.parametrosQuimicos?.V_percent),
            m_percent: toInput(data.parametrosQuimicos?.m_percent),
          },
        });
        setTextInput(""); // Limpa após sucesso
      } else {
        alert("Erro da IA: " + (data.error || "não foi possível processar."));
      }
    } catch {
      alert("Erro ao processar com IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (section: keyof FormData, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaveError("");
    if (!fieldId) {
      setSaveError("Selecione o talhão ao qual esta análise pertence.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/analises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId,
          date: formData.dadosIniciais.data,
          profundidade: formData.dadosIniciais.profundidade,
          culturaAnterior: formData.dadosIniciais.culturaAnterior,
          culturaDesejada: formData.dadosIniciais.culturaDesejada,
          parametrosQuimicos: formData.parametrosQuimicos,
          parametrosFisicos: formData.parametrosFisicos,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar análise.");
      }

      router.push("/dashboard/analises");
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar análise.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 flex flex-col">
      <header className="mb-8">
        <Link href="/dashboard/analises" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar para Planilha
        </Link>
        <h1 className="text-3xl font-semibold mb-2">Nova Análise de Solo</h1>
        <p className="text-white/60">Digite manualmente ou cole o laudo para a IA preencher tudo magicamente.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* IA Assistant Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-brand-main/10 border border-brand-main/30 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-50">
              <Sparkles className="w-24 h-24 text-brand-main blur-xl group-hover:blur-2xl transition-all duration-700" />
            </div>
            <h2 className="text-xl font-medium text-brand-main flex items-center gap-2 mb-4 relative z-10">
              <Sparkles className="w-5 h-5" /> Preenchimento Mágico
            </h2>
            <p className="text-sm text-white/70 mb-4 relative z-10">
              Copie o texto do PDF do laudo do laboratório ou anotações de campo e cole aqui. A Inteligência Artificial vai extrair todos os dados para você.
            </p>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ex: Amostra 1. pH 5.5, Fósforo 12 mg, K 0.2..."
              className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-main resize-none relative z-10 mb-4"
            />
            <button
              onClick={handleAIParse}
              disabled={isLoading || !textInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-main hover:bg-brand-light disabled:bg-white/10 disabled:text-white/30 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(107,175,58,0.3)] disabled:shadow-none relative z-10"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analisando...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Preencher com IA</>
              )}
            </button>
          </div>
        </div>

        {/* Form Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl">
            {/* Seleção de Talhão */}
            <section className="mb-10">
              <h3 className="text-lg font-medium text-white mb-6 border-b border-white/10 pb-2">Talhão</h3>
              {fields.length === 0 ? (
                <div className="p-4 rounded-xl bg-brand-accent/10 border border-brand-accent/30 text-sm text-white/80 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-brand-accent shrink-0" />
                  <span>
                    Nenhum talhão cadastrado ainda.{" "}
                    <Link href="/dashboard/propriedades" className="text-brand-accent underline font-medium">
                      Cadastre uma fazenda e um talhão
                    </Link>{" "}
                    antes de salvar a análise.
                  </span>
                </div>
              ) : (
                <select
                  value={fieldId}
                  onChange={(e) => setFieldId(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-brand-main"
                >
                  <option value="">Selecione o talhão...</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.propertyName} — {f.name} ({f.city}/{f.state}){f.crop ? ` • ${f.crop}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </section>

            <section className="mb-10">
              <h3 className="text-lg font-medium text-white mb-6 border-b border-white/10 pb-2">Dados Iniciais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1 uppercase tracking-wider">Data da Coleta</label>
                  <input type="date" value={formData.dadosIniciais.data} onChange={(e) => handleChange("dadosIniciais", "data", e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-brand-main" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1 uppercase tracking-wider">Profundidade</label>
                  <input type="text" value={formData.dadosIniciais.profundidade} onChange={(e) => handleChange("dadosIniciais", "profundidade", e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-brand-main" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1 uppercase tracking-wider">Cultura Anterior</label>
                  <input type="text" value={formData.dadosIniciais.culturaAnterior} onChange={(e) => handleChange("dadosIniciais", "culturaAnterior", e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-brand-main" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1 uppercase tracking-wider">Cultura Desejada</label>
                  <input type="text" value={formData.dadosIniciais.culturaDesejada} onChange={(e) => handleChange("dadosIniciais", "culturaDesejada", e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-brand-main" />
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h3 className="text-lg font-medium text-white mb-6 border-b border-white/10 pb-2">Parâmetros Químicos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.keys(formData.parametrosQuimicos).map((key) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-white/50 mb-1 uppercase tracking-wider">{key.replace("_percent", "%")}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.parametrosQuimicos[key as keyof ChemicalData]}
                      onChange={(e) => handleChange("parametrosQuimicos", key, e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-brand-main font-mono"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-medium text-white mb-6 border-b border-white/10 pb-2">Características Físicas (%)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1 uppercase tracking-wider">Argila</label>
                  <input type="number" value={formData.parametrosFisicos.argila} onChange={(e) => handleChange("parametrosFisicos", "argila", e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-brand-main font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1 uppercase tracking-wider">Silte</label>
                  <input type="number" value={formData.parametrosFisicos.silte} onChange={(e) => handleChange("parametrosFisicos", "silte", e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-brand-main font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1 uppercase tracking-wider">Areia</label>
                  <input type="number" value={formData.parametrosFisicos.areia} onChange={(e) => handleChange("parametrosFisicos", "areia", e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-brand-main font-mono" />
                </div>
              </div>
            </section>

            <div className="pt-6 mt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-4">
              {saveError && (
                <p className="text-sm text-destructive-foreground bg-destructive/20 border border-destructive/50 rounded-lg px-4 py-2 flex-1 text-center sm:text-left">
                  {saveError}
                </p>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-white text-black hover:bg-white/90 disabled:opacity-70 font-medium rounded-xl transition-all"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? "Salvando..." : "Salvar Análise"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function toInput(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}
