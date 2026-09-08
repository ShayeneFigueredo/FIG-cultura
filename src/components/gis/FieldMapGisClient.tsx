"use client";

import React, { useState } from "react";
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
  Filter,
  ArrowUpRight,
  Search,
  Loader2,
  PenTool,
  RotateCcw,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Custom Leaflet Pin Icon for clicked locations
const customPinIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export type FieldGisData = {
  id: string;
  name: string;
  area: number;
  crop?: string | null;
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

// Map click handler for drawing polygons or dropping pins
function MapClickHandler({
  isDrawingMode,
  onAddPoint,
  onSelectLocation,
}: {
  isDrawingMode: boolean;
  onAddPoint: (lat: number, lng: number) => void;
  onSelectLocation: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (isDrawingMode) {
        onAddPoint(e.latlng.lat, e.latlng.lng);
      } else {
        onSelectLocation(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Re-centers map dynamically when search or saved location changes
function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(center, 15, { duration: 1.2 });
  }, [center, map]);
  return null;
}

// Generates an organic, irregular farm polygon contour (not a rigid square)
function getOrganicFarmPolygon(index: number, baseLat: number, baseLng: number): [number, number][] {
  const row = Math.floor(index / 2);
  const col = index % 2;

  const lat = baseLat + row * 0.006;
  const lng = baseLng + col * 0.008;

  return [
    [lat - 0.0022, lng - 0.0030],
    [lat - 0.0028, lng + 0.0018],
    [lat + 0.0008, lng + 0.0035],
    [lat + 0.0028, lng + 0.0012],
    [lat + 0.0020, lng - 0.0028],
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

  // If fields have custom coordinates, calculate initial average center
  const initialCenter: [number, number] = React.useMemo(() => {
    const fieldsWithCoords = fields.filter((f) => f.coordinates && f.coordinates.length > 0);
    if (fieldsWithCoords.length > 0) {
      const allPoints = fieldsWithCoords.flatMap((f) => f.coordinates!);
      const avgLat = allPoints.reduce((acc, p) => acc + p[0], 0) / allPoints.length;
      const avgLng = allPoints.reduce((acc, p) => acc + p[1], 0) / allPoints.length;
      return [avgLat, avgLng];
    }
    return [centerLat, centerLng];
  }, [fields, centerLat, centerLng]);

  const [filterNutrient, setFilterNutrient] = useState<"V" | "P" | "K" | "pH">("V");
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [searchQuery, setSearchQuery] = useState(`${city || ""} ${state || ""}`.trim());
  const [isSearching, setIsSearching] = useState(false);
  const [clickedPin, setClickedPin] = useState<{ lat: number; lng: number } | null>(null);

  // Polygon Drawing Mode States
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);
  const [selectedFieldToSave, setSelectedFieldToSave] = useState<string>(fields[0]?.id || "");
  const [isSavingPolygon, setIsSavingPolygon] = useState(false);

  // Address Geocoding via OpenStreetMap Nominatim
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
        setClickedPin({ lat, lng });
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
        setClickedPin({ lat, lng });
        toast.success(`Mapa centralizado em: ${data[0].display_name.split(",")[0]}`);
      } else {
        toast.error("Localização não encontrada. Tente com nome da cidade, UF ou coordenadas.");
      }
    } catch {
      toast.error("Erro ao buscar endereço no mapa.");
    } finally {
      setIsSearching(false);
    }
  };

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
      toast.error("Desenhe ao menos 3 vértices no mapa para formar o polígono do talhão.");
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

      toast.success("Desenho do talhão salvo com sucesso!");
      setIsDrawingMode(false);
      setDrawnPoints([]);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar o polígono.");
    } finally {
      setIsSavingPolygon(false);
    }
  };

  // Determine field polygon color based on nutrient level
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
    <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Map Toolbar with Address Search and Drawing Tools */}
      <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-main/20 flex items-center justify-center border border-brand-main/30 text-brand-main shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base flex items-center gap-2">
              Mapa GIS — {propertyName}
            </h3>
            <p className="text-xs text-white/50 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-main" /> {city && state ? `${city}/${state}` : "Visão Georreferenciada Satélite"}
            </p>
          </div>
        </div>

        {/* Controls: Search, Draw Mode, Nutrient Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Address Search */}
          <form onSubmit={handleSearchAddress} className="flex items-center relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cidade, endereço ou lat, lng..."
              className="bg-black/50 border border-white/10 rounded-xl pl-9 pr-24 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-brand-main w-full sm:w-60"
            />
            <Search className="w-4 h-4 text-white/40 absolute left-3" />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1.5 px-3 py-1 bg-brand-main hover:bg-brand-light text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1"
            >
              {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : "Buscar"}
            </button>
          </form>

          {/* Toggle Polygon Drawing Mode Button */}
          <button
            onClick={() => {
              setIsDrawingMode(!isDrawingMode);
              if (!isDrawingMode) toast.info("Clique no mapa de satélite ponto a ponto para desenhar o contorno real da fazenda/talhão.");
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              isDrawingMode
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                : "bg-white/10 hover:bg-white/20 text-white border-white/10"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            {isDrawingMode ? "Modo Desenho Ativo" : "Desenhar Talhão"}
          </button>

          {/* Filter Selection */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 text-xs shrink-0">
            {(["V", "P", "K", "pH"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterNutrient(mode)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs ${
                  filterNutrient === mode
                    ? "bg-brand-main text-white shadow-md"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {mode === "V" ? "V%" : mode === "P" ? "P" : mode === "K" ? "K" : "pH"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Polygon Drawing Banner Controls */}
      {isDrawingMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 p-3 px-6 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-amber-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>
              Clique no mapa para criar vértices (Pontos inseridos: <strong>{drawnPoints.length}</strong>).
            </span>
          </div>

          <div className="flex items-center gap-2">
            {fields.length > 0 && (
              <select
                value={selectedFieldToSave}
                onChange={(e) => setSelectedFieldToSave(e.target.value)}
                className="bg-black/60 border border-white/20 rounded-lg px-2.5 py-1 text-white text-xs"
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
              className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Desfazer
            </button>

            <button
              onClick={handleClearDrawnPoints}
              disabled={drawnPoints.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" /> Limpar
            </button>

            <button
              onClick={handleSavePolygon}
              disabled={drawnPoints.length < 3 || isSavingPolygon}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-md"
            >
              {isSavingPolygon ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              {isSavingPolygon ? "Salvando..." : "Salvar Contorno Real"}
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full h-[520px] z-0">
        <MapContainer
          center={mapCenter}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-full"
          style={{ background: "#0a0a0a" }}
        >
          <MapFlyTo center={mapCenter} />
          <MapClickHandler
            isDrawingMode={isDrawingMode}
            onAddPoint={handleAddDrawnPoint}
            onSelectLocation={(lat, lng) => {
              setClickedPin({ lat, lng });
            }}
          />

          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Satélite HD (Esri)">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, GIS User Community"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Mapa de Ruas (OSM)">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Render Live Polygon Being Drawn */}
          {drawnPoints.length > 0 && (
            <>
              <Polyline positions={drawnPoints} pathOptions={{ color: "#f59e0b", weight: 3, dashArray: "6, 6" }} />
              {drawnPoints.length >= 3 && (
                <Polygon
                  positions={drawnPoints}
                  pathOptions={{ fillColor: "#f59e0b", fillOpacity: 0.35, color: "#f59e0b", weight: 3 }}
                />
              )}
              {drawnPoints.map((pt, i) => (
                <Marker key={i} position={pt} icon={customPinIcon} />
              ))}
            </>
          )}

          {/* Render Clicked Pin */}
          {clickedPin && !isDrawingMode && (
            <Marker position={[clickedPin.lat, clickedPin.lng]} icon={customPinIcon}>
              <Popup>
                <div className="p-2 text-slate-900 font-sans text-xs">
                  <div className="font-bold border-b pb-1 mb-1 text-emerald-800">
                    📍 Ponto Selecionado no Mapa
                  </div>
                  <div className="text-slate-600 mb-2 font-mono">
                    Lat: <strong>{clickedPin.lat.toFixed(5)}</strong> <br />
                    Lng: <strong>{clickedPin.lng.toFixed(5)}</strong>
                  </div>
                  <button
                    onClick={() => {
                      toast.success(
                        `Coordenada selecionada: Lat ${clickedPin.lat.toFixed(5)}, Lng ${clickedPin.lng.toFixed(5)}`
                      );
                    }}
                    className="w-full py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-center"
                  >
                    Usar Coordenada no Talhão
                  </button>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Render Field Polygons (Organic Contours or Saved Custom Drawn Polygons) */}
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

        {/* Floating Legend */}
        <div className="absolute bottom-4 left-4 z-[400] bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-xs text-white shadow-xl max-w-xs">
          <div className="font-semibold text-white/80 mb-2 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-brand-main" /> Legenda de Fertilidade ({filterNutrient})
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300" />
              <span className="text-white/70">Nível Adequado / Elevado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-300" />
              <span className="text-white/70">Nível Médio (Atenção)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 border border-red-300" />
              <span className="text-white/70">Nível Crítico (Necessita Correção)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400 border border-slate-300" />
              <span className="text-white/50">Sem Análise Cadastrada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
