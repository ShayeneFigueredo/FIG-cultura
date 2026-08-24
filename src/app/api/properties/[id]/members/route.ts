import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: propertyId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    // Verify ownership
    const property = await prisma.property.findFirst({
      where: { id: propertyId, userId: session.user.id }
    });

    if (!property) {
      return NextResponse.json({ message: "Propriedade não encontrada ou sem permissão." }, { status: 404 });
    }

    const { emails, userId } = await req.json();

    if (userId) {
      // Adding a single user via ID
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });

      // Check if already member
      const existing = await prisma.propertyMember.findUnique({
        where: { propertyId_userId: { propertyId, userId } }
      });
      if (existing) return NextResponse.json({ message: "Usuário já é membro da equipe." }, { status: 400 });

      await prisma.propertyMember.create({
        data: { propertyId, userId, role: "MEMBER" }
      });

      return NextResponse.json({ message: "Membro adicionado com sucesso." });
    }

    if (emails && Array.isArray(emails)) {
      // Bulk add by email
      const normalizedEmails = emails.map((e: string) => e.toLowerCase().trim()).filter(e => e.length > 0);
      
      const users = await prisma.user.findMany({
        where: { email: { in: normalizedEmails } }
      });

      const addedEmails: string[] = [];
      const notFoundEmails: string[] = [];
      
      const userEmailsFound = users.map(u => u.email);
      normalizedEmails.forEach(email => {
        if (!userEmailsFound.includes(email)) notFoundEmails.push(email);
      });

      // Insert members who are not already in the property
      for (const user of users) {
        if (user.id === session.user.id) continue; // Don't add the owner

        const existing = await prisma.propertyMember.findUnique({
          where: { propertyId_userId: { propertyId, userId: user.id } }
        });

        if (!existing) {
          await prisma.propertyMember.create({
            data: { propertyId, userId: user.id, role: "STUDENT" }
          });
          addedEmails.push(user.email);
        }
      }

      return NextResponse.json({ 
        message: "Operação concluída.",
        added: addedEmails,
        notFound: notFoundEmails
      });
    }

    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });

  } catch (error) {
    console.error("Property Member Add Error:", error);
    return NextResponse.json({ message: "Erro interno no servidor." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: propertyId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    // Verify ownership
    const property = await prisma.property.findFirst({
      where: { id: propertyId, userId: session.user.id }
    });

    if (!property) {
      return NextResponse.json({ message: "Propriedade não encontrada ou sem permissão." }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "ID do usuário não fornecido." }, { status: 400 });
    }

    await prisma.propertyMember.delete({
      where: { propertyId_userId: { propertyId, userId } }
    });

    return NextResponse.json({ message: "Membro removido com sucesso." });
  } catch (error) {
    console.error("Property Member Delete Error:", error);
    return NextResponse.json({ message: "Erro interno no servidor." }, { status: 500 });
  }
}
