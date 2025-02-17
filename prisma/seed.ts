import { PrismaClient } from '@prisma/client';
import { encrypt } from '../lib/crypto';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database...');
  await prisma.binanceAccount.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();
  console.log('Database cleaned');

  console.log('Creating test user...');
  const user = await prisma.user.create({
    data: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    },
  });
  console.log('Test user created:', user.id);

  console.log('Creating API key...');
  const apiKey = await prisma.apiKey.create({
    data: {
      name: 'Test API Key',
      userId: user.id,
      isActive: true,
    },
  });
  console.log('API key created:', apiKey.id);

  console.log('Creating Binance account...');
  const {
    encryptedData: apiKeyEncrypted,
    iv: apiKeyIV,
    tag: apiKeyTag
  } = encrypt('test-api-key');

  const {
    encryptedData: secretKeyEncrypted,
    iv: secretKeyIV,
    tag: secretKeyTag
  } = encrypt('test-secret-key');

  const binanceAccount = await prisma.binanceAccount.create({
    data: {
      userId: user.id,
      apiKeyId: apiKey.id,
      encryptedKey: apiKeyEncrypted,
      apiKeyIV,
      apiKeyTag,
      apiSecret: secretKeyEncrypted,
      secretKeyIV,
      secretKeyTag,
      viewToken: crypto.randomBytes(32).toString('hex'),
    },
  });
  console.log('Binance account created:', binanceAccount.id);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 