import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Unidades padrão por elemento (análise de solo no Brasil)
const UNIT_BY_ELEMENT: Record<string, string> = {
  pH: "",
  P: "mg/dm³",
  K: "cmolc/dm³",
  Ca: "cmolc/dm³",
  Mg: "cmolc/dm³",
  MO: "dag/kg",
  S: "mg/dm³",
  CTC: "cmolc/dm³",
  V_percent: "%",
  m_percent: "%",
};

type PhysicalInput = { argila?: unknown; silte?: unknown; areia?: unknown };
type ChemicalInput = Record<string, unknown>;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const fieldId = body?.fieldId as string | undefined;
    const date = body?.date as string | undefined;
    const profundidade = (body?.profundidade as string | undefined) || "0-20";
    const culturaAnterior = (body?.culturaAnterior as string | undefined) || null;
    const culturaDesejada = (body?.culturaDesejada as string | undefined) || null;
    const parametrosQuimicos = (body?.parametrosQuimicos ?? {}) as ChemicalInput;
    const parametrosFisicos = (body?.parametrosFisicos ?? {}) as PhysicalInput;

    if (!fieldId) {
      return NextResponse.json({ message: "Selecione o talhão da análise." }, { status: 400 });
    }

    // Garante que o talhão pertence a uma propriedade do usuário logado
    const field = await prisma.field.findFirst({
      where: {
        id: fieldId,
        property: { userId: session.user.id },
      },
    });

    if (!field) {
      return NextResponse.json({ message: "Talhão não encontrado." }, { status: 404 });
    }

    // Monta apenas os parâmetros preenchidos
    const parameters = Object.entries(parametrosQuimicos)
      .filter(([, value]) => toNullableNumber(value) !== null)
      .map(([element, value]) => ({
        element,
        value: Number(value),
        unit: UNIT_BY_ELEMENT[element] ?? "",
      }));

    const hasPhysical = Object.values(parametrosFisicos).some((v) => toNullableNumber(v) !== null);

    const analysis = await prisma.soilAnalysis.create({
      data: {
        fieldId,
        date: date ? new Date(date) : new Date(),
        depth: profundidade,
        culturaAnterior,
        culturaDesejada,
        parameters: { create: parameters },
        ...(hasPhysical
          ? {
              physicalChars: {
                create: {
                  argila: toNullableNumber(parametrosFisicos.argila),
                  silte: toNullableNumber(parametrosFisicos.silte),
                  areia: toNullableNumber(parametrosFisicos.areia),
                },
              },
            }
          : {}),
      },
      include: { parameters: true, physicalChars: true },
    });

    return NextResponse.json({ id: analysis.id }, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar análise:", error);
    return NextResponse.json({ message: "Erro interno ao salvar análise." }, { status: 500 });
  }
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) {
    return null;
  }
  return Number(value);
}
