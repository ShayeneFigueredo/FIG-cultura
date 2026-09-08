"use client";

import dynamic from "next/dynamic";
import React from "react";
import { Loader2 } from "lucide-react";
import type { FieldGisData } from "./FieldMapGisClient";

const FieldMapGisClient = dynamic(() => import("./FieldMapGisClient"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[480px] bg-black/40 border border-white/10 rounded-3xl flex items-center justify-center text-white/50 gap-2">
      <Loader2 className="w-6 h-6 animate-spin text-brand-main" />
      <span>Carregando Mapa Satélite GIS...</span>
    </div>
  ),
});

type Props = {
  propertyName: string;
  city?: string;
  state?: string;
  fields: FieldGisData[];
  centerLat?: number;
  centerLng?: number;
};

export default function FieldMapGis(props: Props) {
  return <FieldMapGisClient {...props} />;
}
