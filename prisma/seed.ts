import "dotenv/config";
import { hash } from "bcrypt-ts";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FERTILIZERS = [
  { name: "MAP", composition: { N: 11, P2O5: 52, K2O: 0 } },
  { name: "KCl", composition: { N: 0, P2O5: 0, K2O: 60 } },
  { name: "Ureia", composition: { N: 45, P2O5: 0, K2O: 0 } },
  { name: "Calcário Dolomítico", composition: { CaO: 30, MgO: 15 } },
  { name: "08-28-16", composition: { N: 8, P2O5: 28, K2O: 16 } },
  { name: "Superfosfato Simples", composition: { N: 0, P2O5: 18, K2O: 0 } },
];

async function main() {
  // Usuário de demonstração (senha: teste123)
  const hashedPassword = await hash("teste123", 10);
  const user = await prisma.user.upsert({
    where: { email: "teste@fig.com" },
    update: { password: hashedPassword },
    create: {
      name: "Usuário Teste",
      email: "teste@fig.com",
      password: hashedPassword,
      role: "USER",
    },
  });
  console.log("Usuário de demonstração:", user.email, "(senha: teste123)");

  // Fertilizantes base para o motor agronômico
  for (const f of FERTILIZERS) {
    const existing = await prisma.fertilizer.findFirst({ where: { name: f.name } });
    if (!existing) {
      await prisma.fertilizer.create({ data: f });
      console.log("Fertilizante criado:", f.name);
    }
  }

  const total = await prisma.fertilizer.count();
  console.log(`Seed concluído. ${total} fertilizantes disponíveis.`);
}

main()
  .catch((e) => {
    console.error("Seed Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
