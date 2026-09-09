import { prisma } from "@/lib/prisma";
import { AgronomicEngine } from "./AgronomicEngine";
import { FertilizerCalculator, CommonFertilizers } from "./FertilizerCalculator";

export const DEFAULT_FERTILIZERS = [
  ...CommonFertilizers,
  { id: "calcario", name: "Calcário Agrícola (PRNT 100%)", N: 0, P2O5: 0, K2O: 0 },
];

export async function ensureFertilizersExist() {
  for (const fert of DEFAULT_FERTILIZERS) {
    await prisma.fertilizer.upsert({
      where: { id: fert.id },
      update: {
        name: fert.name,
        composition: { N: fert.N, P2O5: fert.P2O5, K2O: fert.K2O },
      },
      create: {
        id: fert.id,
        name: fert.name,
        composition: { N: fert.N, P2O5: fert.P2O5, K2O: fert.K2O },
      },
    });
  }
}

export async function generateAndPersistAnalysisPlanning(analysisId: string) {
  // Garante que os fertilizantes padrão existem no banco
  await ensureFertilizersExist();

  const analysis = await prisma.soilAnalysis.findUnique({
    where: { id: analysisId },
    include: {
      parameters: true,
      field: { include: { property: true } },
    },
  });

  if (!analysis) {
    throw new Error("Análise de solo não encontrada.");
  }

  const cropKey = analysis.culturaDesejada || "soja";
  const yieldRaw = analysis.produtividade || 60; // default 60 sc/ha
  const yieldTon = AgronomicEngine.scToTon(yieldRaw, cropKey);

  const getParam = (el: string) => {
    return (
      analysis.parameters.find(
        (p) => p.element.toUpperCase() === el.toUpperCase()
      )?.value || 0
    );
  };

  const ph = getParam("pH");
  const p = getParam("P");
  const k = getParam("K");
  const ca = getParam("Ca");
  const mg = getParam("Mg");
  const h_al = getParam("H+Al") || getParam("H+AL");

  const sb = ca + mg + k;
  const ctc = sb + h_al;
  const vPercent = ctc > 0 ? (sb / ctc) * 100 : getParam("V%") || getParam("V_percent") || 0;

  const pLevel = AgronomicEngine.interpretNutrient("P", p);
  const kLevel = AgronomicEngine.interpretNutrient("K", k);

  // Cálculos agronômicos do motor
  const limingTonPerHa = AgronomicEngine.calculateLiming(ctc, vPercent, cropKey, 100, ph);
  const sulfurKgHa = AgronomicEngine.calculateAcidification(ph);
  const npkNeeds = AgronomicEngine.calculateNPK(cropKey, yieldTon, pLevel, kLevel);
  const strategyItems = FertilizerCalculator.generateBasicStrategy(npkNeeds);

  // Transação para substituir dados anteriores de recomendação/planejamento
  await prisma.$transaction([
    prisma.nutrientRecommendation.deleteMany({ where: { soilAnalysisId: analysisId } }),
    prisma.fertilizationStrategy.deleteMany({ where: { soilAnalysisId: analysisId } }),
    prisma.cropPlanning.deleteMany({ where: { soilAnalysisId: analysisId } }),

    prisma.nutrientRecommendation.createMany({
      data: [
        { soilAnalysisId: analysisId, nutrient: "N", recommendedDose: npkNeeds.N },
        { soilAnalysisId: analysisId, nutrient: "P2O5", recommendedDose: npkNeeds.P2O5 },
        { soilAnalysisId: analysisId, nutrient: "K2O", recommendedDose: npkNeeds.K2O },
        { soilAnalysisId: analysisId, nutrient: "Calcario", recommendedDose: limingTonPerHa },
        { soilAnalysisId: analysisId, nutrient: "EnxofreElementar", recommendedDose: sulfurKgHa },
      ],
    }),

    prisma.fertilizationStrategy.create({
      data: {
        soilAnalysisId: analysisId,
        name: "Estratégia Recomendada FIG AgroTech",
        totalCost: 0,
        items: {
          create: strategyItems.map((item) => ({
            fertilizerId: item.fertilizer.id,
            doseKgHa: item.kgPerHa,
            pricePerTon: 3000,
          })),
        },
      },
    }),

    prisma.cropPlanning.createMany({
      data: [
        ...(limingTonPerHa > 0
          ? [
              {
                soilAnalysisId: analysisId,
                fase: "Pré-Plantio (Calagem)",
                diasPosPlantio: -60,
                fertilizerId: "calcario",
                doseKgHa: limingTonPerHa * 1000,
              },
            ]
          : []),
        ...strategyItems.map((item, index) => {
          let fase = "Plantio (Adubação de Base)";
          let dias = 0;
          if (item.fertilizer.id === "kcl") {
            fase = "Cobertura (Potássio)";
            dias = 20;
          } else if (item.fertilizer.id === "urea" || item.fertilizer.id === "sulfato_amonio") {
            fase = `Cobertura ${index + 1} (Nitrogênio)`;
            dias = 30;
          }
          return {
            soilAnalysisId: analysisId,
            fase,
            diasPosPlantio: dias,
            fertilizerId: item.fertilizer.id,
            doseKgHa: item.kgPerHa,
          };
        }),
      ],
    }),
  ]);

  return { npkNeeds, limingTonPerHa, strategyItems };
}
