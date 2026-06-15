import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.ticket.update({
      where: { id: 15 },
      data: {
        status: "IN_PROGRESS",
        priority: "MEDIUM"
      }
    });
    console.log("Success:", result);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
