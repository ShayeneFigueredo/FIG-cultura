import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgronomicEngine } from "@/lib/agronomy/AgronomicEngine";
import { FertilizerCalculator } from "@/lib/agronomy/FertilizerCalculator";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const analysis = await prisma.soilAnalysis.findUnique({
      where: { id },
      include: { parameters: true, field: { include: { property: true } } }
    });

    if (!analysis) {
      return NextResponse.json({ message: "Análise não encontrada." }, { status: 404 });
    }

    // Verify ownership (simplified for MVP)
    if (analysis.field.property.userId !== session.user.id) {
      // Allow if they are in the property team
      const member = await prisma.propertyMember.findUnique({
        where: { propertyId_userId: { propertyId: analysis.field.propertyId, userId: session.user.id } }
      });
      if (!member) {
        return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
      }
    }

    const cropKey = analysis.culturaDesejada || "soja";
    const yieldRaw = analysis.produtividade || 60; // 60 sc/ha default
    const yieldTon = AgronomicEngine.scToTon(yieldRaw, cropKey);

    // Extract parameters
    const getParam = (el: string) => analysis.parameters.find(p => p.element.toUpperCase() === el.toUpperCase())?.value || 0;
    
    const ph = getParam("pH");
    const p = getParam("P");
    const k = getParam("K");
    const ca = getParam("Ca");
    const mg = getParam("Mg");
    const h_al = getParam("H+Al") || getParam("H+AL");
    
    const sb = ca + mg + k;
    const ctc = sb + h_al;
    const vPercent = ctc > 0 ? (sb / ctc) * 100 : 0;

    // Interpretations
    const diagnosis = {
      pH: { value: ph, level: AgronomicEngine.interpretNutrient("pH", ph) },
      P: { value: p, level: AgronomicEngine.interpretNutrient("P", p) },
      K: { value: k, level: AgronomicEngine.interpretNutrient("K", k) },
      Ca: { value: ca, level: AgronomicEngine.interpretNutrient("Ca", ca) },
      Mg: { value: mg, level: AgronomicEngine.interpretNutrient("Mg", mg) },
      V: { value: vPercent.toFixed(1), level: AgronomicEngine.interpretNutrient("V%", vPercent) }
    };

    // Calculate Liming
    const limingTonPerHa = AgronomicEngine.calculateLiming(ctc, vPercent, cropKey, 100);

    // Calculate NPK Needs
    const npkNeeds = AgronomicEngine.calculateNPK(cropKey, yieldTon, diagnosis.P.level, diagnosis.K.level);

    // Generate basic fertilizer strategy
    const strategy = FertilizerCalculator.generateBasicStrategy(npkNeeds);

    return NextResponse.json({
      crop: cropKey,
      yieldTonPerHa: yieldTon.toFixed(2),
      diagnosis,
      liming: {
        needed: limingTonPerHa > 0,
        tonPerHa: limingTonPerHa
      },
      requirements: npkNeeds,
      strategy
    });
  } catch (error) {
    console.error("Diagnosis Error:", error);
    return NextResponse.json({ message: "Erro interno no servidor." }, { status: 500 });
  }
}
