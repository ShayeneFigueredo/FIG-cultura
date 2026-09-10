"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Popup,
  Marker,
  LayersControl,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapPin,
  Layers,
  Info,
  ArrowUpRight,
  Search,
  Loader2,
  PenTool,
  RotateCcw,
  Check,
  X,
  PlusCircle,
  Trash2,
  Globe,
  Navigation,
  Compass,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Ícones personalizados SVG para o Google Earth
const createCustomPinIcon = (color: string = "#10b981", label: string = "") => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
        ${
          label
            ? `<div style="background: rgba(15, 23, 42, 0.9); color: white; font-weight: bold; font-size: 11px; padding: 2px 8px; border-radius: 9999px; border: 1px solid ${color}; white-space: nowrap; margin-bottom: 3px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);">${label}</div>`
            : ""
        }
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.5"/>
          </filter>
          <path d="M16 0C7.16344 0 0 7.16344 0 16C0 26 16 42 16 42C16 42 32 26 32 16C32 7.16344 24.8366 0 16 0Z" fill="${color}" filter="url(#shadow)"/>
          <circle cx="16" cy="16" r="6.5" fill="#ffffff"/>
        </svg>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -40],
  });
};

const defaultPinIcon = createCustomPinIcon("#10b981");
const samplePinIcon = createCustomPinIcon("#f59e0b");
const clickedPinIcon = createCustomPinIcon("#ef4444", "Novo Ponto");

export type CustomMapMarker = {
  id: string;
  name: string;
  category: "TALHAO" | "AMOSTRA" | "SEDE" | "PIVO" | "OUTRO";
  lat: number;
  lng: number;
  fieldId?: string;
};

export type FieldGisData = {
  id: string;
  name: string;
  area: number;
  crop?: string | null;
  latitude?: number;
  longitude?: number;
  latestAnalysis?: {
    id: string;
    vPercent?: number | null;
    ph?: number | null;
    p?: number | null;
    k?: number | null;
    limingNeeded?: boolean;
    date?: string;
  } | null;
  coordinates?: [number, number][];
};

type Props = {
  propertyName: string;
  city?: string;
  state?: string;
  fields: FieldGisData[];
  centerLat?: number;
  centerLng?: number;
};

// Manipulador de cliques no mapa (Desenho ou Adição de Marcadores)
function MapClickHandler({
  mode,
  onAddPoint,
  onDropMarker,
}: {
  mode: "view" | "drawing" | "add_marker";
  onAddPoint: (lat: number, lng: number) => void;
  onDropMarker: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (mode === "drawing") {
        onAddPoint(e.latlng.lat, e.latlng.lng);
      } else if (mode === "add_marker") {
        onDropMarker(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Recentraliza o mapa suavemente
function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.2 });
  }, [center, map]);
  return null;
}

// Gera contorno orgânico para talhão caso não haja polígono desenhado
function getOrganicFarmPolygon(index: number, baseLat: number, baseLng: number): [number, number][] {
  const row = Math.floor(index / 2);
  const col = index % 2;

  const lat = baseLat + row * 0.006;
  const lng = baseLng + col * 0.008;

  return [
    [lat - 0.0022, lng - 0.003],
    [lat - 0.0028, lng + 0.0018],
    [lat + 0.0008, lng + 0.0035],
    [lat + 0.0028, lng + 0.0012],
    [lat + 0.002, lng - 0.0028],
  ];
}

