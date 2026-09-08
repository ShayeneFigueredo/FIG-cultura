import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const coordinates = body?.coordinates as [number, number][] | undefined;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
      return NextResponse.json(
        { message: "É necessário informar ao menos 3 pontos para formar o polígono do talhão." },
        { status: 400 }
      );
    }

    // Verifica se o talhão pertence ao usuário logado
    const field = await prisma.field.findFirst({
      where: {
        id,
        property: { userId: session.user.id },
      },
    });

    if (!field) {
      return NextResponse.json({ message: "Talhão não encontrado." }, { status: 404 });
    }

    // Atualiza coordenadas e ponto central (latitude/longitude)
    const centerLat = coordinates.reduce((acc, c) => acc + c[0], 0) / coordinates.length;
    const centerLng = coordinates.reduce((acc, c) => acc + c[1], 0) / coordinates.length;

    const updatedField = await prisma.field.update({
      where: { id },
      data: {
        coordinates: coordinates as any,
        latitude: centerLat,
        longitude: centerLng,
      },
    });

    return NextResponse.json({
      message: "Desenho do talhão salvo com sucesso!",
      coordinates: updatedField.coordinates,
    });
  } catch (error) {
    console.error("Erro ao salvar coordenadas do talhão:", error);
    return NextResponse.json({ message: "Erro interno no servidor." }, { status: 500 });
  }
}
