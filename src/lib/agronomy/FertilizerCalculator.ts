// src/lib/agronomy/FertilizerCalculator.ts

export type Fertilizer = {
  id: string;
  name: string;
  N: number; // percentage
  P2O5: number;
  K2O: number;
};

export const CommonFertilizers: Fertilizer[] = [
  { id: "urea", name: "Ureia", N: 45, P2O5: 0, K2O: 0 },
  { id: "sulfato_amonio", name: "Sulfato de Amônio", N: 21, P2O5: 0, K2O: 0 },
  { id: "map", name: "MAP (Monoamônio Fosfato)", N: 11, P2O5: 52, K2O: 0 },
  { id: "dap", name: "DAP (Diamônio Fosfato)", N: 18, P2O5: 46, K2O: 0 },
  { id: "ss", name: "Superfosfato Simples", N: 0, P2O5: 18, K2O: 0 },
  { id: "st", name: "Superfosfato Triplo", N: 0, P2O5: 46, K2O: 0 },
  { id: "kcl", name: "Cloreto de Potássio (KCl)", N: 0, P2O5: 0, K2O: 60 },
  { id: "08-28-16", name: "Formulado 08-28-16", N: 8, P2O5: 28, K2O: 16 },
  { id: "10-20-20", name: "Formulado 10-20-20", N: 10, P2O5: 20, K2O: 20 },
  { id: "04-30-10", name: "Formulado 04-30-10", N: 4, P2O5: 30, K2O: 10 },
];

export type NutrientRequirements = {
  N: number;
  P2O5: number;
  K2O: number;
};

export type CalculationResultItem = {
  fertilizer: Fertilizer;
  kgPerHa: number;
  nutrientsSupplied: {
    N: number;
    P2O5: number;
    K2O: number;
  };
};

export class FertilizerCalculator {
  
  // Calculate quantity of a single fertilizer needed to meet a specific target nutrient.
  // E.g., How much MAP to meet 80kg of P2O5?
  static calculateSingle(fertilizer: Fertilizer, targetNutrient: 'N' | 'P2O5' | 'K2O', requiredAmount: number) {
    const concentration = fertilizer[targetNutrient];
    if (concentration === 0) return 0;
    
    // (Required kg / Concentration %) * 100
    const kgPerHa = (requiredAmount / concentration) * 100;
    return Math.round(kgPerHa * 10) / 10;
  }

  // Calculate nutrients supplied by X kg of fertilizer
  static calculateSupplied(fertilizer: Fertilizer, kgPerHa: number) {
    return {
      N: (fertilizer.N / 100) * kgPerHa,
      P2O5: (fertilizer.P2O5 / 100) * kgPerHa,
      K2O: (fertilizer.K2O / 100) * kgPerHa,
    };
  }

  // Example automated strategy generator (Basic approach)
  // 1. Choose a source of P (e.g., MAP) to fulfill all P2O5 needs.
  // 2. Subtract N supplied by MAP from total N needs.
  // 3. Choose a source of K (e.g., KCl) to fulfill all K2O needs.
  // 4. Choose a source of N (e.g., Ureia) to fulfill remaining N needs.
  static generateBasicStrategy(reqs: NutrientRequirements, pSourceId = "map", kSourceId = "kcl", nSourceId = "urea"): CalculationResultItem[] {
    const result: CalculationResultItem[] = [];
    let remaining = { ...reqs };

    // 1. Phosphorous
    if (remaining.P2O5 > 0) {
      const pFert = CommonFertilizers.find(f => f.id === pSourceId);
      if (pFert && pFert.P2O5 > 0) {
        const kg = this.calculateSingle(pFert, 'P2O5', remaining.P2O5);
        const supplied = this.calculateSupplied(pFert, kg);
        result.push({ fertilizer: pFert, kgPerHa: kg, nutrientsSupplied: supplied });
        
        remaining.N -= supplied.N;
        remaining.P2O5 -= supplied.P2O5;
        remaining.K2O -= supplied.K2O;
      }
    }

    // 2. Potassium
    if (remaining.K2O > 0) {
      const kFert = CommonFertilizers.find(f => f.id === kSourceId);
      if (kFert && kFert.K2O > 0) {
        const kg = this.calculateSingle(kFert, 'K2O', remaining.K2O);
        const supplied = this.calculateSupplied(kFert, kg);
        result.push({ fertilizer: kFert, kgPerHa: kg, nutrientsSupplied: supplied });
        
        remaining.N -= supplied.N;
        remaining.P2O5 -= supplied.P2O5;
        remaining.K2O -= supplied.K2O;
      }
    }

    // 3. Nitrogen
    if (remaining.N > 0) {
      const nFert = CommonFertilizers.find(f => f.id === nSourceId);
      if (nFert && nFert.N > 0) {
        const kg = this.calculateSingle(nFert, 'N', remaining.N);
        const supplied = this.calculateSupplied(nFert, kg);
        result.push({ fertilizer: nFert, kgPerHa: kg, nutrientsSupplied: supplied });
        
        remaining.N -= supplied.N;
      }
    }

    return result;
  }
}
