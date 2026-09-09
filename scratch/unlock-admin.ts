import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find all ADMIN users or admin email
  const admins = await prisma.user.findMany({
    where: {
      OR: [
        { role: "ADMIN" },
        { email: { contains: "admin" } }
      ]
    }
  });

  console.log("Found admin candidate users:", admins.map(u => ({ id: u.id, email: u.email, role: u.role, subscriptionStatus: u.subscriptionStatus })));

  const updated = await prisma.user.updateMany({
    where: {
      OR: [
        { role: "ADMIN" },
        { email: { contains: "admin" } }
      ]
    },
    data: {
      subscriptionStatus: "ACTIVE"
    }
  });

  console.log("Updated users count:", updated.count);

  // Also check all users to see their status
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, subscriptionStatus: true }
  });
  console.log("All users in DB:", JSON.stringify(allUsers, null, 2));
}

main()
  .catch((e) => {
    console.error("Error updating admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
