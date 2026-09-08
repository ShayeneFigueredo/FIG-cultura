import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ message: "Erro interno no servidor." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const { name, email, avatarUrl } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ message: "Nome e e-mail são obrigatórios." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is already taken by someone else
    if (normalizedEmail !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json({ message: "E-mail já está em uso." }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email: normalizedEmail,
        avatarUrl: avatarUrl || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      }
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: "Erro interno no servidor." }, { status: 500 });
  }
}
