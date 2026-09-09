// src/lib/agronomy/AgronomicEngine.ts

export type CropRequirement = {
  name: string;
  targetVPercent: number; // Saturação por bases desejada (V2)
  targetMgPercent?: number;
  extractionPerTon: {
    N: number; // kg per ton of yield
    P2O5: number;
    K2O: number;
  };
};

// Simplified database for MVP representing typical values (general average).
// In a real system, these would be fine-tuned per state (e.g. Boletim 100 vs Cerrado).
export const CropDatabase: Record<string, CropRequirement> = {
  soja: { name: "Soja", targetVPercent: 60, extractionPerTon: { N: 0, P2O5: 15, K2O: 20 } }, // N is fixed by inoculant
  milho: { name: "Milho", targetVPercent: 70, extractionPerTon: { N: 22, P2O5: 10, K2O: 15 } },
  feijao: { name: "Feijão", targetVPercent: 70, extractionPerTon: { N: 35, P2O5: 12, K2O: 20 } },
  algodao: { name: "Algodão", targetVPercent: 60, extractionPerTon: { N: 55, P2O5: 20, K2O: 45 } },
  arroz: { name: "Arroz", targetVPercent: 50, extractionPerTon: { N: 15, P2O5: 5, K2O: 15 } },
  sorgo: { name: "Sorgo", targetVPercent: 60, extractionPerTon: { N: 20, P2O5: 8, K2O: 12 } },
  cafe: { name: "Café", targetVPercent: 60, extractionPerTon: { N: 40, P2O5: 10, K2O: 45 } },
  cana: { name: "Cana-de-açúcar", targetVPercent: 60, extractionPerTon: { N: 1.2, P2O5: 0.3, K2O: 1.5 } }, // per ton of cane
  mandioca: { name: "Mandioca", targetVPercent: 50, extractionPerTon: { N: 6, P2O5: 1.5, K2O: 7 } },
  amendoim: { name: "Amendoim", targetVPercent: 60, extractionPerTon: { N: 0, P2O5: 10, K2O: 15 } },
  gergelim: { name: "Gergelim", targetVPercent: 60, extractionPerTon: { N: 30, P2O5: 12, K2O: 25 } },
  hortalicas: { name: "Hortaliças", targetVPercent: 80, extractionPerTon: { N: 30, P2O5: 15, K2O: 40 } },
  frutiferas: { name: "Frutíferas", targetVPercent: 70, extractionPerTon: { N: 25, P2O5: 10, K2O: 30 } },
  outras: { name: "Outras", targetVPercent: 60, extractionPerTon: { N: 20, P2O5: 10, K2O: 20 } },
};

export type InterpretationLevel = "Baixo" | "Médio" | "Adequado" | "Alto";

export class AgronomicEngine {
  
  // Interprets nutrient levels in soil (simplified generic ranges for MVP)
  static interpretNutrient(element: string, value: number): InterpretationLevel {
    const v = value;
    switch(element.toUpperCase()) {
      case 'PH':
        if (v < 5.0) return "Baixo";
        if (v <= 5.4) return "Médio";
        if (v <= 6.5) return "Adequado";
        return "Alto";
      case 'P': // Mehlich 1 approx (mg/dm3)
        if (v < 8) return "Baixo";
        if (v <= 15) return "Médio";
        if (v <= 30) return "Adequado";
        return "Alto";
      case 'K': // cmolc/dm3
        if (v < 0.12) return "Baixo";
        if (v <= 0.20) return "Médio";
        if (v <= 0.30) return "Adequado";
        return "Alto";
      case 'CA': // cmolc/dm3
        if (v < 1.5) return "Baixo";
        if (v <= 2.5) return "Médio";
        if (v <= 4.0) return "Adequado";
        return "Alto";
      case 'MG': // cmolc/dm3
        if (v < 0.5) return "Baixo";
        if (v <= 0.8) return "Médio";
        if (v <= 1.5) return "Adequado";
        return "Alto";
      case 'V%':
        if (v < 40) return "Baixo";
        if (v <= 50) return "Médio";
        if (v <= 70) return "Adequado";
        return "Alto";
      default:
        return "Médio";
    }
  }

