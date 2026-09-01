"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getChatSessions() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.chatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function getChatMessages(sessionId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const chatSession = await prisma.chatSession.findUnique({
    where: { id: sessionId },
  });

  if (!chatSession || chatSession.userId !== session.user.id) {
    throw new Error("Not found or unauthorized");
  }

  return prisma.chatMessage.findMany({
    where: { chatSessionId: sessionId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, text: true },
  });
}

export async function createChatSession(firstMessageText: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Generate a title based on the first message (up to 30 chars)
  const title = firstMessageText.length > 30 
    ? firstMessageText.substring(0, 30) + "..." 
    : firstMessageText;

  const newSession = await prisma.chatSession.create({
    data: {
      userId: session.user.id,
      title,
    },
  });

  return newSession;
}

export async function saveChatMessage(sessionId: string, role: "user" | "ai", text: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify ownership
  const chatSession = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });

  if (!chatSession || chatSession.userId !== session.user.id) {
    throw new Error("Not found or unauthorized");
  }

  const message = await prisma.chatMessage.create({
    data: {
      chatSessionId: sessionId,
      role,
      text,
    },
  });

  // Update session updatedAt to bubble it to the top
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });

  return message;
}
