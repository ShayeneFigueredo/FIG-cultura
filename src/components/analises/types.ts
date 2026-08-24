// Formato da linha de análise exibida na planilha (DataGrid / Export CSV)

export interface GridFertilizer {
  id: string;
  name: string;
}

export interface GridStrategyItem {
  doseKgHa: number | null;
  fertilizer: GridFertilizer | null;
}

export interface GridStrategy {
  items: GridStrategyItem[];
}

export interface GridCropPlanning {
  fase: string | null;
  fertilizer: GridFertilizer | null;
}

export interface GridParameter {
  element: string;
  value: number;
}

export interface GridAnalysis {
  id: string;
  date: Date | string;
  depth: string;
  culturaAnterior: string | null;
  culturaDesejada: string | null;
  produtividade: number | null;
  laboratory: string | null;
  methodology: string | null;
  sistemaCultivo: string | null;
  observacoes: string | null;
  field: {
    name: string;
    property: { name: string };
  } | null;
  parameters: GridParameter[];
  physicalChars: { argila: number | null } | null;
  strategies: GridStrategy[];
  cropPlannings: GridCropPlanning[];
}
