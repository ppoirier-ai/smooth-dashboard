import { BinanceAccount } from '@prisma/client';
import { BinanceEncryptionService } from './binance-encryption.service';
import { prisma } from '@/lib/prisma';

export class BinanceService {
  static async addAccount({
    userId,
    accountName,
    accountType,
    apiKey,
    apiSecret,
    subAccountId,
    subAccountEmail,
  }: {
    userId: string;
    accountName: string;
    accountType: string;
    apiKey: string;
    apiSecret: string;
    subAccountId?: string;
    subAccountEmail?: string;
  }) {
    const encrypted = BinanceEncryptionService.encryptCredentials(apiKey, apiSecret);

    return prisma.binanceAccount.create({
      data: {
        userId,
        accountName,
        accountType,
        apiKey: encrypted.apiKey.encrypted,
        apiSecret: encrypted.apiSecret.encrypted,
        encryptionIV: encrypted.iv,
        encryptionTag: `${encrypted.apiKey.tag}:${encrypted.apiSecret.tag}`,
        subAccountId,
        subAccountEmail,
      },
    });
  }

  static async getDecryptedCredentials(account: BinanceAccount) {
    const [keyTag, secretTag] = account.encryptionTag.split(':');
    
    return BinanceEncryptionService.decryptCredentials(
      account.apiKey,
      account.apiSecret,
      account.encryptionIV,
      keyTag,
      secretTag
    );
  }

  static async listAccounts(userId: string) {
    return prisma.binanceAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateAccount(
    id: string,
    data: {
      accountName?: string;
      accountType?: string;
      apiKey?: string;
      apiSecret?: string;
      isActive?: boolean;
      subAccountId?: string;
      subAccountEmail?: string;
    }
  ) {
    const updateData: any = { ...data };
    
    if (data.apiKey && data.apiSecret) {
      const encrypted = BinanceEncryptionService.encryptCredentials(
        data.apiKey,
        data.apiSecret
      );
      
      updateData.apiKey = encrypted.apiKey.encrypted;
      updateData.apiSecret = encrypted.apiSecret.encrypted;
      updateData.encryptionIV = encrypted.iv;
      updateData.encryptionTag = `${encrypted.apiKey.tag}:${encrypted.apiSecret.tag}`;
    }

    return prisma.binanceAccount.update({
      where: { id },
      data: updateData,
    });
  }

  static async deleteAccount(id: string) {
    return prisma.binanceAccount.delete({
      where: { id },
    });
  }
} 