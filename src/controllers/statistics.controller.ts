import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { sendSuccess } from '../utils/response.js';

export async function getStatistics(req: Request, res: Response) {
  // Mengambil statistik dasar dan pengelompokan data
  const [
    totalPlayers,
    totalHeroesOwned,
    diamondResult,
    heroOwnership,
    heroesPerRole,
  ] = await Promise.all([
    // Menghitung jumlah player
    prisma.player.count(),

    // Menghitung total hero yang dimiliki semua player
    prisma.playerHero.count(),

    // Menjumlahkan seluruh diamond player
    prisma.player.aggregate({
      _sum: { diamond: true },
    }),

    // Mengelompokkan kepemilikan hero
    prisma.playerHero.groupBy({
      by: ['heroId'],
      _count: { heroId: true },
      orderBy: {
        _count: { heroId: 'desc' },
      },
      take: 1,
    }),

    // Mengelompokkan hero berdasarkan role
    prisma.hero.groupBy({
      by: ['role'],
      _count: { _all: true },
      orderBy: { role: 'asc' },
    }),
  ]);

  // Mengambil nama hero yang paling banyak dimiliki
  let mostOwnedHero = null;

  if (heroOwnership.length > 0) {
    const heroId = heroOwnership[0].heroId;

    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
      select: { name: true },
    });

    if (hero) {
      mostOwnedHero = {
        heroId,
        name: hero.name,
        owners: heroOwnership[0]._count.heroId,
      };
    }
  }

  // Menyusun jumlah hero berdasarkan role
  const roleStatistics = heroesPerRole.map((item) => ({
    role: item.role,
    total: item._count._all,
  }));

  sendSuccess(res, {
    message: 'Berhasil mengambil statistik',
    data: {
      totalPlayers,
      totalHeroesOwned,
      totalDiamond: diamondResult._sum.diamond ?? 0,
      mostOwnedHero,
      heroesPerRole: roleStatistics,
    },
  });
}
