import { prisma } from '@/lib/db';
import type { PortfolioSnapshot, AssetBalance, MarginLoan } from '@prisma/client';

export class PortfolioService {
  static async getLatestSnapshot() {
    return prisma.portfolioSnapshot.findFirst({
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        assetBalances: true,
        marginLoans: true,
      },
    });
  }

  static async createSnapshot(data: {
    totalValue: number;
    netValue: number;
    assets: Omit<AssetBalance, 'id' | 'snapshotId'>[];
    loans?: Omit<MarginLoan, 'id' | 'snapshotId'>[];
  }) {
    return prisma.portfolioSnapshot.create({
      data: {
        totalValue: data.totalValue,
        netValue: data.netValue,
        assetBalances: {
          create: data.assets,
        },
        marginLoans: {
          create: data.loans || [],
        },
      },
      include: {
        assetBalances: true,
        marginLoans: true,
      },
    });
  }

  static async getHistoricalData(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return prisma.portfolioSnapshot.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
      include: {
        assetBalances: true,
        marginLoans: true,
      },
    });
  }
} 