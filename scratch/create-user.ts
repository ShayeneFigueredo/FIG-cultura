import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt-ts";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@cultiva.com";
  const password = "mudar123";
  const hashedPassword = await hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name: "Admin",
      role: "ADMIN",
      subscriptionStatus: "ACTIVE"
    },
    create: {
      email,
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
      subscriptionStatus: "ACTIVE"
    }
  });

  console.log("User created:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
