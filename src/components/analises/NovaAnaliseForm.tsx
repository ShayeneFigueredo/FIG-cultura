"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Loader2, Save, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
        toast.success("Dados da análise extraídos com sucesso pela IA!");
      } else {
        toast.error("Erro da IA: " + (data.error || "não foi possível processar."));
      }
    } catch {
      toast.error("Erro ao processar com IA.");
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
        <Link href="/dashboard/analises" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4 text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Voltar para Planilha
        </Link>
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Nova Análise de Solo</h1>
        <p className="text-slate-600 font-medium">Digite manualmente ou cole o laudo para a IA preencher tudo magicamente.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* IA Assistant Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-brand-main" /> Preenchimento Mágico
            </h2>
            <p className="text-sm text-slate-600 mb-4 font-medium leading-relaxed">
              Copie o texto do PDF do laudo do laboratório ou anotações de campo e cole aqui. A Inteligência Artificial vai extrair todos os dados para você.
            </p>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ex: Amostra 1. pH 5.5, Fósforo 12 mg, K 0.2..."
              className="w-full h-40 !bg-white border-2 border-slate-300 rounded-xl p-4 text-sm !text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-main resize-none mb-4 shadow-sm font-medium"
            />
            <button
              onClick={handleAIParse}
              disabled={isLoading || !textInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-main hover:bg-brand-light disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-all shadow-md"
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
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-xl">
            {/* Seleção de Talhão */}
            <section className="mb-10">
              <h3 className="text-lg font-bold text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">Talhão</h3>
              {fields.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-200 text-sm text-amber-900 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    Nenhum talhão cadastrado ainda.{" "}
                    <Link href="/dashboard/propriedades" className="text-amber-700 underline font-bold">
                      Cadastre uma fazenda e um talhão
                    </Link>{" "}
                    antes de salvar a análise.
                  </span>
                </div>
              ) : (
                <select
                  value={fieldId}
                  onChange={(e) => setFieldId(e.target.value)}
                  className="w-full !bg-white border-2 border-slate-300 rounded-xl px-4 py-3 !text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-main shadow-sm font-semibold"
                >
                  <option value="" className="!bg-white !text-slate-900">Selecione o talhão...</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.id} className="!bg-white !text-slate-900">
                      {f.propertyName} — {f.name} ({f.city}/{f.state}){f.crop ? ` • ${f.crop}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </section>

            <section className="mb-10">
              <h3 className="text-lg font-bold text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">Dados Iniciais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">Data da Coleta</label>
                  <input type="date" value={formData.dadosIniciais.data} onChange={(e) => handleChange("dadosIniciais", "data", e.target.value)} className="w-full !bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 !text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-main shadow-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">Profundidade</label>
                  <input type="text" value={formData.dadosIniciais.profundidade} onChange={(e) => handleChange("dadosIniciais", "profundidade", e.target.value)} className="w-full !bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 !text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-main shadow-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">Cultura Anterior</label>
                  <input type="text" value={formData.dadosIniciais.culturaAnterior} onChange={(e) => handleChange("dadosIniciais", "culturaAnterior", e.target.value)} className="w-full !bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 !text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-main shadow-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">Cultura Desejada</label>
                  <input type="text" value={formData.dadosIniciais.culturaDesejada} onChange={(e) => handleChange("dadosIniciais", "culturaDesejada", e.target.value)} className="w-full !bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 !text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-main shadow-sm font-semibold" />
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h3 className="text-lg font-bold text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">Parâmetros Químicos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.keys(formData.parametrosQuimicos).map((key) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">{key.replace("_percent", "%")}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.parametrosQuimicos[key as keyof ChemicalData]}
                      onChange={(e) => handleChange("parametrosQuimicos", key, e.target.value)}
                      className="w-full !bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 !text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-main shadow-sm font-mono font-semibold"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">Características Físicas (%)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">Argila</label>
                  <input type="number" value={formData.parametrosFisicos.argila} onChange={(e) => handleChange("parametrosFisicos", "argila", e.target.value)} className="w-full !bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 !text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-main shadow-sm font-mono font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">Silte</label>
                  <input type="number" value={formData.parametrosFisicos.silte} onChange={(e) => handleChange("parametrosFisicos", "silte", e.target.value)} className="w-full !bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 !text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-main shadow-sm font-mono font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">Areia</label>
                  <input type="number" value={formData.parametrosFisicos.areia} onChange={(e) => handleChange("parametrosFisicos", "areia", e.target.value)} className="w-full !bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 !text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-main shadow-sm font-mono font-semibold" />
                </div>
              </div>
            </section>

            <div className="pt-6 mt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-4">
              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex-1 text-center sm:text-left font-medium">
                  {saveError}
                </p>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-brand-main hover:bg-brand-light text-white disabled:opacity-70 font-semibold rounded-xl transition-all shadow-md"
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
