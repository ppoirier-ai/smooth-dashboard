import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.binanceAccount.findMany({
    where: {
      viewToken: null
    }
  });

  for (const account of accounts) {
    await prisma.binanceAccount.update({
      where: { id: account.id },
      data: { viewToken: createId() }
    });
  }

  console.log(`Updated ${accounts.length} accounts with view tokens`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 