  // Calculates Liming Requirement (Necessidade de Calagem) or Soil Acidification
  // - Soil pH ideal range: 5.5 to 6.5
  // - Soil pH > 6.8 / 7.0 (Alkaline): DO NOT apply Calcário! Apply Elemental Sulfur (Enxofre Elementar Sº) to lower pH to 5.5 - 6.5.
  // - Soil pH < 5.5 (Acid): Apply Calcário via Base Saturation method NC (t/ha) = (V2 - V1) * CTC / PRNT.
  static calculateLiming(ctc: number, vAtual: number, cropKey: string, prnt: number = 100, ph?: number): number {
    if (ph !== undefined && ph >= 6.8) {
      return 0; // Solo alcalino não recebe calcário!
    }

    const crop = CropDatabase[cropKey.toLowerCase()] || CropDatabase['outras'];
    const v2 = crop.targetVPercent;
    
    if (vAtual >= v2) return 0; // No liming needed

    const nc = ((v2 - vAtual) * ctc) / prnt;
    return Math.max(0, parseFloat(nc.toFixed(2)));
  }

  // Calculates Soil Acidification (Enxofre Elementar Sº in kg/ha) when soil is alkaline (pH > 6.5)
  static calculateAcidification(ph: number, targetPh: number = 6.0): number {
    if (ph <= 6.5) return 0;
    // Estimativa agronômica: ~ 400 kg/ha de Enxofre Elementar (Sº) por ponto de pH acima do ideal (6.0)
    const deltaPh = ph - targetPh;
    const sulfurKg = Math.round(deltaPh * 400);
    return Math.max(0, sulfurKg);
  }

  // Calculates Fertilizer Requirement (Necessidade de Adubação) based on expected yield (sc/ha or ton/ha)
  // For MVP, we use extraction tables. E.g. Milho: 150 sc/ha = 9 tons/ha. 9 * 22kg N = 198kg N/ha.
  // Note: expectedYield needs to be in tons/ha. If input is sc/ha, we must convert.
  static calculateNPK(cropKey: string, yieldTonPerHa: number, soilPLevel: InterpretationLevel, soilKLevel: InterpretationLevel) {
    const crop = CropDatabase[cropKey.toLowerCase()] || CropDatabase['outras'];
    
    // Base extraction
    let nReq = crop.extractionPerTon.N * yieldTonPerHa;
    let pReq = crop.extractionPerTon.P2O5 * yieldTonPerHa;
    let kReq = crop.extractionPerTon.K2O * yieldTonPerHa;

    // Adjust based on soil levels (Simplified logic: if Low, we add 50% for correction. If High, we reduce 30%)
    if (soilPLevel === "Baixo") pReq *= 1.5;
    else if (soilPLevel === "Alto") pReq *= 0.7;

    if (soilKLevel === "Baixo") kReq *= 1.5;
    else if (soilKLevel === "Alto") kReq *= 0.7;

    return {
      N: Math.round(nReq),
      P2O5: Math.round(pReq),
      K2O: Math.round(kReq)
    };
  }

  // Helper to standardise conversion of Sc/ha to Ton/ha
  static scToTon(sc: number, cropKey: string): number {
    const crop = cropKey.toLowerCase();
    let kgPerSc = 60; // Standard 60kg bag for most crops
    
    if (crop === 'arroz') kgPerSc = 50;
    if (crop === 'algodao' || crop === 'amendoim' || crop === 'hortalicas' || crop === 'frutiferas' || crop === 'cana') {
      // These are usually already input as ton/ha or have different units. 
      // If user inputs yield for cane, it's 100 tons/ha. We just return the number.
      // We'll assume the frontend asks for Ton/ha for these, and Sc/ha for grains.
      return sc; // Return as-is, assuming it's already in tons.
    }

    return (sc * kgPerSc) / 1000;
  }
}