export default function FieldMapGisClient({
  propertyName,
  city,
  state,
  fields,
  centerLat = -18.9186,
  centerLng = -48.2772,
}: Props) {
  const router = useRouter();

  // Calcular centro inicial a partir de coordenadas ou campos
  const initialCenter: [number, number] = useMemo(() => {
    const fieldsWithCoords = fields.filter((f) => f.coordinates && f.coordinates.length > 0);
    if (fieldsWithCoords.length > 0) {
      const allPoints = fieldsWithCoords.flatMap((f) => f.coordinates!);
      const avgLat = allPoints.reduce((acc, p) => acc + p[0], 0) / allPoints.length;
      const avgLng = allPoints.reduce((acc, p) => acc + p[1], 0) / allPoints.length;
      return [avgLat, avgLng];
    }
    const fieldsWithLat = fields.filter((f) => f.latitude && f.longitude);
    if (fieldsWithLat.length > 0) {
      return [fieldsWithLat[0].latitude!, fieldsWithLat[0].longitude!];
    }
    return [centerLat, centerLng];
  }, [fields, centerLat, centerLng]);

  const [filterNutrient, setFilterNutrient] = useState<"V" | "P" | "K" | "pH">("V");
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [searchQuery, setSearchQuery] = useState(`${city || ""} ${state || ""}`.trim());
  const [isSearching, setIsSearching] = useState(false);

  // Modos de interação: Visualização / Desenho / Adicionar Marcador
  const [activeMode, setActiveMode] = useState<"view" | "drawing" | "add_marker">("view");

  // Estados de Marcadores
  const [customMarkers, setCustomMarkers] = useState<CustomMapMarker[]>([]);
  const [activeMarkerForm, setActiveMarkerForm] = useState<{
    lat: number;
    lng: number;
    name: string;
    category: "TALHAO" | "AMOSTRA" | "SEDE" | "PIVO" | "OUTRO";
    targetFieldId: string;
  } | null>(null);
  const [isSavingMarker, setIsSavingMarker] = useState(false);

  // Estados de Desenho de Polígonos
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);
  const [selectedFieldToSave, setSelectedFieldToSave] = useState<string>(fields[0]?.id || "");
  const [isSavingPolygon, setIsSavingPolygon] = useState(false);

  // Geocodificação / Busca de Endereço ou Coordenadas GPS
  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const coordMatch = searchQuery.match(/^([+-]?\d+\.?\d*),\s*([+-]?\d+\.?\d*)$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        setMapCenter([lat, lng]);
        toast.success(`Google Earth centralizado em: Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`);
        setIsSearching(false);
        return;
      }

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setMapCenter([lat, lng]);
        toast.success(`Google Earth centralizado em: ${data[0].display_name.split(",")[0]}`);
      } else {
        toast.error("Localização não encontrada. Tente com nome da cidade, UF ou coordenadas GPS.");
      }
    } catch {
      toast.error("Erro ao buscar endereço no mapa.");
    } finally {
      setIsSearching(false);
    }
  };

  // Manipulação de Marcador Solto no Google Earth
  const handleDropMarker = (lat: number, lng: number) => {
    setActiveMarkerForm({
      lat,
      lng,
      name: `Ponto de Amostragem ${customMarkers.length + 1}`,
      category: "AMOSTRA",
      targetFieldId: fields[0]?.id || "",
    });
  };

  const handleSaveMarker = async () => {
    if (!activeMarkerForm) return;

    setIsSavingMarker(true);
    try {
      // Se for associado a um talhão, persiste latitude/longitude no banco
      if (activeMarkerForm.targetFieldId) {
        const res = await fetch(`/api/fields/${activeMarkerForm.targetFieldId}/coordinates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: activeMarkerForm.lat,
            longitude: activeMarkerForm.lng,
          }),
        });
        if (!res.ok) {
          throw new Error("Erro ao salvar coordenada no talhão.");
        }
      }

      const newMarker: CustomMapMarker = {
        id: `marker-${Date.now()}`,
        name: activeMarkerForm.name || "Novo Marcador",
        category: activeMarkerForm.category,
        lat: activeMarkerForm.lat,
        lng: activeMarkerForm.lng,
        fieldId: activeMarkerForm.targetFieldId || undefined,
      };

      setCustomMarkers((prev) => [...prev, newMarker]);
      toast.success(`Marcador "${newMarker.name}" adicionado ao mapa com sucesso!`);
      setActiveMarkerForm(null);
      setActiveMode("view");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar marcador.");
    } finally {
      setIsSavingMarker(false);
    }
  };

  const handleDeleteMarker = (id: string) => {
    setCustomMarkers((prev) => prev.filter((m) => m.id !== id));
    toast.info("Marcador removido do mapa.");
  };

  // Manipulação de Desenho de Polígono
  const handleAddDrawnPoint = (lat: number, lng: number) => {
    setDrawnPoints((prev) => [...prev, [lat, lng]]);
  };

  const handleUndoDrawnPoint = () => {
    setDrawnPoints((prev) => prev.slice(0, -1));
  };

  const handleClearDrawnPoints = () => {
    setDrawnPoints([]);
  };

  const handleSavePolygon = async () => {
    if (drawnPoints.length < 3) {
      toast.error("Desenhe ao menos 3 vértices no Google Earth para formar o contorno do talhão.");
      return;
    }

    if (!selectedFieldToSave) {
      toast.error("Selecione o talhão para associar este desenho.");
      return;
    }

    setIsSavingPolygon(true);
    try {
      const res = await fetch(`/api/fields/${selectedFieldToSave}/coordinates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: drawnPoints }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar desenho.");
      }

      toast.success("Contorno do talhão salvo no Google Earth!");
      setActiveMode("view");
      setDrawnPoints([]);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar o contorno.");
    } finally {
      setIsSavingPolygon(false);
    }
  };

  // Cor do Polígono do Talhão no Google Earth conforme nutriente
  const getFieldColor = (field: FieldGisData) => {
    const analysis = field.latestAnalysis;
    if (!analysis) return { fill: "#94a3b8", border: "#64748b", label: "Sem Análise" };

    if (filterNutrient === "V") {
      const v = analysis.vPercent ?? 0;
      if (v >= 60) return { fill: "#22c55e", border: "#16a34a", label: `Adequado (${v.toFixed(0)}%)` };
      if (v >= 50) return { fill: "#eab308", border: "#ca8a04", label: `Atenção (${v.toFixed(0)}%)` };
      return { fill: "#ef4444", border: "#dc2626", label: `Crítico (${v.toFixed(0)}%)` };
    }

    if (filterNutrient === "P") {
      const p = analysis.p ?? 0;
      if (p >= 15) return { fill: "#22c55e", border: "#16a34a", label: `Adequado (${p} mg)` };
      if (p >= 8) return { fill: "#eab308", border: "#ca8a04", label: `Médio (${p} mg)` };
      return { fill: "#ef4444", border: "#dc2626", label: `Baixo (${p} mg)` };
    }

    if (filterNutrient === "K") {
      const k = analysis.k ?? 0;
      if (k >= 0.2) return { fill: "#22c55e", border: "#16a34a", label: `Adequado (${k} cmolc)` };
      if (k >= 0.12) return { fill: "#eab308", border: "#ca8a04", label: `Médio (${k} cmolc)` };
      return { fill: "#ef4444", border: "#dc2626", label: `Baixo (${k} cmolc)` };
    }

    // pH
    const ph = analysis.ph ?? 0;
    if (ph >= 5.5 && ph <= 6.5) return { fill: "#22c55e", border: "#16a34a", label: `Ideal (${ph})` };
    if (ph >= 5.0) return { fill: "#eab308", border: "#ca8a04", label: `Moderado (${ph})` };
    return { fill: "#ef4444", border: "#dc2626", label: `Ácido (${ph})` };
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Map Toolbar com Google Earth & Ferramentas de Marcadores */}
      <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              Google Earth Satélite — {propertyName}
            </h3>
            <p className="text-xs text-slate-300 flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />{" "}
              {city && state ? `${city}/${state}` : "Visão Georreferenciada Google Earth"}
            </p>
          </div>
        </div>

        {/* Ferramentas: Adicionar Marcador, Desenhar Talhão, Busca e Filtros */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Busca por Endereço ou GPS */}
          <form onSubmit={handleSearchAddress} className="flex items-center relative min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cidade, CEP ou lat, lng..."
              className="bg-slate-900/90 border border-slate-600 rounded-xl pl-8 pr-20 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 w-full"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 shadow-sm"
            >
              {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : "Buscar"}
            </button>
          </form>

          {/* Botão Adicionar Marcador 📍 */}
          <button
            onClick={() => {
              if (activeMode === "add_marker") {
                setActiveMode("view");
                setActiveMarkerForm(null);
              } else {
                setActiveMode("add_marker");
                setDrawnPoints([]);
                toast.info("Clique em qualquer ponto do Google Earth para adicionar um marcador ou ponto de amostragem.");
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeMode === "add_marker"
                ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            {activeMode === "add_marker" ? "Clique no Mapa 📍" : "Adicionar Marcador"}
          </button>

          {/* Botão Desenhar Talhão ✏️ */}
          <button
            onClick={() => {
              if (activeMode === "drawing") {
                setActiveMode("view");
                setDrawnPoints([]);
              } else {
                setActiveMode("drawing");
                setActiveMarkerForm(null);
                toast.info("Clique ponto a ponto no Google Earth para traçar o contorno do talhão.");
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeMode === "drawing"
                ? "bg-amber-500 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            {activeMode === "drawing" ? "Desenhando ✏️" : "Desenhar Talhão"}
          </button>

          {/* Filtros de Fertilidade */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700 text-xs shrink-0">
            {(["V", "P", "K", "pH"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterNutrient(mode)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs ${
                  filterNutrient === mode
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {mode === "V" ? "V%" : mode === "P" ? "P" : mode === "K" ? "K" : "pH"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Banner de Adição de Marcador */}
      {activeMode === "add_marker" && !activeMarkerForm && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/30 p-3 px-6 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>
              <strong>Modo de Marcador Ativo:</strong> Clique diretamente no local desejado no mapa Google Earth para fixar o ponto.
            </span>
          </div>
          <button
            onClick={() => setActiveMode("view")}
            className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
          >
            <X className="w-4 h-4" /> Cancelar
          </button>
        </div>
      )}

      {/* Modal / Painel Inline para Configurar o Novo Marcador Clicado */}
      {activeMarkerForm && (
        <div className="bg-slate-800 border-b border-emerald-500/40 p-4 px-6 flex flex-wrap items-center justify-between gap-4 text-xs animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
              <MapPin className="w-4 h-4" /> Novo Marcador:
            </div>

            <input
              type="text"
              value={activeMarkerForm.name}
              onChange={(e) => setActiveMarkerForm({ ...activeMarkerForm, name: e.target.value })}
              placeholder="Nome do Ponto (ex: Ponto Amostra 1)"
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-white font-medium text-xs focus:outline-none focus:border-emerald-400 w-48"
            />

            <select
              value={activeMarkerForm.category}
              onChange={(e) =>
                setActiveMarkerForm({
                  ...activeMarkerForm,
                  category: e.target.value as any,
                })
              }
              aria-label="Categoria do Marcador"
              className="bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-semibold"
            >
              <option value="AMOSTRA">Ponto de Amostragem</option>
              <option value="TALHAO">Centro do Talhão</option>
              <option value="SEDE">Sede da Fazenda</option>
              <option value="PIVO">Pivô de Irrigação</option>
              <option value="OUTRO">Outro Ponto de Interesse</option>
            </select>

            {fields.length > 0 && (
              <select
                value={activeMarkerForm.targetFieldId}
                onChange={(e) =>
                  setActiveMarkerForm({
                    ...activeMarkerForm,
                    targetFieldId: e.target.value,
                  })
                }
                aria-label="Vincular Marcador ao Talhão"
                className="bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-emerald-300 text-xs font-semibold"
              >
                <option value="">Não vincular a talhão</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    Vincular ao: {f.name} ({f.area} ha)
                  </option>
                ))}
              </select>
            )}

            <span className="text-slate-400 font-mono text-[11px]">
              [{activeMarkerForm.lat.toFixed(5)}, {activeMarkerForm.lng.toFixed(5)}]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMarkerForm(null)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors font-semibold"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
            <button
              onClick={handleSaveMarker}
              disabled={isSavingMarker}
              className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-md"
            >
              {isSavingMarker ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {isSavingMarker ? "Salvando..." : "Salvar Marcador"}
            </button>
          </div>
        </div>
      )}

      {/* Banner de Desenho de Polígono */}
      {activeMode === "drawing" && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 p-3 px-6 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-amber-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>
              Clique no Google Earth para traçar os limites (Vértices marcados: <strong>{drawnPoints.length}</strong>).
            </span>
          </div>

          <div className="flex items-center gap-2">
            {fields.length > 0 && (
              <select
                value={selectedFieldToSave}
                onChange={(e) => setSelectedFieldToSave(e.target.value)}
                aria-label="Salvar Contorno para Talhão"
                className="bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1 text-white text-xs font-semibold"
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    Salvar para: {f.name} ({f.area} ha)
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleUndoDrawnPoint}
              disabled={drawnPoints.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg transition-colors font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Desfazer
            </button>

            <button
              onClick={handleClearDrawnPoints}
              disabled={drawnPoints.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors font-medium"
            >
              <X className="w-3 h-3" /> Limpar
            </button>

            <button
              onClick={handleSavePolygon}
              disabled={drawnPoints.length < 3 || isSavingPolygon}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-md"
            >
              {isSavingPolygon ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              {isSavingPolygon ? "Salvando..." : "Salvar Contorno no Talhão"}
            </button>
          </div>
        </div>
      )}

      {/* Contêiner do Mapa com Google Earth */}
      <div className="relative w-full h-[540px] z-0">
        <MapContainer
          center={mapCenter}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-full"
          style={{ background: "#0a0a0a" }}
        >
          <MapFlyTo center={mapCenter} />
          <MapClickHandler
            mode={activeMode}
            onAddPoint={handleAddDrawnPoint}
            onDropMarker={handleDropMarker}
          />

          {/* Camadas do Mapa com Google Earth como Padrão */}
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Google Earth (Satélite HD + Nomes)">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                attribution="Imagens de Satélite &copy; Google Earth"
                maxZoom={20}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Google Earth (Satélite Puro HD)">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                attribution="Imagens de Satélite &copy; Google Earth"
                maxZoom={20}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Google Maps (Relevo / Terreno)">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
                attribution="Mapas &copy; Google"
                maxZoom={20}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Google Maps (Ruas)">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                attribution="Mapas &copy; Google"
                maxZoom={20}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Esri World Imagery">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Polígono em Construção */}
          {drawnPoints.length > 0 && (
            <>
              <Polyline positions={drawnPoints} pathOptions={{ color: "#f59e0b", weight: 3, dashArray: "6, 6" }} />
              {drawnPoints.length >= 3 && (
                <Polygon
                  positions={drawnPoints}
                  pathOptions={{ fillColor: "#f59e0b", fillOpacity: 0.4, color: "#f59e0b", weight: 3 }}
                />
              )}
              {drawnPoints.map((pt, i) => (
                <Marker key={i} position={pt} icon={samplePinIcon} />
              ))}
            </>
          )}

          {/* Marcador Clicado Temporário */}
          {activeMarkerForm && (
            <Marker position={[activeMarkerForm.lat, activeMarkerForm.lng]} icon={clickedPinIcon}>
              <Popup>
                <div className="p-2 text-slate-900 font-sans text-xs">
                  <div className="font-bold text-emerald-800 border-b pb-1 mb-1">
                    📍 {activeMarkerForm.name || "Ponto Clicado"}
                  </div>
                  <p className="text-slate-600 mb-1">
                    Lat: <strong>{activeMarkerForm.lat.toFixed(5)}</strong>, Lng:{" "}
                    <strong>{activeMarkerForm.lng.toFixed(5)}</strong>
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marcadores Salvos / Customizados */}
          {customMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={createCustomPinIcon(
                marker.category === "AMOSTRA"
                  ? "#f59e0b"
                  : marker.category === "SEDE"
                  ? "#3b82f6"
                  : marker.category === "PIVO"
                  ? "#06b6d4"
                  : "#10b981",
                marker.name
              )}
            >
              <Popup>
                <div className="p-2 text-slate-900 font-sans text-xs min-w-[180px]">
                  <div className="font-bold text-sm text-slate-900 border-b pb-1 mb-1">
                    📍 {marker.name}
                  </div>
                  <div className="text-slate-600 space-y-1 mb-2">
                    <p>Tipo: <strong>{marker.category}</strong></p>
                    <p className="font-mono text-[10px]">
                      Lat: {marker.lat.toFixed(5)} <br />
                      Lng: {marker.lng.toFixed(5)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteMarker(marker.id)}
                    className="w-full flex items-center justify-center gap-1 py-1 px-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded border border-red-200 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Excluir Marcador
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Marcadores Centrais dos Talhões */}
          {fields
            .filter((f) => f.latitude && f.longitude)
            .map((field) => (
              <Marker
                key={`field-center-${field.id}`}
                position={[field.latitude!, field.longitude!]}
                icon={createCustomPinIcon("#10b981", field.name)}
              >
                <Popup>
                  <div className="p-2 text-slate-900 font-sans text-xs">
                    <div className="font-bold text-sm text-emerald-800 border-b pb-1 mb-1">
                      🌱 {field.name}
                    </div>
                    <p className="text-slate-600 mb-2">
                      Área: <strong>{field.area} ha</strong> | Cultura: <strong>{field.crop || "Não definida"}</strong>
                    </p>
                    {field.latestAnalysis && (
                      <Link
                        href={`/dashboard/analises/${field.latestAnalysis.id}/planejamento`}
                        className="w-full block py-1 px-2 bg-emerald-600 text-white font-bold rounded text-center !no-underline"
                        style={{ color: "#ffffff" }}
                      >
                        Ver Laudo & Planejamento
                      </Link>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Polígonos dos Talhões no Google Earth */}
          {fields.map((field, idx) => {
            const polygonCoords =
              field.coordinates && field.coordinates.length >= 3
                ? field.coordinates
                : getOrganicFarmPolygon(idx, mapCenter[0], mapCenter[1]);
            const colorInfo = getFieldColor(field);

            return (
              <Polygon
                key={field.id}
                positions={polygonCoords}
                pathOptions={{
                  fillColor: colorInfo.fill,
                  fillOpacity: 0.55,
                  color: colorInfo.border,
                  weight: 3,
                }}
              >
                <Popup className="custom-gis-popup">
                  <div className="p-2 min-w-[200px] text-slate-900 font-sans">
                    <div className="font-bold text-base border-b pb-1 mb-2 flex items-center justify-between">
                      <span>{field.name}</span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                        {field.area} ha
                      </span>
                    </div>
                    {field.crop && (
                      <div className="text-xs font-semibold text-emerald-700 mb-2">
                        🌱 Cultura: <span className="capitalize">{field.crop}</span>
                      </div>
                    )}
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 text-xs space-y-1 mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Status {filterNutrient}:</span>
                        <strong className="font-bold">{colorInfo.label}</strong>
                      </div>
                      {field.latestAnalysis && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-500">V% Saturação:</span>
                            <strong>{field.latestAnalysis.vPercent?.toFixed(1) ?? "-"}%</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Fósforo (P):</span>
                            <strong>{field.latestAnalysis.p ?? "-"} mg/dm³</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Potássio (K):</span>
                            <strong>{field.latestAnalysis.k ?? "-"} cmolc/dm³</strong>
                          </div>
                        </>
                      )}
                    </div>
                    {field.latestAnalysis && (
                      <Link
                        href={`/dashboard/analises/${field.latestAnalysis.id}/planejamento`}
                        className="w-full flex items-center justify-center gap-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 !text-white font-bold text-xs rounded transition-colors text-center !no-underline shadow-md"
                        style={{ color: "#ffffff" }}
                      >
                        Ver Planejamento <ArrowUpRight className="w-3.5 h-3.5 !text-white" style={{ color: "#ffffff" }} />
                      </Link>
                    )}
                  </div>
                </Popup>
              </Polygon>
            );
          })}
        </MapContainer>

        {/* Legenda Flutuante do Google Earth */}
        <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-3 text-xs text-white shadow-2xl max-w-xs">
          <div className="font-bold text-white/90 mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-400" /> Legenda de Fertilidade ({filterNutrient})
          </div>
          <div className="space-y-1.5 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300" />
              <span className="text-slate-200">Adequado / Elevado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-300" />
              <span className="text-slate-300">Nível Médio (Atenção)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 border border-red-300" />
              <span className="text-slate-300">Crítico (Calagem/Adubação)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-500 border border-slate-400" />
              <span className="text-slate-400">Sem Análise Registrada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
