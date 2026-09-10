import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgronomicEngine } from "@/lib/agronomy/AgronomicEngine";
import { FertilizerCalculator } from "@/lib/agronomy/FertilizerCalculator";
import { generateAndPersistAnalysisPlanning } from "@/lib/agronomy/persistence";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    let analysis = await prisma.soilAnalysis.findUnique({
      where: { id },
      include: {
        parameters: true,
        recommendations: true,
        strategies: {
          include: {
            items: {
              include: { fertilizer: true },
            },
          },
        },
        cropPlannings: {
          include: { fertilizer: true },
        },
        field: { include: { property: true } },
      },
    });

    if (!analysis) {
      return NextResponse.json({ message: "Análise não encontrada." }, { status: 404 });
    }

    // Verify ownership
    if (analysis.field.property.userId !== session.user.id) {
      const member = await prisma.propertyMember.findUnique({
        where: { propertyId_userId: { propertyId: analysis.field.propertyId, userId: session.user.id } },
      });
      if (!member) {
        return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
      }
    }

    // Se as recomendações ou estratégias não foram geradas/salvas ainda, gera e persiste perfeitamente
    if (!analysis.recommendations || analysis.recommendations.length === 0) {
      await generateAndPersistAnalysisPlanning(id);
      analysis = await prisma.soilAnalysis.findUnique({
        where: { id },
        include: {
          parameters: true,
          recommendations: true,
          strategies: {
            include: {
              items: {
                include: { fertilizer: true },
              },
            },
          },
          cropPlannings: {
            include: { fertilizer: true },
          },
          field: { include: { property: true } },
        },
      });
    }

    const cropKey = analysis?.culturaDesejada || "soja";
    const yieldRaw = analysis?.produtividade || 60; // 60 sc/ha default
    const yieldTon = AgronomicEngine.scToTon(yieldRaw, cropKey);

    // Extract parameters
    const getParam = (el: string) => {
      const match = analysis?.parameters.find((p) => {
        const cleanP = p.element.toUpperCase().replace(/[\s_]+/g, "");
        const cleanEl = el.toUpperCase().replace(/[\s_]+/g, "");
        return cleanP === cleanEl || cleanP === cleanEl.replace("%", "PERCENT");
      });
      return match?.value || 0;
    };

    const ph = getParam("pH");
    const p = getParam("P");
    const k = getParam("K");
    const ca = getParam("Ca");
    const mg = getParam("Mg");
    const al = getParam("Al");
    const directV = getParam("V_percent") || getParam("V%") || getParam("V");
    const directCtc = getParam("CTC") || getParam("T");
    const h_al = getParam("H+Al") || getParam("H+AL") || getParam("H_Al") || getParam("H_AL") || getParam("H + Al") || getParam("HAL") || getParam("H");

    const sb = ca + mg + k;

    // Calcular CTC e V% de forma agronômica consistente
    let ctc = 0;
    let vPercent = 0;

    if (directCtc > 0) {
      ctc = directCtc;
      vPercent = directV > 0 ? directV : (sb > 0 ? (sb / ctc) * 100 : 0);
    } else if (h_al > 0) {
      ctc = sb + h_al;
      vPercent = directV > 0 ? directV : (ctc > 0 ? (sb / ctc) * 100 : 0);
    } else if (directV > 0) {
      vPercent = directV;
      ctc = vPercent > 0 && sb > 0 ? (sb / (vPercent / 100)) : (sb > 0 ? sb + 2.5 : 5.0);
    } else {
      // Se não veio H+Al nem CTC nem V%:
      if (ph > 0 && ph < 5.5) {
        // Solo ácido (ex: pH 3.9) tem saturação por bases baixa (15% a 45%)
        vPercent = Math.max(10, Math.min(50, (ph - 3.0) * 16));
        const estimatedHAl = al > 0 ? Math.max(al * 2.5, 2.5) : (sb > 0 ? sb * ((100 - vPercent) / Math.max(1, vPercent)) : 4.0);
        ctc = sb > 0 ? sb + estimatedHAl : 5.0;
      } else if (ph >= 6.8) {
        vPercent = 80;
        ctc = sb > 0 ? sb : 5.0;
      } else {
        vPercent = 60;
        ctc = sb > 0 ? sb + 1.5 : 5.0;
      }
    }

    // Interpretations
    const diagnosis = {
      pH: { value: ph, level: AgronomicEngine.interpretNutrient("pH", ph) },
      P: { value: p, level: AgronomicEngine.interpretNutrient("P", p) },
      K: { value: k, level: AgronomicEngine.interpretNutrient("K", k) },
      Ca: { value: ca, level: AgronomicEngine.interpretNutrient("Ca", ca) },
      Mg: { value: mg, level: AgronomicEngine.interpretNutrient("Mg", mg) },
      V: { value: vPercent.toFixed(1), level: AgronomicEngine.interpretNutrient("V%", vPercent) },
    };

    // Calculate Liming & Acidification
    const isAlkaline = ph >= 6.8;
    const isAcid = ph > 0 && ph < 5.5;

    let limingTonPerHa = 0;
    if (isAlkaline) {
      limingTonPerHa = 0;
    } else {
      limingTonPerHa = AgronomicEngine.calculateLiming(ctc, vPercent, cropKey, 100, ph);
    }

    const sulfurKgHa = ph > 6.5
      ? AgronomicEngine.calculateAcidification(ph)
      : 0;

    // Calculate NPK Needs
    const nRec = analysis?.recommendations.find((r) => r.nutrient === "N")?.recommendedDose;
    const pRec = analysis?.recommendations.find((r) => r.nutrient === "P2O5")?.recommendedDose;
    const kRec = analysis?.recommendations.find((r) => r.nutrient === "K2O")?.recommendedDose;

    const npkNeeds = {
      N: nRec ?? AgronomicEngine.calculateNPK(cropKey, yieldTon, diagnosis.P.level, diagnosis.K.level).N,
      P2O5: pRec ?? AgronomicEngine.calculateNPK(cropKey, yieldTon, diagnosis.P.level, diagnosis.K.level).P2O5,
      K2O: kRec ?? AgronomicEngine.calculateNPK(cropKey, yieldTon, diagnosis.P.level, diagnosis.K.level).K2O,
    };

    // Strategy from DB
    const primaryStrategy = analysis?.strategies[0];
    const strategy = primaryStrategy
      ? primaryStrategy.items.map((item) => ({
          fertilizer: {
            id: item.fertilizer.id,
            name: item.fertilizer.name,
          },
          kgPerHa: item.doseKgHa,
          nutrientsSupplied: FertilizerCalculator.calculateSupplied(
            {
              id: item.fertilizer.id,
              name: item.fertilizer.name,
              N: (item.fertilizer.composition as any)?.N ?? 0,
              P2O5: (item.fertilizer.composition as any)?.P2O5 ?? 0,
              K2O: (item.fertilizer.composition as any)?.K2O ?? 0,
            },
            item.doseKgHa
          ),
        }))
      : FertilizerCalculator.generateBasicStrategy(npkNeeds);

    return NextResponse.json({
      crop: cropKey,
      yieldTonPerHa: yieldTon.toFixed(2),
      diagnosis,
      liming: {
        needed: limingTonPerHa > 0,
        tonPerHa: limingTonPerHa,
        isAlkaline,
        sulfurKgHa,
      },
      requirements: npkNeeds,
      strategy,
      recommendations: analysis?.recommendations,
      persistedStrategy: analysis?.strategies[0],
      cropPlannings: analysis?.cropPlannings,
      propertyName: analysis?.field?.property?.name || "Fazenda",
      fieldName: analysis?.field?.name || "Talhão",
      city: analysis?.field?.property?.city || "",
      state: analysis?.field?.property?.state || "",
      date: analysis?.date,
    });
  } catch (error) {
    console.error("Diagnosis Error:", error);
    return NextResponse.json({ message: "Erro interno no servidor." }, { status: 500 });
  }
}
