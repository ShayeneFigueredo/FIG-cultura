import { NextResponse } from "next/server";
import { hash } from "bcrypt-ts";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password, avatarUrl } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Preencha todos os campos." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return NextResponse.json({ message: "E-mail já cadastrado." }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        avatarUrl: avatarUrl || null,
        subscriptionStatus: "PENDING",
        subscriptionEndsAt: null,
      }
    });

    return NextResponse.json({ message: "Usuário criado com sucesso!" }, { status: 201 });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ message: "Erro interno no servidor." }, { status: 500 });
  }
}
